import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { getAuthUser } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import {
  updateEstadoInformeSchema,
  updateDatosComponenteSchema,
} from '../validation/informes.validation';
import { initDatos } from '../lib/initDatos';
import { assembleReport, buildPlaceholderContext } from '../lib/assembleReport';
import type { AssemblyComponente } from '../lib/assembleReport';
import { generateTemplateForModel } from '../lib/generateTemplate';
import fs from 'node:fs';
import path from 'node:path';

// ===== Manuales (servidos CON LOGIN desde una carpeta privada del servidor) =====
const MANUALES_DIR = (() => {
  if (process.env.MANUALES_DIR) return process.env.MANUALES_DIR;
  // Subir desde __dirname hasta el package.json del proyecto (app/ en local; nodejs/ en el server,
  // que en el build está MUCHOS niveles por encima de dist/server/src/routes). El buscador anterior
  // solo miraba 3 niveles fijos → en producción no llegaba a nodejs/ y MANUALES_DIR apuntaba mal.
  let d = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(d, 'package.json'))) break;
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
  return path.join(d, '..', 'manuales');
})();
const BRANCH_BY_TIPO: Record<string, string> = {
  mechanical_unit: 'Manipuladores', controller: 'Controladoras', drive_unit: 'Controladoras', external_axis: 'EjesExternos',
};
/** Raíz de las ramas: admite manuales/<rama> o manuales/ABB Manuals/<rama>. */
function manualesBranchRoot(): string {
  for (const c of [MANUALES_DIR, path.join(MANUALES_DIR, 'ABB Manuals')]) {
    try { if (fs.existsSync(path.join(c, 'Manipuladores'))) return c; } catch { /* noop */ }
  }
  return MANUALES_DIR;
}
function normNombre(s: string): string { return s.toUpperCase().replace(/[^A-Z0-9]/g, ''); }
/** "Tipo/familia" del modelo para ejes externos: letras iniciales (IRBT, IRBP, IRP, IRT, MID, MTD, MU...). */
function tipoToken(s: string): string { const m = s.toUpperCase().match(/^[A-Z]+/); return m ? m[0] : ''; }
export interface ManualRef { nombre: string; ruta: string; general?: boolean }
/**
 * Todos los manuales que ayudan a un modelo. La estructura NO es uniforme:
 *  - Manipuladores/Controladoras: subcarpeta por modelo (nombre = prefijo del modelo) → todos sus PDFs.
 *  - EjesExternos: PDFs sueltos en la raíz de la rama → se casan por familia (tipo: IRBT, IRBP, IRP...).
 *  - Generales (lubricación/gearbox) en la raíz de Manipuladores → para toda unidad mecánica.
 * Devuelve rutas relativas a la raíz de manuales (para servir luego por `ruta`, anti-traversal).
 */
export function findManuales(modeloNombre: string, tipo: string): ManualRef[] {
  const root = manualesBranchRoot();
  const branch = BRANCH_BY_TIPO[tipo] || 'Manipuladores';
  const branchDir = path.join(root, branch);
  if (!fs.existsSync(branchDir)) return [];
  const nm = normNombre(modeloNombre);
  const tok = normNombre(tipoToken(modeloNombre));
  const out: ManualRef[] = [];
  const add = (full: string, general = false) => out.push({ nombre: path.basename(full), ruta: path.relative(root, full), general });
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(branchDir, { withFileTypes: true }); } catch { return []; }
  const isPdf = (n: string) => n.toLowerCase().endsWith('.pdf');
  // 1) Subcarpeta del modelo (coincidencia de prefijo más larga) → todos sus PDFs.
  let bestDir: string | null = null, bestLen = 0;
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const nf = normNombre(e.name);
    if (nf && nm.startsWith(nf) && nf.length > bestLen) { bestDir = path.join(branchDir, e.name); bestLen = nf.length; }
  }
  if (bestDir) { try { for (const f of fs.readdirSync(bestDir)) if (isPdf(f)) add(path.join(bestDir, f)); } catch { /* noop */ } }
  // 2) PDFs sueltos en la raíz de la rama.
  for (const e of entries) {
    if (!e.isFile() || !isPdf(e.name)) continue;
    const fn = normNombre(e.name);
    const esGeneral = fn.includes('LUBRICATION') || fn.includes('GEARBOX');
    if (branch === 'Manipuladores' && esGeneral) { add(path.join(branchDir, e.name), true); continue; }
    // Ejes externos (y similares): casar por familia/tipo presente en el nombre del fichero.
    if (branch === 'EjesExternos' && tok.length >= 2 && fn.includes(tok)) { add(path.join(branchDir, e.name)); }
  }
  // Dedup por ruta.
  const seen = new Set<string>();
  return out.filter((m) => (seen.has(m.ruta) ? false : (seen.add(m.ruta), true)));
}
/** Resuelve y valida una ruta de manual (relativa a la raíz de manuales) para servirla. Anti-traversal. */
export function resolveManualPath(ruta: string): string | null {
  if (!ruta || ruta.includes('..') || ruta.includes('\0')) return null;
  const root = path.resolve(manualesBranchRoot());
  const full = path.resolve(root, ruta);
  if (!full.startsWith(root + path.sep) || !full.toLowerCase().endsWith('.pdf')) return null;
  try { return fs.existsSync(full) ? full : null; } catch { return null; }
}
async function modeloDeComponenteInforme(ciId: number): Promise<{ nombre: string; tipo: string } | null> {
  const ci = await prisma.componenteInforme.findUnique({
    where: { id: ciId },
    select: { componenteSistema: { select: { modeloComponente: { select: { nombre: true, tipo: true } } } } },
  });
  const m = ci?.componenteSistema?.modeloComponente;
  return m ? { nombre: m.nombre, tipo: m.tipo as string } : null;
}

const router = Router();

// ================================================================
// POST /intervenciones/:intervencionId/informes
// Admin only. Atomic: creates one Informe per sistema, one
// ComponenteInforme per ComponenteSistema in that sistema.
// ================================================================
router.post(
  '/intervenciones/:intervencionId/informes',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const intervencionId = Number(req.params.intervencionId);
      const user = getAuthUser(req);

      const intervencion = await prisma.intervencion.findUnique({
        where: { id: intervencionId },
        include: {
          sistemas: {
            include: {
              sistema: {
                include: {
                  componentes: {
                    orderBy: { orden: 'asc' },
                    include: {
                      modeloComponente: {
                        include: {
                          versiones: {
                            where: { estado: 'activo' },
                            orderBy: { version: 'desc' },
                            take: 1,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          informes: { select: { sistemaId: true } },
        },
      });

      if (!intervencion) {
        res.status(404).json({ error: 'Intervencion no encontrada' });
        return;
      }

      // Idempotency: skip sistemas that already have informes
      const existingSistemaIds = new Set(
        intervencion.informes.map((i) => i.sistemaId),
      );
      const sistemasToProcess = intervencion.sistemas.filter(
        (is) => !existingSistemaIds.has(is.sistemaId),
      );

      if (sistemasToProcess.length === 0) {
        res.status(409).json({
          error: 'Ya existen informes para todos los sistemas de esta intervencion',
        });
        return;
      }

      const created = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const is of sistemasToProcess) {
          const sistema = is.sistema;

          const informe = await tx.informe.create({
            data: {
              intervencionId,
              sistemaId: sistema.id,
              estado: 'inactivo',
              creadoPorId: user.id,
            },
          });

          for (let i = 0; i < sistema.componentes.length; i++) {
            const comp = sistema.componentes[i]!;

            // Find active version; fallback to most recent if none active
            let version = comp.modeloComponente.versiones[0];

            if (!version) {
              const fallback = await tx.versionTemplate.findFirst({
                where: { modeloComponenteId: comp.modeloComponenteId },
                orderBy: { version: 'desc' },
              });

              if (!fallback) {
                console.warn(
                  `[informes] No hay version de template para modeloComponenteId=${comp.modeloComponenteId}. Componente ${comp.etiqueta} omitido.`,
                );
                continue;
              }

              console.warn(
                `[informes] Sin version activa para modeloComponenteId=${comp.modeloComponenteId}. Usando version ${fallback.version} (${fallback.estado}).`,
              );
              version = fallback;
            }

            const schemaCongelado = version.schema as {
              blocks: { id: string; type: string; config: Record<string, unknown> }[];
              pageConfig?: unknown;
            };
            const datos = initDatos(schemaCongelado);

            await tx.componenteInforme.create({
              data: {
                informeId: informe.id,
                componenteSistemaId: comp.id,
                versionTemplateId: version.id,
                tipoComponente: comp.tipo,
                etiqueta: comp.etiqueta,
                orden: i,
                schemaCongelado: schemaCongelado as object,
                datos: datos as object,
              },
            });
          }

          results.push(informe);
        }

        return results;
      });

      res.status(201).json({ created: created.length, informes: created });
    } catch (err) {
      next(err);
    }
  },
);

// ================================================================
// GET /informes/:id
// Any authenticated user. Returns full informe with components.
// ================================================================
router.get(
  '/informes/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const informe = await prisma.informe.findUnique({
        where: { id: Number(req.params.id) },
        include: {
          intervencion: {
            select: {
              id: true, titulo: true, tipo: true, estado: true,
              referencia: true, fechaInicio: true, fechaFin: true,
              cliente: {
                select: {
                  id: true, nombre: true, sede: true,
                  direccion: true, ciudad: true, codigoPostal: true,
                  provincia: true, telefono: true, email: true,
                  personaContacto: true,
                },
              },
            },
          },
          sistema: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              fabricante: { select: { id: true, nombre: true } },
              maquina: { select: { id: true, nombre: true } },
            },
          },
          creadoPor: { select: { id: true, nombre: true } },
          componentes: {
            orderBy: { orden: 'asc' },
            include: {
              componenteSistema: {
                select: {
                  id: true,
                  etiqueta: true,
                  tipo: true,
                  numeroSerie: true,
                  numEjes: true,
                  modeloComponente: {
                    select: { id: true, nombre: true, tipo: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!informe) {
        res.status(404).json({ error: 'Informe no encontrado' });
        return;
      }

      res.json(informe);
    } catch (err) {
      next(err);
    }
  },
);

// ================================================================
// GET /informes/:id/assembled
// Any authenticated user. Returns the fully assembled report
// merging document template + component frozen schemas.
// ================================================================
router.get(
  '/informes/:id/assembled',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const informeId = Number(req.params.id);

      // Fetch informe with full context for placeholder resolution
      const informe = await prisma.informe.findUnique({
        where: { id: informeId },
        include: {
          intervencion: {
            select: {
              id: true, titulo: true, tipo: true, estado: true,
              referencia: true, fechaInicio: true, fechaFin: true,
              cliente: {
                select: {
                  id: true, nombre: true, sede: true,
                  direccion: true, ciudad: true, codigoPostal: true,
                  provincia: true, telefono: true, email: true,
                  personaContacto: true,
                },
              },
            },
          },
          sistema: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              fabricante: { select: { id: true, nombre: true } },
              maquina: { select: { id: true, nombre: true } },
            },
          },
          creadoPor: { select: { id: true, nombre: true } },
          componentes: {
            orderBy: { orden: 'asc' },
            include: {
              componenteSistema: {
                select: {
                  id: true,
                  etiqueta: true,
                  tipo: true,
                  numeroSerie: true,
                  numEjes: true,
                  modeloComponente: {
                    select: { id: true, nombre: true, tipo: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!informe) {
        res.status(404).json({ error: 'Informe no encontrado' });
        return;
      }

      // Determine document template type from intervencion tipo
      const docTipo = informe.intervencion.tipo === 'preventiva'
        ? 'preventivo'
        : 'correctivo';

      const documentTemplate = await prisma.documentTemplate.findUnique({
        where: { tipo: docTipo },
      });

      if (!documentTemplate) {
        res.status(422).json({
          error: `No se encontro plantilla de documento para tipo "${docTipo}"`,
        });
        return;
      }

      const documentSchema = documentTemplate.schema as {
        blocks: { id: string; type: string; config: Record<string, unknown> }[];
        pageConfig?: any;
      };

      // Build placeholder context (el usuario logueado se usa como técnico de PAS)
      const authUser = getAuthUser(req);
      const usuario = authUser
        ? await prisma.user.findUnique({ where: { id: authUser.id }, select: { nombre: true, email: true } })
        : null;
      const baseContext = buildPlaceholderContext(informe, usuario ?? undefined);

      // Map component data for assembly
      const componentes: AssemblyComponente[] = informe.componentes.map((c) => ({
        id: c.id,
        componenteSistemaId: c.componenteSistemaId,
        etiqueta: c.etiqueta,
        orden: c.orden,
        tipoComponente: c.tipoComponente,
        schemaCongelado: c.schemaCongelado as {
          blocks: { id: string; type: string; config: Record<string, unknown> }[];
        },
        datos: (c.datos as Record<string, unknown>) || {},
        componenteSistema: c.componenteSistema,
      }));

      // Run assembly
      const assembled = assembleReport({
        documentSchema,
        componentes,
        baseContext,
        datosDocumento: (informe.datosDocumento as Record<string, unknown>) || {},
      });

      res.json({
        informe: {
          id: informe.id,
          estado: informe.estado,
          intervencion: {
            id: informe.intervencion.id,
            titulo: informe.intervencion.titulo,
            tipo: informe.intervencion.tipo,
            referencia: informe.intervencion.referencia,
            fechaInicio: informe.intervencion.fechaInicio,
          },
          sistema: {
            id: informe.sistema.id,
            nombre: informe.sistema.nombre,
            fabricante: informe.sistema.fabricante,
            maquina: informe.sistema.maquina,
          },
        },
        assembled,
        documentTemplate: {
          id: documentTemplate.id,
          tipo: documentTemplate.tipo,
          nombre: documentTemplate.nombre,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ================================================================
// PATCH /componentes-informe/:id/datos
// Technician or admin. Shallow-merges incoming datos.
// ================================================================
router.patch(
  '/componentes-informe/:id/datos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { datos: incoming } = updateDatosComponenteSchema.parse(req.body);
      const id = Number(req.params.id);

      const existing = await prisma.componenteInforme.findUnique({
        where: { id },
      });
      if (!existing) {
        res.status(404).json({ error: 'Componente de informe no encontrado' });
        return;
      }

      const merged = {
        ...(existing.datos as Record<string, unknown>),
        ...incoming,
      };

      const updated = await prisma.componenteInforme.update({
        where: { id },
        data: { datos: merged as object },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// ================================================================
// GET /componentes-informe/:id/manuales         — TODOS los manuales que ayudan al modelo (con login)
// GET /componentes-informe/:id/manual?ruta=...  — sirve un PDF por su ruta (con login, anti-traversal)
// ================================================================
router.get('/componentes-informe/:id/manuales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelo = await modeloDeComponenteInforme(Number(req.params.id));
    if (!modelo) { res.status(404).json({ error: 'Componente no encontrado' }); return; }
    const manuales = findManuales(modelo.nombre, modelo.tipo);
    res.json({ modelo: modelo.nombre, manuales });
  } catch (err) { next(err); }
});

router.get('/componentes-informe/:id/manual', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ruta = String(req.query.ruta || req.query.archivo || '');
    const filePath = resolveManualPath(ruta);
    if (!filePath) { res.status(404).json({ error: 'Manual no encontrado' }); return; }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(filePath))}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) { next(err); }
});

// ================================================================
// PATCH /informes/:id/datos-documento
// Technician or admin. Shallow-merges incoming document-level datos.
// ================================================================
router.patch(
  '/informes/:id/datos-documento',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { datos: incoming } = updateDatosComponenteSchema.parse(req.body);
      const id = Number(req.params.id);

      const existing = await prisma.informe.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Informe no encontrado' });
        return;
      }

      const merged = {
        ...((existing.datosDocumento as Record<string, unknown>) || {}),
        ...incoming,
      };

      const updated = await prisma.informe.update({
        where: { id },
        data: { datosDocumento: merged as object },
      });

      res.json({ id: updated.id, datosDocumento: updated.datosDocumento });
    } catch (err) {
      next(err);
    }
  },
);

// ================================================================
// PATCH /informes/:id/estado
// Admin only. Changes informe estado.
// ================================================================
router.patch(
  '/informes/:id/estado',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { estado } = updateEstadoInformeSchema.parse(req.body);
      const informe = await prisma.informe.update({
        where: { id: Number(req.params.id) },
        data: { estado },
      });
      res.json(informe);
    } catch (err) {
      next(err);
    }
  },
);

// ================================================================
// Regeneracion de plantillas en informes en borrador (no finalizados).
// ================================================================

type FrozenSchema = { blocks: { id: string; type: string; config: Record<string, unknown> }[]; pageConfig?: unknown };

/** Re-inicializa datos para el nuevo schema, preservando valores cuyas keys siguen existiendo. */
function regenDatos(schema: FrozenSchema, old: Record<string, unknown>): Record<string, unknown> {
  const fresh = initDatos(schema as { blocks: { id: string; type: string; config: Record<string, unknown> }[]; pageConfig?: unknown });
  const merged: Record<string, unknown> = { ...fresh };
  for (const k of Object.keys(fresh)) {
    if (k in old) merged[k] = old[k];
  }
  return merged;
}

async function pickVersion(modeloComponenteId: number, versionTemplateId?: number) {
  if (versionTemplateId) {
    return prisma.versionTemplate.findUnique({ where: { id: Number(versionTemplateId) } });
  }
  return (
    (await prisma.versionTemplate.findFirst({
      where: { modeloComponenteId, estado: 'activo' },
      orderBy: { version: 'desc' },
    })) ??
    (await prisma.versionTemplate.findFirst({
      where: { modeloComponenteId },
      orderBy: { version: 'desc' },
    }))
  );
}

// GET /componentes-informe/:id/versiones — plantillas disponibles para el modelo del componente
router.get(
  '/componentes-informe/:id/versiones',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ci = await prisma.componenteInforme.findUnique({
        where: { id: Number(req.params.id) },
        include: { componenteSistema: { select: { modeloComponenteId: true } } },
      });
      if (!ci) { res.status(404).json({ error: 'Componente de informe no encontrado' }); return; }
      const versiones = await prisma.versionTemplate.findMany({
        where: { modeloComponenteId: ci.componenteSistema.modeloComponenteId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, estado: true, notas: true, createdAt: true },
      });
      res.json({ actual: ci.versionTemplateId, versiones });
    } catch (err) { next(err); }
  },
);

// POST /componentes-informe/:id/regenerar — regenera schema/datos desde una version (o la activa/ultima)
router.post(
  '/componentes-informe/:id/regenerar',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const ci = await prisma.componenteInforme.findUnique({
        where: { id },
        include: {
          informe: { select: { estado: true } },
          componenteSistema: { select: { modeloComponenteId: true } },
        },
      });
      if (!ci) { res.status(404).json({ error: 'Componente de informe no encontrado' }); return; }
      if (ci.informe.estado === 'finalizado') {
        res.status(409).json({ error: 'No se puede regenerar un informe finalizado' });
        return;
      }
      const version = await pickVersion(ci.componenteSistema.modeloComponenteId, req.body?.versionTemplateId);
      if (!version) { res.status(404).json({ error: 'No hay version de plantilla para este modelo' }); return; }

      const schema = version.schema as FrozenSchema;
      const datos = regenDatos(schema, (ci.datos as Record<string, unknown>) || {});
      const updated = await prisma.componenteInforme.update({
        where: { id },
        data: { versionTemplateId: version.id, schemaCongelado: schema as object, datos: datos as object },
      });
      res.json({ id: updated.id, versionTemplateId: version.id, version: version.version });
    } catch (err) { next(err); }
  },
);

// POST /informes/:id/regenerar — regenera TODOS los componentes a su version activa/ultima
router.post(
  '/informes/:id/regenerar',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const informeId = Number(req.params.id);
      const informe = await prisma.informe.findUnique({
        where: { id: informeId },
        include: { componentes: { include: { componenteSistema: { select: { modeloComponenteId: true } } } } },
      });
      if (!informe) { res.status(404).json({ error: 'Informe no encontrado' }); return; }
      if (informe.estado === 'finalizado') {
        res.status(409).json({ error: 'No se puede regenerar un informe finalizado' });
        return;
      }
      // desdePlan=true: regenera la plantilla desde el plan de mantenimiento y la
      // sobreescribe EN SITIO (version activa o mas reciente) antes de bajarla al
      // informe. Asi un solo clic en "Actualizar plantillas" aplica las mejoras del
      // generador (colores, tablas, fix del NaN) sin pasar antes por Modelos.
      const desdePlan = req.body?.desdePlan === true;
      let regenerados = 0;
      for (const ci of informe.componentes) {
        const modeloId = ci.componenteSistema.modeloComponenteId;
        let version: { id: number; schema: unknown } | null = null;
        if (desdePlan) {
          try {
            const fresh = await generateTemplateForModel(prisma, modeloId);
            const activa = await prisma.versionTemplate.findFirst({
              where: { modeloComponenteId: modeloId, estado: 'activo' },
              orderBy: { version: 'desc' },
            });
            const target = activa ?? await prisma.versionTemplate.findFirst({
              where: { modeloComponenteId: modeloId },
              orderBy: { version: 'desc' },
            });
            version = target
              ? await prisma.versionTemplate.update({ where: { id: target.id }, data: { schema: fresh as object } })
              : await prisma.versionTemplate.create({
                  data: { modeloComponenteId: modeloId, version: 1, schema: fresh as object, estado: 'activo', notas: 'Regenerada desde el plan' },
                });
          } catch { version = null; }
        }
        if (!version) version = await pickVersion(modeloId);
        if (!version) continue;
        const schema = version.schema as FrozenSchema;
        const datos = regenDatos(schema, (ci.datos as Record<string, unknown>) || {});
        await prisma.componenteInforme.update({
          where: { id: ci.id },
          data: { versionTemplateId: version.id, schemaCongelado: schema as object, datos: datos as object },
        });
        regenerados++;
      }
      res.json({ regenerados, total: informe.componentes.length });
    } catch (err) { next(err); }
  },
);

export default router;
