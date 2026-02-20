import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { getAuthUser } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import {
  updateEstadoInformeSchema,
  updateDatosComponenteSchema,
} from '../validation/informes.validation';
import { initDatos } from '../lib/initDatos';

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
              estado: 'borrador',
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
            select: { id: true, titulo: true, tipo: true, estado: true },
          },
          sistema: {
            select: {
              id: true,
              nombre: true,
              fabricante: { select: { nombre: true } },
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

export default router;
