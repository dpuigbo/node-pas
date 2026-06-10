import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import { upsertHorasModeloSchema, batchUpsertHorasSchema } from '../validation/consumibleNivel.validation';
import { nivelIdFromCodigo } from '../lib/niveles';

// v2.9: la tabla consumibles_nivel fue eliminada. Este router gestiona ahora
// las horas de trabajo por (modelo, nivel) en mantenimiento_horas_modelo
// (D-073/D-074). Se mantiene el prefijo /consumibles-nivel por compatibilidad.

const router = Router();

// GET /api/v1/consumibles-nivel?modeloId=5
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.modeloId) where.modeloComponenteId = Number(req.query.modeloId);
    const rows = await prisma.mantenimientoHorasModelo.findMany({
      where,
      include: { nivel: { select: { codigo: true, nombre: true, orden: true } } },
      orderBy: [{ modeloComponenteId: 'asc' }, { nivel: { orden: 'asc' } }],
    });
    res.json(rows.map((r) => ({
      ...r,
      modeloId: r.modeloComponenteId,
      horas: r.horas != null ? Number(r.horas) : null,
      nivel: r.nivel.codigo,
    })));
  } catch (err) { next(err); }
});

// GET /api/v1/consumibles-nivel/por-fabricante/:fabricanteId
// Horas por nivel agrupadas por modelo para un fabricante.
router.get('/por-fabricante/:fabricanteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fabricanteId = Number(req.params.fabricanteId);
    const modelos = await prisma.modeloComponente.findMany({
      where: { fabricanteId, activa: true },
      include: {
        mantenimientoHoras: {
          include: { nivel: { select: { codigo: true, nombre: true, orden: true } } },
        },
        familiaRel: { select: { codigo: true } },
      },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });
    res.json(modelos.map((m) => ({
      ...m,
      familia: m.familiaRel?.codigo ?? null,
      horasNivel: m.mantenimientoHoras.map((h) => ({
        ...h,
        horas: h.horas != null ? Number(h.horas) : null,
        nivel: h.nivel.codigo,
      })),
    })));
  } catch (err) { next(err); }
});

async function resolveNivelOrThrow(codigo: string): Promise<number> {
  const id = await nivelIdFromCodigo(codigo);
  if (id == null) throw new Error(`Nivel desconocido: ${codigo}`);
  return id;
}

async function upsertHoras(data: { modeloId: number; nivelId: number; horas?: number | null; notas?: string | null }) {
  const existing = await prisma.mantenimientoHorasModelo.findFirst({
    where: { modeloComponenteId: data.modeloId, nivelId: data.nivelId },
  });
  if (data.horas == null) {
    // Sin horas: si existia, eliminar la fila (horas es NOT NULL en BD)
    if (existing) {
      await prisma.mantenimientoHorasModelo.delete({ where: { id: existing.id } });
    }
    return null;
  }
  if (existing) {
    return prisma.mantenimientoHorasModelo.update({
      where: { id: existing.id },
      data: { horas: data.horas, notas: data.notas ?? existing.notas },
      include: { nivel: { select: { codigo: true } } },
    });
  }
  return prisma.mantenimientoHorasModelo.create({
    data: {
      modeloComponenteId: data.modeloId,
      nivelId: data.nivelId,
      horas: data.horas,
      notas: data.notas ?? null,
    },
    include: { nivel: { select: { codigo: true } } },
  });
}

// PUT /api/v1/consumibles-nivel (admin) — upsert single
router.put('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = upsertHorasModeloSchema.parse(req.body);
    const nivelId = await resolveNivelOrThrow(data.nivel);
    const row = await upsertHoras({ modeloId: data.modeloId, nivelId, horas: data.horas ?? null, notas: data.notas ?? null });
    if (!row) {
      res.json({ modeloId: data.modeloId, nivel: data.nivel, horas: null, deleted: true });
      return;
    }
    res.json({ ...row, modeloId: row.modeloComponenteId, horas: Number(row.horas), nivel: row.nivel.codigo });
  } catch (err) { next(err); }
});

// PUT /api/v1/consumibles-nivel/batch (admin) — upsert multiple
router.put('/batch', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = batchUpsertHorasSchema.parse(req.body);
    const results = [];
    for (const data of items) {
      const nivelId = await resolveNivelOrThrow(data.nivel);
      const row = await upsertHoras({ modeloId: data.modeloId, nivelId, horas: data.horas ?? null, notas: data.notas ?? null });
      results.push(row
        ? { ...row, modeloId: row.modeloComponenteId, horas: Number(row.horas), nivel: row.nivel.codigo }
        : { modeloId: data.modeloId, nivel: data.nivel, horas: null, deleted: true });
    }
    res.json(results);
  } catch (err) { next(err); }
});

export default router;
