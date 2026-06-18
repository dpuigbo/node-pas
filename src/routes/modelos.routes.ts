import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createModeloSchema, updateModeloSchema, updateCompatibilidadSchema,
  createVersionSchema, updateVersionSchema, activateVersionSchema,
} from '../validation/modelos.validation';
import { getSeedTemplate } from '../lib/templateSeeds';
import { generateTemplateForModel } from '../lib/generateTemplate';
import { getNivelesAplicablesModelo } from '../lib/ofertaMantenimiento';
import {
  Cohorte,
  getActividadesPlan,
  getLubricacionModelo,
  parseIdArray,
} from '../lib/planMantenimiento';

const router = Router();

/** Cohorte desde query params (?montajeId=&proteccionId=&controladorId=) */
function cohorteFromQuery(req: Request): Cohorte | undefined {
  const montajeId = req.query.montajeId ? Number(req.query.montajeId) : null;
  const proteccionId = req.query.proteccionId ? Number(req.query.proteccionId) : null;
  const controladorId = req.query.controladorId ? Number(req.query.controladorId) : null;
  if (montajeId == null && proteccionId == null && controladorId == null) return undefined;
  return { montajeId, proteccionId, controladorId };
}

/** Resuelve nombres de controladores para arrays JSON de IDs */
async function resolveControladores(ids: number[]): Promise<{ id: number; nombre: string; familia: string | null }[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.modeloComponente.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, familiaRel: { select: { codigo: true } } },
    orderBy: { nombre: 'asc' },
  });
  return rows.map((r) => ({ id: r.id, nombre: r.nombre, familia: r.familiaRel?.codigo ?? null }));
}

// ===== MODELOS COMPONENTE =====

// GET /api/v1/modelos
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.fabricanteId) where.fabricanteId = Number(req.query.fabricanteId);
    if (req.query.tipo) where.tipo = req.query.tipo;
    if (req.query.incluirInactivos !== '1') where.activa = true;

    const modelos = await prisma.modeloComponente.findMany({
      where,
      orderBy: [{ familiaId: 'asc' }, { nombre: 'asc' }],
      include: {
        fabricante: { select: { id: true, nombre: true } },
        familiaRel: { select: { id: true, codigo: true, tipoCinematica: true } },
        _count: { select: { versiones: true } },
      },
    });

    // Resolver nombres de los controladores compatibles (JSON de IDs) en batch
    const allCtrlIds = new Set<number>();
    for (const m of modelos) {
      for (const id of parseIdArray(m.controladoresCompatibles) ?? []) allCtrlIds.add(id);
    }
    const ctrlMap = new Map(
      (await resolveControladores(Array.from(allCtrlIds))).map((c) => [c.id, c])
    );

    res.json(modelos.map((m) => ({
      ...m,
      // compat: campo `familia` legacy que el frontend usaba como texto
      familia: m.familiaRel?.codigo ?? null,
      controladoresCompatiblesInfo: (parseIdArray(m.controladoresCompatibles) ?? [])
        .map((id) => ctrlMap.get(id))
        .filter(Boolean),
    })));
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/compatible?sistemaId=X&tipo=Y
// Modelos compatibles con las controladoras presentes en el sistema
// (v2.9: modelos_componente.controladores_compatibles, array JSON de IDs).
router.get('/compatible', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sistemaId = Number(req.query.sistemaId);
    const tipo = req.query.tipo as 'controller' | 'mechanical_unit' | 'drive_unit' | 'external_axis';
    if (!sistemaId || !tipo) {
      res.status(400).json({ error: 'sistemaId y tipo son obligatorios' });
      return;
    }

    const sistema = await prisma.sistema.findUnique({
      where: { id: sistemaId },
      select: { fabricanteId: true },
    });
    if (!sistema) { res.status(404).json({ error: 'Sistema no encontrado' }); return; }

    // For controllers: return all controllers of the system's fabricante
    if (tipo === 'controller') {
      const modelos = await prisma.modeloComponente.findMany({
        where: { fabricanteId: sistema.fabricanteId, tipo: 'controller', activa: true },
        orderBy: { nombre: 'asc' },
        include: { fabricante: { select: { id: true, nombre: true } } },
      });
      res.json({ modelos, warning: null });
      return;
    }

    // For non-controllers: find controllers in this system
    const controladores = await prisma.componenteSistema.findMany({
      where: { sistemaId, tipo: 'controller' },
      select: { modeloComponenteId: true },
    });

    const candidatos = await prisma.modeloComponente.findMany({
      where: { tipo, activa: true },
      orderBy: { nombre: 'asc' },
      include: { fabricante: { select: { id: true, nombre: true } } },
    });

    if (controladores.length === 0) {
      const delFabricante = candidatos.filter((m) => m.fabricanteId === sistema.fabricanteId);
      res.json({ modelos: delFabricante, warning: 'No hay controladoras en el sistema. Se muestran todos los modelos.' });
      return;
    }

    const controllerModelIds = new Set(controladores.map((c) => c.modeloComponenteId));
    const modelos = candidatos.filter((m) => {
      const ids = parseIdArray(m.controladoresCompatibles) ?? [];
      return ids.some((id) => controllerModelIds.has(id));
    });

    if (modelos.length === 0) {
      const totalSinConfig = candidatos.filter((m) => m.fabricanteId === sistema.fabricanteId).length;
      res.json({
        modelos: [],
        warning: `Ninguno de los ${totalSinConfig} modelos de este tipo tiene compatibilidad con las controladoras del sistema.`,
      });
      return;
    }

    res.json({ modelos, warning: null });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/compatible-con?controladorId=X&tipo=Y
// Modelos compatibles con una controladora especifica (JSON controladores_compatibles).
router.get('/compatible-con', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const controladorId = Number(req.query.controladorId);
    const tipo = req.query.tipo as string;
    if (!controladorId || !tipo) {
      res.status(400).json({ error: 'controladorId y tipo son obligatorios' });
      return;
    }

    const candidatos = await prisma.modeloComponente.findMany({
      where: { tipo: tipo as any, activa: true },
      orderBy: [{ familiaId: 'asc' }, { nombre: 'asc' }],
      include: {
        fabricante: { select: { id: true, nombre: true } },
        familiaRel: { select: { id: true, codigo: true } },
      },
    });
    const modelos = candidatos.filter((m) =>
      (parseIdArray(m.controladoresCompatibles) ?? []).includes(controladorId)
    );
    res.json(modelos.map((m) => ({ ...m, familia: m.familiaRel?.codigo ?? null })));
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/niveles-aplicables
// Niveles aplicables (flags nivel_n*, D-075) + horas (mantenimiento_horas_modelo).
router.get('/:id/niveles-aplicables', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const niveles = await getNivelesAplicablesModelo(modeloId);
    res.json({ modeloId, niveles });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/diagnostico
// Estadisticas de cobertura de datos para el modelo (v2.9).
router.get('/:id/diagnostico', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      include: {
        familiaRel: true,
        fabricante: { select: { id: true, nombre: true } },
      },
    });
    if (!modelo) {
      res.status(404).json({ error: 'Modelo no encontrado' });
      return;
    }

    const [lubricacionCount, horasCount, actividades] = await Promise.all([
      prisma.lubricacion.count({ where: { modeloComponenteId: modeloId } }),
      prisma.mantenimientoHorasModelo.count({ where: { modeloComponenteId: modeloId } }),
      getActividadesPlan(modeloId, null),
    ]);

    res.json({
      modeloId,
      modeloNombre: modelo.nombre,
      modeloTipo: modelo.tipo,
      typeVariant: modelo.typeVariant,
      familiaId: modelo.familiaId,
      familia: modelo.familiaRel
        ? { codigo: modelo.familiaRel.codigo, descripcion: modelo.familiaRel.descripcion, tipoCinematica: modelo.familiaRel.tipoCinematica }
        : null,
      fabricante: modelo.fabricante,
      conteos: {
        lubricacion: lubricacionCount,
        actividades_preventivas: actividades.length,
        horas_por_nivel: horasCount,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/lubricacion?montajeId=&proteccionId=&controladorId=
// Tabla de lubricacion del modelo (v2.9: consumible_catalogo + cohortes).
router.get('/:id/lubricacion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const cohorte = cohorteFromQuery(req);
    const rows = await getLubricacionModelo(modeloId, cohorte);
    res.json({
      modeloId,
      lubricacion: rows,
      records: rows,
      fuente: rows.length > 0 ? 'lubricacion' : 'ninguna',
      source: 'v2',
    });
  } catch (err) { next(err); }
});

// PUT /api/v1/modelos/:id/lubricacion/:lubId (admin) — editar fila v2.9
router.put('/:id/lubricacion/:lubId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lubId = Number(req.params.lubId);
    const {
      eje, cantidadValor, cantidadUnidad, notas,
      consumibleId, lifetime, intervaloHoras, nivelId,
    } = req.body;

    const updateData: any = {};
    if (eje !== undefined) updateData.eje = String(eje).trim();
    if (cantidadValor !== undefined) {
      updateData.cantidadValor = cantidadValor === null || cantidadValor === ''
        ? null
        : Number(cantidadValor);
    }
    if (cantidadUnidad !== undefined) updateData.cantidadUnidad = cantidadUnidad || null;
    if (notas !== undefined) updateData.notas = notas || null;
    if (consumibleId !== undefined) updateData.consumibleId = consumibleId ? Number(consumibleId) : null;
    if (lifetime !== undefined) updateData.lifetime = Boolean(lifetime);
    if (intervaloHoras !== undefined) {
      updateData.intervaloHoras = intervaloHoras === null || intervaloHoras === ''
        ? null
        : Number(intervaloHoras);
    }
    if (nivelId !== undefined) updateData.nivelId = nivelId ? Number(nivelId) : null;

    const row = await prisma.lubricacion.update({
      where: { id: lubId },
      data: updateData,
      include: {
        consumible: { select: { id: true, codigoInterno: true, nombre: true, tipo: true, fabricante: true } },
        nivel: { select: { id: true, codigo: true, nombre: true } },
      },
    });
    res.json(row);
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/actividades?nivel=X&montajeId=&proteccionId=&controladorId=
// Actividades preventivas aplicables al modelo (modelos_aplicables JSON),
// opcionalmente filtradas por nivel (con cobertura N3 ⊇ N2_INF+N2_SUP+N1).
router.get('/:id/actividades', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const nivel = (req.query.nivel as string | undefined)?.trim() || null;
    const cohorte = cohorteFromQuery(req);

    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      select: { id: true },
    });
    if (!modelo) {
      res.status(404).json({ error: 'Modelo no encontrado' });
      return;
    }

    const actividades = await getActividadesPlan(modeloId, nivel, cohorte);
    res.json({
      modeloId,
      nivel,
      actividades: actividades.map((a) => ({
        ...a,
        nivelCodigo: a.nivel?.codigo ?? null,
        nivelesAsignados: a.nivel?.codigo ? [a.nivel.codigo] : [],
      })),
      fuente: actividades.length > 0 ? 'actividad_preventiva' : 'ninguna',
    });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        fabricante: { select: { id: true, nombre: true } },
        familiaRel: { select: { id: true, codigo: true, tipo: true, descripcion: true, tipoCinematica: true } },
        generacion: { select: { id: true, codigo: true, nombre: true } },
        versiones: { orderBy: { version: 'desc' } },
      },
    });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }

    // Resolver lookups de los arrays JSON
    const montajeIds = parseIdArray(modelo.montajesDisponibles) ?? [];
    const proteccionIds = parseIdArray(modelo.proteccionesDisponibles) ?? [];
    const controladorIds = parseIdArray(modelo.controladoresCompatibles) ?? [];

    const [montajes, protecciones, controladores] = await Promise.all([
      montajeIds.length > 0
        ? prisma.luMontaje.findMany({ where: { id: { in: montajeIds } } })
        : Promise.resolve([]),
      proteccionIds.length > 0
        ? prisma.luProteccion.findMany({ where: { id: { in: proteccionIds } } })
        : Promise.resolve([]),
      resolveControladores(controladorIds),
    ]);

    res.json({
      ...modelo,
      familia: modelo.familiaRel?.codigo ?? null,
      montajesDisponiblesInfo: montajes,
      proteccionesDisponiblesInfo: protecciones,
      controladoresCompatiblesInfo: controladores,
    });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/compatibilidad
// v2.9: compatibilidad via modelos_componente.controladores_compatibles (JSON).
router.get('/:id/compatibilidad', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      select: {
        id: true, nombre: true, tipo: true, familiaId: true,
        controladoresCompatibles: true,
        familiaRel: { select: { codigo: true } },
      },
    });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }

    const base = {
      id: modelo.id,
      nombre: modelo.nombre,
      tipo: modelo.tipo,
      familiaId: modelo.familiaId,
      familia: modelo.familiaRel?.codigo ?? null,
    };

    if (modelo.tipo === 'controller') {
      // Inverso: modelos cuyo JSON contiene este controlador
      const candidatos = await prisma.modeloComponente.findMany({
        where: { activa: true, tipo: { in: ['mechanical_unit', 'external_axis', 'drive_unit'] } },
        select: {
          id: true, nombre: true, tipo: true, controladoresCompatibles: true,
          familiaRel: { select: { codigo: true } },
        },
        orderBy: { nombre: 'asc' },
      });
      const compatibles = candidatos
        .filter((m) => (parseIdArray(m.controladoresCompatibles) ?? []).includes(modeloId))
        .map((m) => ({ id: m.id, nombre: m.nombre, tipo: m.tipo, familia: m.familiaRel?.codigo ?? null }));

      res.json({
        tipo: 'controller',
        modelo: base,
        robotsCompatibles: compatibles.filter((m) => m.tipo === 'mechanical_unit'),
        ejesCompatibles: compatibles.filter((m) => m.tipo === 'external_axis'),
        drivesCompatibles: compatibles.filter((m) => m.tipo === 'drive_unit'),
      });
      return;
    }

    const controladores = await resolveControladores(parseIdArray(modelo.controladoresCompatibles) ?? []);
    res.json({
      tipo: modelo.tipo,
      modelo: base,
      controladoresCompatibles: controladores,
    });
  } catch (err) { next(err); }
});

// POST /api/v1/modelos (admin)
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createModeloSchema.parse(req.body);

    const existing = await prisma.modeloComponente.findFirst({
      where: { fabricanteId: data.fabricanteId, tipo: data.tipo, nombre: data.nombre },
    });
    if (existing) {
      res.status(409).json({ error: 'Ya existe un modelo con ese nombre para este fabricante y tipo.' });
      return;
    }

    const modelo = await prisma.modeloComponente.create({
      data: {
        ...data,
        montajesDisponibles: data.montajesDisponibles ?? Prisma.DbNull,
        proteccionesDisponibles: data.proteccionesDisponibles ?? Prisma.DbNull,
        controladoresCompatibles: data.controladoresCompatibles ?? Prisma.DbNull,
      },
      include: {
        fabricante: { select: { id: true, nombre: true } },
        familiaRel: { select: { id: true, codigo: true } },
      },
    });
    res.status(201).json(modelo);
  } catch (err) { next(err); }
});

// PUT /api/v1/modelos/:id (admin)
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateModeloSchema.parse(req.body);
    const modelo = await prisma.modeloComponente.update({
      where: { id: Number(req.params.id) },
      data: {
        ...data,
        montajesDisponibles: data.montajesDisponibles === undefined
          ? undefined : (data.montajesDisponibles ?? Prisma.DbNull),
        proteccionesDisponibles: data.proteccionesDisponibles === undefined
          ? undefined : (data.proteccionesDisponibles ?? Prisma.DbNull),
        controladoresCompatibles: data.controladoresCompatibles === undefined
          ? undefined : (data.controladoresCompatibles ?? Prisma.DbNull),
      },
    });
    res.json(modelo);
  } catch (err) { next(err); }
});

// PUT /api/v1/modelos/:id/compatibilidad (admin) — set controladores compatibles (JSON)
router.put('/:id/compatibilidad', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { controladorIds } = updateCompatibilidadSchema.parse(req.body);
    const id = Number(req.params.id);

    const modelo = await prisma.modeloComponente.findUnique({ where: { id }, select: { id: true } });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }

    const updated = await prisma.modeloComponente.update({
      where: { id },
      data: { controladoresCompatibles: controladorIds },
    });
    const controladores = await resolveControladores(controladorIds);
    res.json({ ...updated, controladoresCompatiblesInfo: controladores });
  } catch (err) { next(err); }
});

// DELETE /api/v1/modelos/:id (admin)
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.modeloComponente.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Modelo eliminado' });
  } catch (err) { next(err); }
});

// ===== MANTENIMIENTO (nested under modelo) =====

// GET /api/v1/modelos/:id/mantenimiento
// v2.9: todas las actividades viven en actividad_preventiva con
// modelos_aplicables (tambien controladores y drive units).
router.get('/:id/mantenimiento', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      select: { tipo: true },
    });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }

    const cohorte = cohorteFromQuery(req);
    const actividades = await getActividadesPlan(modeloId, null, cohorte);

    res.json({
      source: 'v2',                 // compat con frontend antiguo
      records: actividades,         // compat con frontend antiguo
      especificas: actividades,
      especificasSource: 'v2',
      genericos: [],                // las genericas se fusionaron en actividad_preventiva
      genericosCategorias: [],
    });
  } catch (err) { next(err); }
});

// ===== VERSIONES TEMPLATE (nested under modelo) =====

// GET /api/v1/modelos/:modeloId/versiones
router.get('/:modeloId/versiones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const versiones = await prisma.versionTemplate.findMany({
      where: { modeloComponenteId: Number(req.params.modeloId) },
      orderBy: { version: 'desc' },
    });
    res.json(versiones);
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:modeloId/versiones/:versionId
router.get('/:modeloId/versiones/:versionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await prisma.versionTemplate.findUnique({
      where: { id: Number(req.params.versionId) },
      include: {
        modeloComponente: {
          include: { fabricante: { select: { id: true, nombre: true } } },
        },
      },
    });
    if (!version) { res.status(404).json({ error: 'Version no encontrada' }); return; }
    res.json(version);
  } catch (err) { next(err); }
});

// POST /api/v1/modelos/:modeloId/versiones (admin)
router.post('/:modeloId/versiones', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createVersionSchema.parse(req.body);
    const modeloId = Number(req.params.modeloId);

    // Auto-calculate next version number
    const lastVersion = await prisma.versionTemplate.findFirst({
      where: { modeloComponenteId: modeloId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    // If schema is empty and it's the first version, use seed template based on model tipo
    let schema = data.schema;
    const blocks = (schema as any)?.blocks;
    if (!blocks || (Array.isArray(blocks) && blocks.length === 0)) {
      const modelo = await prisma.modeloComponente.findUnique({
        where: { id: modeloId },
        select: { tipo: true },
      });
      if (modelo) {
        schema = getSeedTemplate(modelo.tipo);
      }
    }

    const version = await prisma.versionTemplate.create({
      data: {
        modeloComponenteId: modeloId,
        version: nextVersion,
        schema: schema as any,
        notas: data.notas,
      },
    });
    res.status(201).json(version);
  } catch (err) { next(err); }
});

// POST /api/v1/modelos/:modeloId/versiones/generar (admin)
// Genera una nueva version (borrador) a partir del plan de mantenimiento
// (lubricacion + catalogo) y el perfil de informe de la marca/generacion.
router.post('/:modeloId/versiones/generar', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.modeloId);
    const schema = await generateTemplateForModel(prisma, modeloId);
    const lastVersion = await prisma.versionTemplate.findFirst({
      where: { modeloComponenteId: modeloId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;
    const version = await prisma.versionTemplate.create({
      data: {
        modeloComponenteId: modeloId,
        version: nextVersion,
        schema: schema as any,
        estado: 'borrador',
        notas: 'Generada automaticamente desde el plan de mantenimiento',
      },
    });
    res.status(201).json(version);
  } catch (err) { next(err); }
});

// POST /api/v1/modelos/generar-plantillas-masivo (admin)
// Genera plantillas (borrador) para todos los modelos activos del tipo indicado.
// Body: { tipo?: 'mechanical_unit'|'controller'|'drive_unit'|'external_axis',
//         soloSinVersion?: boolean (default true) }
router.post('/generar-plantillas-masivo', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipo = req.body?.tipo as string | undefined;
    const soloSinVersion = req.body?.soloSinVersion !== false;
    const modelos = await prisma.modeloComponente.findMany({
      where: { activa: true, ...(tipo ? { tipo: tipo as any } : {}) },
      select: { id: true, nombre: true, _count: { select: { versiones: true } } },
      orderBy: { id: 'asc' },
    });
    let generadas = 0;
    let saltadas = 0;
    const errores: { modeloId: number; nombre: string; error: string }[] = [];
    for (const m of modelos) {
      if (soloSinVersion && m._count.versiones > 0) { saltadas++; continue; }
      try {
        const schema = await generateTemplateForModel(prisma, m.id);
        const last = await prisma.versionTemplate.findFirst({
          where: { modeloComponenteId: m.id },
          orderBy: { version: 'desc' },
        });
        await prisma.versionTemplate.create({
          data: {
            modeloComponenteId: m.id,
            version: (last?.version ?? 0) + 1,
            schema: schema as any,
            estado: 'borrador',
            notas: 'Generada automaticamente (masivo) desde el plan',
          },
        });
        generadas++;
      } catch (e) {
        errores.push({ modeloId: m.id, nombre: m.nombre, error: (e as Error).message });
      }
    }
    res.json({ total: modelos.length, generadas, saltadas, errores });
  } catch (err) { next(err); }
});

// PUT /api/v1/modelos/:modeloId/versiones/:versionId (admin)
router.put('/:modeloId/versiones/:versionId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateVersionSchema.parse(req.body);
    const version = await prisma.versionTemplate.update({
      where: { id: Number(req.params.versionId) },
      data,
    });
    res.json(version);
  } catch (err) { next(err); }
});

// PATCH /api/v1/modelos/:modeloId/versiones/:versionId/estado (admin)
// Business rule: activating a version deactivates all other active versions of the same model
router.patch('/:modeloId/versiones/:versionId/estado', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = activateVersionSchema.parse(req.body);
    const versionId = Number(req.params.versionId);
    const modeloId = Number(req.params.modeloId);

    if (estado === 'activo') {
      // Atomic transaction: deactivate others + activate this one
      const [, version] = await prisma.$transaction([
        prisma.versionTemplate.updateMany({
          where: { modeloComponenteId: modeloId, estado: 'activo' },
          data: { estado: 'obsoleto' },
        }),
        prisma.versionTemplate.update({
          where: { id: versionId },
          data: { estado: 'activo' },
        }),
      ]);
      res.json(version);
    } else {
      const version = await prisma.versionTemplate.update({
        where: { id: versionId },
        data: { estado },
      });
      res.json(version);
    }
  } catch (err) { next(err); }
});

// DELETE /api/v1/modelos/:modeloId/versiones/:versionId (admin)
router.delete('/:modeloId/versiones/:versionId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await prisma.versionTemplate.findUnique({
      where: { id: Number(req.params.versionId) },
    });
    if (version?.estado === 'activo') {
      res.status(400).json({ error: 'No se puede eliminar una version activa. Desactivala primero.' });
      return;
    }
    await prisma.versionTemplate.delete({ where: { id: Number(req.params.versionId) } });
    res.json({ message: 'Version eliminada' });
  } catch (err) { next(err); }
});

export default router;
