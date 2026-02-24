import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createIntervencionSchema, updateIntervencionSchema, updateEstadoIntervencionSchema,
} from '../validation/intervenciones.validation';

const router = Router();

/** Build sistema rows from either `sistemas` (new) or `sistemaIds` (legacy) */
function buildSistemaRows(data: { sistemas?: { sistemaId: number; nivel: string }[]; sistemaIds?: number[] }) {
  if (data.sistemas && data.sistemas.length > 0) {
    return data.sistemas.map((s) => ({ sistemaId: s.sistemaId, nivel: s.nivel }));
  }
  if (data.sistemaIds && data.sistemaIds.length > 0) {
    return data.sistemaIds.map((id) => ({ sistemaId: id, nivel: '1' }));
  }
  return [];
}

// GET /api/v1/intervenciones
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.clienteId) where.clienteId = Number(req.query.clienteId);
    if (req.query.estado) where.estado = req.query.estado;
    if (req.query.tipo) where.tipo = req.query.tipo;
    const intervenciones = await prisma.intervencion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: {
          include: {
            sistema: { select: { id: true, nombre: true } },
          },
        },
        _count: { select: { informes: true } },
      },
    });
    res.json(intervenciones);
  } catch (err) { next(err); }
});

// GET /api/v1/intervenciones/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intervencion = await prisma.intervencion.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: {
          include: {
            sistema: {
              include: {
                fabricante: { select: { id: true, nombre: true } },
                componentes: {
                  orderBy: { orden: 'asc' },
                  include: { modeloComponente: { select: { id: true, nombre: true, tipo: true } } },
                },
              },
            },
          },
        },
        informes: {
          include: {
            sistema: { select: { id: true, nombre: true } },
          },
        },
      },
    });
    if (!intervencion) { res.status(404).json({ error: 'Intervencion no encontrada' }); return; }
    res.json(intervencion);
  } catch (err) { next(err); }
});

// POST /api/v1/intervenciones (admin)
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sistemaIds, sistemas, ...data } = createIntervencionSchema.parse(req.body);
    const rows = buildSistemaRows({ sistemas, sistemaIds });
    const intervencion = await prisma.intervencion.create({
      data: {
        clienteId: data.clienteId,
        tipo: data.tipo,
        titulo: data.titulo,
        referencia: data.referencia ?? null,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        notas: data.notas ?? null,
        sistemas: {
          create: rows,
        },
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: { include: { sistema: { select: { id: true, nombre: true } } } },
      },
    });
    res.status(201).json(intervencion);
  } catch (err) { next(err); }
});

// PUT /api/v1/intervenciones/:id (admin)
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sistemaIds, sistemas, ...data } = updateIntervencionSchema.parse(req.body);
    const id = Number(req.params.id);

    const updateData: any = { ...data };
    if (data.fechaInicio !== undefined) updateData.fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : null;
    if (data.fechaFin !== undefined) updateData.fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
    // Remove non-Prisma fields
    delete updateData.sistemaIds;
    delete updateData.sistemas;

    // If sistemas or sistemaIds provided, replace the junction table
    const hasSistemaChanges = (sistemas && sistemas.length > 0) || (sistemaIds && sistemaIds.length > 0);
    if (hasSistemaChanges) {
      const rows = buildSistemaRows({ sistemas, sistemaIds });
      await prisma.$transaction([
        prisma.intervencionSistema.deleteMany({ where: { intervencionId: id } }),
        prisma.intervencion.update({
          where: { id },
          data: {
            ...updateData,
            sistemas: { create: rows },
          },
        }),
      ]);
    } else {
      await prisma.intervencion.update({ where: { id }, data: updateData });
    }

    const intervencion = await prisma.intervencion.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: { include: { sistema: { select: { id: true, nombre: true } } } },
      },
    });
    res.json(intervencion);
  } catch (err) { next(err); }
});

// PATCH /api/v1/intervenciones/:id/estado
router.patch('/:id/estado', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = updateEstadoIntervencionSchema.parse(req.body);
    const intervencion = await prisma.intervencion.update({
      where: { id: Number(req.params.id) },
      data: { estado },
    });
    res.json(intervencion);
  } catch (err) { next(err); }
});

// DELETE /api/v1/intervenciones/:id (admin)
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.intervencion.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Intervencion eliminada' });
  } catch (err) { next(err); }
});

export default router;
