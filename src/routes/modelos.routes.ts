import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createModeloSchema, updateModeloSchema,
  createVersionSchema, updateVersionSchema, activateVersionSchema,
} from '../validation/modelos.validation';

const router = Router();

// ===== MODELOS COMPONENTE =====

// GET /api/v1/modelos
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.fabricanteId) where.fabricanteId = Number(req.query.fabricanteId);
    if (req.query.tipo) where.tipo = req.query.tipo;
    const modelos = await prisma.modeloComponente.findMany({
      where,
      orderBy: [{ fabricanteId: 'asc' }, { tipo: 'asc' }, { nombre: 'asc' }],
      include: {
        fabricante: { select: { id: true, nombre: true } },
        _count: { select: { versiones: true } },
      },
    });
    res.json(modelos);
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        fabricante: { select: { id: true, nombre: true } },
        versiones: { orderBy: { version: 'desc' } },
      },
    });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }
    res.json(modelo);
  } catch (err) { next(err); }
});

// POST /api/v1/modelos (admin)
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createModeloSchema.parse(req.body);
    const modelo = await prisma.modeloComponente.create({
      data,
      include: { fabricante: { select: { id: true, nombre: true } } },
    });
    res.status(201).json(modelo);
  } catch (err) { next(err); }
});

// PUT /api/v1/modelos/:id (admin)
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateModeloSchema.parse(req.body);
    const modelo = await prisma.modeloComponente.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(modelo);
  } catch (err) { next(err); }
});

// DELETE /api/v1/modelos/:id (admin)
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.modeloComponente.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Modelo eliminado' });
  } catch (err) { next(err); }
});

// ===== VERSIONES TEMPLATE (nested under modelo) =====

// GET /api/v1/modelos/:modeloId/versiones
router.get('/:modeloId/versiones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const versiones = await prisma.versionTemplate.findMany({
      where: { modeloComponenteId: Number(req.params.modeloId) },
      orderBy: { version: 'desc' },
    });
    res.json(versiones);
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:modeloId/versiones/:versionId
router.get('/:modeloId/versiones/:versionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await prisma.versionTemplate.findUnique({
      where: { id: Number(req.params.versionId) },
      include: {
        modeloComponente: {
          include: { fabricante: { select: { id: true, nombre: true } } },
        },
      },
    });
    if (!version) { res.status(404).json({ error: 'Version no encontrada' }); return; }
    res.json(version);
  } catch (err) { next(err); }
});

// POST /api/v1/modelos/:modeloId/versiones (admin)
router.post('/:modeloId/versiones', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createVersionSchema.parse(req.body);
    const modeloId = Number(req.params.modeloId);

    // Auto-calculate next version number
    const lastVersion = await prisma.versionTemplate.findFirst({
      where: { modeloComponenteId: modeloId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    const version = await prisma.versionTemplate.create({
      data: {
        modeloComponenteId: modeloId,
        version: nextVersion,
        schema: data.schema,
        notas: data.notas,
      },
    });
    res.status(201).json(version);
  } catch (err) { next(err); }
});

// PUT /api/v1/modelos/:modeloId/versiones/:versionId (admin)
router.put('/:modeloId/versiones/:versionId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateVersionSchema.parse(req.body);
    const version = await prisma.versionTemplate.update({
      where: { id: Number(req.params.versionId) },
      data,
    });
    res.json(version);
  } catch (err) { next(err); }
});

// PATCH /api/v1/modelos/:modeloId/versiones/:versionId/estado (admin)
// Business rule: activating a version deactivates all other active versions of the same model
router.patch('/:modeloId/versiones/:versionId/estado', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = activateVersionSchema.parse(req.body);
    const versionId = Number(req.params.versionId);
    const modeloId = Number(req.params.modeloId);

    if (estado === 'activo') {
      // Atomic transaction: deactivate others + activate this one
      const [, version] = await prisma.$transaction([
        prisma.versionTemplate.updateMany({
          where: { modeloComponenteId: modeloId, estado: 'activo' },
          data: { estado: 'obsoleto' },
        }),
        prisma.versionTemplate.update({
          where: { id: versionId },
          data: { estado: 'activo' },
        }),
      ]);
      res.json(version);
    } else {
      const version = await prisma.versionTemplate.update({
        where: { id: versionId },
        data: { estado },
      });
      res.json(version);
    }
  } catch (err) { next(err); }
});

// DELETE /api/v1/modelos/:modeloId/versiones/:versionId (admin)
router.delete('/:modeloId/versiones/:versionId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await prisma.versionTemplate.findUnique({
      where: { id: Number(req.params.versionId) },
    });
    if (version?.estado === 'activo') {
      res.status(400).json({ error: 'No se puede eliminar una version activa. Desactivala primero.' });
      return;
    }
    await prisma.versionTemplate.delete({ where: { id: Number(req.params.versionId) } });
    res.json({ message: 'Version eliminada' });
  } catch (err) { next(err); }
});

export default router;
