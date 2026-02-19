import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createAceiteSchema, updateAceiteSchema,
  createConsumibleSchema, updateConsumibleSchema,
  updateConfigSchema, batchConfigSchema,
} from '../validation/catalogos.validation';

const router = Router();

// ===== ACEITES =====

// GET /api/v1/catalogos/aceites
router.get('/aceites', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const aceites = await prisma.aceite.findMany({ orderBy: { nombre: 'asc' } });
    res.json(aceites);
  } catch (err) { next(err); }
});

// POST /api/v1/catalogos/aceites (admin)
router.post('/aceites', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createAceiteSchema.parse(req.body);
    const aceite = await prisma.aceite.create({ data });
    res.status(201).json(aceite);
  } catch (err) { next(err); }
});

// PUT /api/v1/catalogos/aceites/:id (admin)
router.put('/aceites/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateAceiteSchema.parse(req.body);
    const aceite = await prisma.aceite.update({ where: { id: Number(req.params.id) }, data });
    res.json(aceite);
  } catch (err) { next(err); }
});

// DELETE /api/v1/catalogos/aceites/:id (admin) - soft delete
router.delete('/aceites/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aceite = await prisma.aceite.update({
      where: { id: Number(req.params.id) },
      data: { activo: false },
    });
    res.json(aceite);
  } catch (err) { next(err); }
});

// ===== CONSUMIBLES =====

// GET /api/v1/catalogos/consumibles
router.get('/consumibles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const consumibles = await prisma.consumible.findMany({ orderBy: { nombre: 'asc' } });
    res.json(consumibles);
  } catch (err) { next(err); }
});

// POST /api/v1/catalogos/consumibles (admin)
router.post('/consumibles', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createConsumibleSchema.parse(req.body);
    const consumible = await prisma.consumible.create({ data });
    res.status(201).json(consumible);
  } catch (err) { next(err); }
});

// PUT /api/v1/catalogos/consumibles/:id (admin)
router.put('/consumibles/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateConsumibleSchema.parse(req.body);
    const consumible = await prisma.consumible.update({ where: { id: Number(req.params.id) }, data });
    res.json(consumible);
  } catch (err) { next(err); }
});

// DELETE /api/v1/catalogos/consumibles/:id (admin) - soft delete
router.delete('/consumibles/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumible = await prisma.consumible.update({
      where: { id: Number(req.params.id) },
      data: { activo: false },
    });
    res.json(consumible);
  } catch (err) { next(err); }
});

// ===== CONFIGURACION APP =====

// GET /api/v1/catalogos/configuracion
router.get('/configuracion', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.configuracionApp.findMany({ orderBy: { clave: 'asc' } });
    // Convert to key-value object
    const configObj = config.reduce((acc: Record<string, string>, item) => {
      acc[item.clave] = item.valor;
      return acc;
    }, {});
    res.json(configObj);
  } catch (err) { next(err); }
});

// PUT /api/v1/catalogos/configuracion (admin) - batch update
router.put('/configuracion', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = batchConfigSchema.parse(req.body);
    await prisma.$transaction(
      items.map(item =>
        prisma.configuracionApp.upsert({
          where: { clave: item.clave },
          update: { valor: item.valor },
          create: { clave: item.clave, valor: item.valor },
        })
      )
    );
    res.json({ message: 'Configuracion actualizada' });
  } catch (err) { next(err); }
});

export default router;
