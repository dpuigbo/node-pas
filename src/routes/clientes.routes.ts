import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createClienteSchema, updateClienteSchema,
  createPlantaSchema, updatePlantaSchema,
  createMaquinaSchema, updateMaquinaSchema,
} from '../validation/clientes.validation';

const router = Router();

// ===== CLIENTES =====

// GET /api/v1/clientes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const clientes = await prisma.cliente.findMany({
      where: includeInactive ? {} : { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { plantas: true, sistemas: true, intervenciones: true } },
      },
    });
    res.json(clientes);
  } catch (err) { next(err); }
});

// GET /api/v1/clientes/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        plantas: { orderBy: { nombre: 'asc' } },
        _count: { select: { sistemas: true, intervenciones: true } },
      },
    });
    if (!cliente) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    res.json(cliente);
  } catch (err) { next(err); }
});

// POST /api/v1/clientes (admin)
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createClienteSchema.parse(req.body);
    const cliente = await prisma.cliente.create({ data });
    res.status(201).json(cliente);
  } catch (err) { next(err); }
});

// PUT /api/v1/clientes/:id (admin)
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateClienteSchema.parse(req.body);
    const cliente = await prisma.cliente.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(cliente);
  } catch (err) { next(err); }
});

// DELETE /api/v1/clientes/:id (admin) - soft delete
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cliente = await prisma.cliente.update({
      where: { id: Number(req.params.id) },
      data: { activo: false },
    });
    res.json(cliente);
  } catch (err) { next(err); }
});

// ===== PLANTAS (nested under cliente) =====

// GET /api/v1/clientes/:clienteId/plantas
router.get('/:clienteId/plantas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plantas = await prisma.planta.findMany({
      where: { clienteId: Number(req.params.clienteId) },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { maquinas: true, sistemas: true } } },
    });
    res.json(plantas);
  } catch (err) { next(err); }
});

// POST /api/v1/clientes/:clienteId/plantas (admin)
router.post('/:clienteId/plantas', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPlantaSchema.parse(req.body);
    const planta = await prisma.planta.create({
      data: { ...data, clienteId: Number(req.params.clienteId) },
    });
    res.status(201).json(planta);
  } catch (err) { next(err); }
});

// PUT /api/v1/clientes/:clienteId/plantas/:plantaId (admin)
router.put('/:clienteId/plantas/:plantaId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updatePlantaSchema.parse(req.body);
    const planta = await prisma.planta.update({
      where: { id: Number(req.params.plantaId) },
      data,
    });
    res.json(planta);
  } catch (err) { next(err); }
});

// DELETE /api/v1/clientes/:clienteId/plantas/:plantaId (admin)
router.delete('/:clienteId/plantas/:plantaId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.planta.delete({ where: { id: Number(req.params.plantaId) } });
    res.json({ message: 'Planta eliminada' });
  } catch (err) { next(err); }
});

// ===== MAQUINAS (nested under cliente) =====

// GET /api/v1/clientes/:clienteId/maquinas
router.get('/:clienteId/maquinas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = { clienteId: Number(req.params.clienteId) };
    if (req.query.plantaId) where.plantaId = Number(req.query.plantaId);
    const maquinas = await prisma.maquina.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: { planta: { select: { id: true, nombre: true } } },
    });
    res.json(maquinas);
  } catch (err) { next(err); }
});

// POST /api/v1/clientes/:clienteId/maquinas (admin)
router.post('/:clienteId/maquinas', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createMaquinaSchema.parse(req.body);
    const maquina = await prisma.maquina.create({
      data: { ...data, clienteId: Number(req.params.clienteId) },
    });
    res.status(201).json(maquina);
  } catch (err) { next(err); }
});

// PUT /api/v1/clientes/:clienteId/maquinas/:maquinaId (admin)
router.put('/:clienteId/maquinas/:maquinaId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateMaquinaSchema.parse(req.body);
    const maquina = await prisma.maquina.update({
      where: { id: Number(req.params.maquinaId) },
      data,
    });
    res.json(maquina);
  } catch (err) { next(err); }
});

// DELETE /api/v1/clientes/:clienteId/maquinas/:maquinaId (admin)
router.delete('/:clienteId/maquinas/:maquinaId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.maquina.delete({ where: { id: Number(req.params.maquinaId) } });
    res.json({ message: 'Maquina eliminada' });
  } catch (err) { next(err); }
});

export default router;
