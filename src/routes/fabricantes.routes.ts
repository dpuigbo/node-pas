import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import { createFabricanteSchema, updateFabricanteSchema } from '../validation/fabricantes.validation';

const router = Router();

// GET /api/v1/fabricantes
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const fabricantes = await prisma.fabricante.findMany({
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      include: { _count: { select: { modelos: true } } },
    });
    res.json(fabricantes);
  } catch (err) { next(err); }
});

// GET /api/v1/fabricantes/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fabricante = await prisma.fabricante.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        modelos: {
          orderBy: { nombre: 'asc' },
          include: { _count: { select: { versiones: true } } },
        },
      },
    });
    if (!fabricante) { res.status(404).json({ error: 'Fabricante no encontrado' }); return; }
    res.json(fabricante);
  } catch (err) { next(err); }
});

// POST /api/v1/fabricantes (admin)
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createFabricanteSchema.parse(req.body);
    const fabricante = await prisma.fabricante.create({ data });
    res.status(201).json(fabricante);
  } catch (err) { next(err); }
});

// PUT /api/v1/fabricantes/:id (admin)
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateFabricanteSchema.parse(req.body);
    const fabricante = await prisma.fabricante.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(fabricante);
  } catch (err) { next(err); }
});

// DELETE /api/v1/fabricantes/:id (admin) - soft delete
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fabricante = await prisma.fabricante.update({
      where: { id: Number(req.params.id) },
      data: { activo: false },
    });
    res.json(fabricante);
  } catch (err) { next(err); }
});

export default router;
