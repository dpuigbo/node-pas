import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createSistemaSchema, updateSistemaSchema,
  createComponenteSchema, updateComponenteSchema,
} from '../validation/sistemas.validation';

const router = Router();

// ===== SISTEMAS =====

// GET /api/v1/sistemas
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.clienteId) where.clienteId = Number(req.query.clienteId);
    if (req.query.plantaId) where.plantaId = Number(req.query.plantaId);
    if (req.query.maquinaId) where.maquinaId = Number(req.query.maquinaId);
    const sistemas = await prisma.sistema.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        cliente: { select: { id: true, nombre: true } },
        planta: { select: { id: true, nombre: true } },
        maquina: { select: { id: true, nombre: true } },
        fabricante: { select: { id: true, nombre: true } },
        _count: { select: { componentes: true } },
      },
    });
    res.json(sistemas);
  } catch (err) { next(err); }
});

// GET /api/v1/sistemas/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sistema = await prisma.sistema.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        cliente: { select: { id: true, nombre: true } },
        planta: { select: { id: true, nombre: true } },
        maquina: { select: { id: true, nombre: true } },
        fabricante: { select: { id: true, nombre: true } },
        componentes: {
          orderBy: { orden: 'asc' },
          include: {
            modeloComponente: {
              select: { id: true, nombre: true, tipo: true },
            },
          },
        },
      },
    });
    if (!sistema) { res.status(404).json({ error: 'Sistema no encontrado' }); return; }
    res.json(sistema);
  } catch (err) { next(err); }
});

// POST /api/v1/sistemas (admin)
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSistemaSchema.parse(req.body);
    const sistema = await prisma.sistema.create({
      data,
      include: {
        cliente: { select: { id: true, nombre: true } },
        fabricante: { select: { id: true, nombre: true } },
      },
    });
    res.status(201).json(sistema);
  } catch (err) { next(err); }
});

// PUT /api/v1/sistemas/:id (admin)
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateSistemaSchema.parse(req.body);
    const sistema = await prisma.sistema.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(sistema);
  } catch (err) { next(err); }
});

// DELETE /api/v1/sistemas/:id (admin)
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.sistema.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Sistema eliminado' });
  } catch (err) { next(err); }
});

// ===== COMPONENTES SISTEMA (nested under sistema) =====

// GET /api/v1/sistemas/:sistemaId/componentes
router.get('/:sistemaId/componentes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const componentes = await prisma.componenteSistema.findMany({
      where: { sistemaId: Number(req.params.sistemaId) },
      orderBy: { orden: 'asc' },
      include: {
        modeloComponente: {
          select: { id: true, nombre: true, tipo: true, fabricanteId: true },
          include: { fabricante: { select: { nombre: true } } },
        },
      },
    });
    res.json(componentes);
  } catch (err) { next(err); }
});

// POST /api/v1/sistemas/:sistemaId/componentes (admin)
router.post('/:sistemaId/componentes', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createComponenteSchema.parse(req.body);
    const componente = await prisma.componenteSistema.create({
      data: { ...data, sistemaId: Number(req.params.sistemaId) },
    });
    res.status(201).json(componente);
  } catch (err) { next(err); }
});

// PUT /api/v1/sistemas/:sistemaId/componentes/:componenteId (admin)
router.put('/:sistemaId/componentes/:componenteId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateComponenteSchema.parse(req.body);
    const componente = await prisma.componenteSistema.update({
      where: { id: Number(req.params.componenteId) },
      data,
    });
    res.json(componente);
  } catch (err) { next(err); }
});

// DELETE /api/v1/sistemas/:sistemaId/componentes/:componenteId (admin)
router.delete('/:sistemaId/componentes/:componenteId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.componenteSistema.delete({ where: { id: Number(req.params.componenteId) } });
    res.json({ message: 'Componente eliminado' });
  } catch (err) { next(err); }
});

export default router;
