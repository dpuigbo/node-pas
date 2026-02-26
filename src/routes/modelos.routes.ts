import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createModeloSchema, updateModeloSchema,
  createVersionSchema, updateVersionSchema, activateVersionSchema,
} from '../validation/modelos.validation';
import { getSeedTemplate } from '../lib/templateSeeds';
import { ensureNivelesFijos, getNivelesFijos } from '../lib/niveles';

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
        controlador: { select: { id: true, nombre: true } },
        componentesAsociados: { select: { id: true, nombre: true, tipo: true } },
        _count: { select: { versiones: true } },
      },
    });
    res.json(modelos);
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/compatible?sistemaId=X&tipo=Y
// Returns models whose controladorId matches a controller in the system
router.get('/compatible', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sistemaId = Number(req.query.sistemaId);
    const tipo = req.query.tipo as 'controller' | 'mechanical_unit' | 'drive_unit' | 'external_axis';
    if (!sistemaId || !tipo) {
      res.status(400).json({ error: 'sistemaId y tipo son obligatorios' });
      return;
    }

    const sistema = await prisma.sistema.findUnique({
      where: { id: sistemaId },
      select: { fabricanteId: true },
    });
    if (!sistema) { res.status(404).json({ error: 'Sistema no encontrado' }); return; }

    // For controllers: return all controllers of the system's fabricante
    if (tipo === 'controller') {
      const modelos = await prisma.modeloComponente.findMany({
        where: { fabricanteId: sistema.fabricanteId, tipo: 'controller' },
        orderBy: { nombre: 'asc' },
        include: { fabricante: { select: { id: true, nombre: true } } },
      });
      res.json({ modelos, warning: null });
      return;
    }

    // For non-controllers: find controllers in this system
    const controladores = await prisma.componenteSistema.findMany({
      where: { sistemaId, tipo: 'controller' },
      select: { modeloComponenteId: true },
    });

    if (controladores.length === 0) {
      const modelos = await prisma.modeloComponente.findMany({
        where: { fabricanteId: sistema.fabricanteId, tipo },
        orderBy: { nombre: 'asc' },
        include: { fabricante: { select: { id: true, nombre: true } } },
      });
      res.json({ modelos, warning: 'No hay controladoras en el sistema. Se muestran todos los modelos.' });
      return;
    }

    const controllerModelIds = [...new Set(controladores.map((c: { modeloComponenteId: number }) => c.modeloComponenteId))];

    // Direct query: models whose controladorId is one of the system's controllers
    const modelos = await prisma.modeloComponente.findMany({
      where: {
        tipo,
        controladorId: { in: controllerModelIds },
      },
      orderBy: { nombre: 'asc' },
      include: { fabricante: { select: { id: true, nombre: true } } },
    });

    if (modelos.length === 0) {
      const totalSinConfig = await prisma.modeloComponente.count({
        where: { tipo, fabricanteId: sistema.fabricanteId },
      });
      res.json({
        modelos: [],
        warning: `Ninguno de los ${totalSinConfig} modelos de este tipo tiene controladora asignada entre las del sistema.`,
      });
      return;
    }

    res.json({ modelos, warning: null });
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
        controlador: { select: { id: true, nombre: true } },
        componentesAsociados: { select: { id: true, nombre: true, tipo: true } },
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
    // Auto-assign fixed levels based on component type
    data.niveles = ensureNivelesFijos(data.tipo, data.niveles);
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
    // If niveles is being updated, ensure fixed levels are included
    if (data.niveles !== undefined) {
      // Need to know the tipo — either from body or from existing record
      const existing = await prisma.modeloComponente.findUnique({
        where: { id: Number(req.params.id) },
        select: { tipo: true },
      });
      if (existing) {
        data.niveles = ensureNivelesFijos(existing.tipo, data.niveles);
      }
    }
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

    // If schema is empty and it's the first version, use seed template based on model tipo
    let schema = data.schema;
    const blocks = (schema as any)?.blocks;
    if (!blocks || (Array.isArray(blocks) && blocks.length === 0)) {
      const modelo = await prisma.modeloComponente.findUnique({
        where: { id: modeloId },
        select: { tipo: true },
      });
      if (modelo) {
        schema = getSeedTemplate(modelo.tipo);
      }
    }

    const version = await prisma.versionTemplate.create({
      data: {
        modeloComponenteId: modeloId,
        version: nextVersion,
        schema: schema as any,
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
