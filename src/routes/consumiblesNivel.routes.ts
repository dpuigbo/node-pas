import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import { upsertConsumibleNivelSchema, batchUpsertSchema } from '../validation/consumibleNivel.validation';
import { nivelIdFromCodigo } from '../lib/niveles';

const router = Router();

// GET /api/v1/consumibles-nivel?modeloId=5
// Returns all consumibles-nivel rows for a given modelo (or all if no filter)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.modeloId) where.modeloId = Number(req.query.modeloId);
    const rows = await prisma.consumibleNivel.findMany({
      where,
      include: { nivel: { select: { codigo: true, nombre: true, orden: true } } },
      orderBy: [{ modeloId: 'asc' }, { nivel: { orden: 'asc' } }],
    });
    res.json(rows.map((r) => ({ ...r, nivel: r.nivel.codigo })));
  } catch (err) { next(err); }
});

// GET /api/v1/consumibles-nivel/por-fabricante/:fabricanteId
// Returns all consumibles-nivel grouped by modelo for a fabricante
router.get('/por-fabricante/:fabricanteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fabricanteId = Number(req.params.fabricanteId);
    const modelos = await prisma.modeloComponente.findMany({
      where: { fabricanteId },
      include: {
        consumiblesNivel: {
          include: { nivel: { select: { codigo: true, nombre: true, orden: true } } },
        },
      },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });
    // Aplanar: serializar nivel.codigo a string en cada fila
    res.json(modelos.map((m) => ({
      ...m,
      consumiblesNivel: m.consumiblesNivel.map((c) => ({ ...c, nivel: c.nivel.codigo })),
    })));
  } catch (err) { next(err); }
});

async function resolveNivelOrThrow(codigo: string): Promise<number> {
  const id = await nivelIdFromCodigo(codigo);
  if (id == null) throw new Error(`Nivel desconocido: ${codigo}`);
  return id;
}

// PUT /api/v1/consumibles-nivel (admin) — upsert single
router.put('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = upsertConsumibleNivelSchema.parse(req.body);
    const nivelId = await resolveNivelOrThrow(data.nivel);
    const row = await prisma.consumibleNivel.upsert({
      where: {
        modeloId_nivelId: { modeloId: data.modeloId, nivelId },
      },
      update: {
        horas: data.horas ?? null,
        precioOtros: data.precioOtros ?? null,
        consumibles: data.consumibles ?? undefined,
      },
      create: {
        modeloId: data.modeloId,
        nivelId,
        horas: data.horas ?? null,
        precioOtros: data.precioOtros ?? null,
        consumibles: data.consumibles ?? undefined,
      },
      include: { nivel: { select: { codigo: true } } },
    });
    res.json({ ...row, nivel: row.nivel.codigo });
  } catch (err) { next(err); }
});

// PUT /api/v1/consumibles-nivel/batch (admin) — upsert multiple
router.put('/batch', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = batchUpsertSchema.parse(req.body);
    const itemsWithIds = await Promise.all(
      items.map(async (data) => ({
        ...data,
        nivelId: await resolveNivelOrThrow(data.nivel),
      }))
    );
    const results = await prisma.$transaction(
      itemsWithIds.map((data) =>
        prisma.consumibleNivel.upsert({
          where: {
            modeloId_nivelId: { modeloId: data.modeloId, nivelId: data.nivelId },
          },
          update: {
            horas: data.horas ?? null,
            precioOtros: data.precioOtros ?? null,
            consumibles: data.consumibles ?? undefined,
          },
          create: {
            modeloId: data.modeloId,
            nivelId: data.nivelId,
            horas: data.horas ?? null,
            precioOtros: data.precioOtros ?? null,
            consumibles: data.consumibles ?? undefined,
          },
          include: { nivel: { select: { codigo: true } } },
        })
      )
    );
    res.json(results.map((r) => ({ ...r, nivel: r.nivel.codigo })));
  } catch (err) { next(err); }
});

export default router;
