import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import { upsertConsumibleNivelSchema, batchUpsertSchema } from '../validation/consumibleNivel.validation';

const router = Router();

// GET /api/v1/consumibles-nivel?modeloId=5
// Returns all consumibles-nivel rows for a given modelo (or all if no filter)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.modeloId) where.modeloId = Number(req.query.modeloId);
    const rows = await prisma.consumibleNivel.findMany({
      where,
      orderBy: [{ modeloId: 'asc' }, { nivel: 'asc' }],
    });
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/v1/consumibles-nivel/por-fabricante/:fabricanteId
// Returns all consumibles-nivel grouped by modelo for a fabricante
router.get('/por-fabricante/:fabricanteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fabricanteId = Number(req.params.fabricanteId);
    const modelos = await prisma.modeloComponente.findMany({
      where: { fabricanteId },
      include: { consumiblesNivel: true },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });
    res.json(modelos);
  } catch (err) { next(err); }
});

// PUT /api/v1/consumibles-nivel (admin) — upsert single
router.put('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = upsertConsumibleNivelSchema.parse(req.body);
    const row = await prisma.consumibleNivel.upsert({
      where: {
        modeloId_nivel: { modeloId: data.modeloId, nivel: data.nivel },
      },
      update: {
        horas: data.horas ?? null,
        precioOtros: data.precioOtros ?? null,
        consumibles: data.consumibles ?? undefined,
      },
      create: {
        modeloId: data.modeloId,
        nivel: data.nivel,
        horas: data.horas ?? null,
        precioOtros: data.precioOtros ?? null,
        consumibles: data.consumibles ?? undefined,
      },
    });
    res.json(row);
  } catch (err) { next(err); }
});

// PUT /api/v1/consumibles-nivel/batch (admin) — upsert multiple
router.put('/batch', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = batchUpsertSchema.parse(req.body);
    const results = await prisma.$transaction(
      items.map((data) =>
        prisma.consumibleNivel.upsert({
          where: {
            modeloId_nivel: { modeloId: data.modeloId, nivel: data.nivel },
          },
          update: {
            horas: data.horas ?? null,
            precioOtros: data.precioOtros ?? null,
            consumibles: data.consumibles ?? undefined,
          },
          create: {
            modeloId: data.modeloId,
            nivel: data.nivel,
            horas: data.horas ?? null,
            precioOtros: data.precioOtros ?? null,
            consumibles: data.consumibles ?? undefined,
          },
        })
      )
    );
    res.json(results);
  } catch (err) { next(err); }
});

export default router;
