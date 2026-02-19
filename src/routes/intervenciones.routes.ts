import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createIntervencionSchema, updateIntervencionSchema, updateEstadoIntervencionSchema,
} from '../validation/intervenciones.validation';

const router = Router();

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
    const { sistemaIds, ...data } = createIntervencionSchema.parse(req.body);
    const intervencion = await prisma.intervencion.create({
      data: {
        ...data,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        sistemas: {
          create: sistemaIds.map(sistemaId => ({ sistemaId })),
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
    const { sistemaIds, ...data } = updateIntervencionSchema.parse(req.body);
    const id = Number(req.params.id);

    const updateData: any = { ...data };
    if (data.fechaInicio !== undefined) updateData.fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : null;
    if (data.fechaFin !== undefined) updateData.fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;

    // If sistemaIds provided, replace the junction table
    if (sistemaIds !== undefined) {
      await prisma.$transaction([
        prisma.intervencionSistema.deleteMany({ where: { intervencionId: id } }),
        prisma.intervencion.update({
          where: { id },
          data: {
            ...updateData,
            sistemas: { create: sistemaIds.map(sistemaId => ({ sistemaId })) },
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
