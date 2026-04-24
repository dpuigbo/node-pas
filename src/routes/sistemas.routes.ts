import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createSistemaSchema, updateSistemaSchema,
  createComponenteSchema, updateComponenteSchema,
  createSistemaCompletoSchema,
} from '../validation/sistemas.validation';

const router = Router();

// ===== SISTEMAS =====

// GET /api/v1/sistemas
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.clienteId) where.clienteId = Number(req.query.clienteId);
    if (req.query.maquinaId) where.maquinaId = Number(req.query.maquinaId);
    const sistemas = await prisma.sistema.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        cliente: { select: { id: true, nombre: true } },
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

// POST /api/v1/sistemas/completo (admin) — wizard: create sistema + all components atomically
router.post('/completo', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { componentes, ...sistemaData } = createSistemaCompletoSchema.parse(req.body);

    const sistema = await prisma.$transaction(async (tx) => {
      // 1. Create the sistema
      const newSistema = await tx.sistema.create({ data: sistemaData });

      // 2. Create all components
      for (const comp of componentes) {
        await tx.componenteSistema.create({
          data: {
            sistemaId: newSistema.id,
            modeloComponenteId: comp.modeloComponenteId,
            tipo: comp.tipo,
            etiqueta: comp.etiqueta,
            numeroSerie: comp.numeroSerie ?? null,
            numEjes: comp.numEjes ?? null,
            orden: comp.orden,
          },
        });
      }

      // 3. Return with full includes
      return tx.sistema.findUnique({
        where: { id: newSistema.id },
        include: {
          cliente: { select: { id: true, nombre: true } },
          fabricante: { select: { id: true, nombre: true } },
          componentes: {
            orderBy: { orden: 'asc' },
            include: { modeloComponente: { select: { id: true, nombre: true, tipo: true } } },
          },
        },
      });
    });

    res.status(201).json(sistema);
  } catch (err) { next(err); }
});

// PUT /api/v1/sistemas/:id/completo (admin) — wizard: update sistema + replace all components atomically
router.put('/:id/completo', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sistemaId = Number(req.params.id);
    const { componentes, ...sistemaData } = createSistemaCompletoSchema.parse(req.body);

    const sistema = await prisma.$transaction(async (tx) => {
      // 1. Update the sistema
      await tx.sistema.update({
        where: { id: sistemaId },
        data: {
          nombre: sistemaData.nombre,
          descripcion: sistemaData.descripcion ?? null,
          fabricanteId: sistemaData.fabricanteId,
        },
      });

      // 2. Delete all existing components
      await tx.componenteSistema.deleteMany({ where: { sistemaId } });

      // 3. Recreate all components
      for (const comp of componentes) {
        await tx.componenteSistema.create({
          data: {
            sistemaId,
            modeloComponenteId: comp.modeloComponenteId,
            tipo: comp.tipo,
            etiqueta: comp.etiqueta,
            numeroSerie: comp.numeroSerie ?? null,
            numEjes: comp.numEjes ?? null,
            orden: comp.orden,
          },
        });
      }

      // 4. Return with full includes
      return tx.sistema.findUnique({
        where: { id: sistemaId },
        include: {
          cliente: { select: { id: true, nombre: true } },
          fabricante: { select: { id: true, nombre: true } },
          componentes: {
            orderBy: { orden: 'asc' },
            include: { modeloComponente: { select: { id: true, nombre: true, tipo: true } } },
          },
        },
      });
    });

    if (!sistema) { res.status(404).json({ error: 'Sistema no encontrado' }); return; }
    res.json(sistema);
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

// POST /api/v1/sistemas/:sistemaId/componentes/robot-con-du (admin)
// Adds a robot + auto-creates a drive unit in a single transaction
router.post('/:sistemaId/componentes/robot-con-du', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sistemaId = Number(req.params.sistemaId);
    const data = createComponenteSchema.parse(req.body);

    if (data.tipo !== 'mechanical_unit') {
      res.status(400).json({ error: 'Este endpoint es solo para unidades mecanicas' });
      return;
    }

    // Count existing components to set orden
    const count = await prisma.componenteSistema.count({ where: { sistemaId } });

    await prisma.$transaction(async (tx) => {
      // Create the drive unit first
      await tx.componenteSistema.create({
        data: {
          sistemaId,
          modeloComponenteId: data.modeloComponenteId, // same modelo for now, DU is virtual
          tipo: 'drive_unit',
          etiqueta: `DU - ${data.etiqueta}`,
          orden: count,
        },
      });

      // Create the robot
      await tx.componenteSistema.create({
        data: {
          ...data,
          sistemaId,
          orden: count + 1,
        },
      });
    });

    // Return updated component list
    const componentes = await prisma.componenteSistema.findMany({
      where: { sistemaId },
      orderBy: { orden: 'asc' },
      include: { modeloComponente: { select: { id: true, nombre: true, tipo: true } } },
    });
    res.status(201).json(componentes);
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

// ===== COMPATIBILIDAD EJES EXTERNOS (tri-vía v2) =====

// GET /api/v1/sistemas/ejes/:ejeModeloId/compatibilidad?robotFamiliaId=X&controladorModeloId=Y
router.get('/ejes/:ejeModeloId/compatibilidad', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ejeModeloId = Number(req.params.ejeModeloId);
    const robotFamiliaId = req.query.robotFamiliaId ? Number(req.query.robotFamiliaId) : undefined;
    const controladorModeloId = req.query.controladorModeloId ? Number(req.query.controladorModeloId) : undefined;

    // 1. Whitelist de familias
    const permitidas = await prisma.compatibilidadEjePermitida.findMany({
      where: { ejeModeloId },
      include: { familia: { select: { id: true, codigo: true } } },
    });
    if (permitidas.length > 0 && robotFamiliaId &&
        !permitidas.some(p => p.familiaId === robotFamiliaId)) {
      res.json({
        compatible: false,
        motivo: 'Familia de robot no permitida por el eje externo',
        familiasPermitidas: permitidas.map(p => p.familia),
      });
      return;
    }

    // 2. Blacklist de familias
    const excluidas = await prisma.compatibilidadEjeExcluye.findMany({
      where: { ejeModeloId },
      include: { familia: { select: { id: true, codigo: true } } },
    });
    if (robotFamiliaId && excluidas.some(e => e.familiaId === robotFamiliaId)) {
      res.json({
        compatible: false,
        motivo: 'Familia de robot excluida para este eje externo',
        familiasExcluidas: excluidas.map(e => e.familia),
      });
      return;
    }

    // 3. Whitelist de controladores
    const ctrlReq = await prisma.compatibilidadEjeControlador.findMany({
      where: { ejeModeloId },
      include: { controlador: { select: { id: true, nombre: true } } },
    });
    if (ctrlReq.length > 0 && controladorModeloId &&
        !ctrlReq.some(c => c.controladorModeloId === controladorModeloId)) {
      res.json({
        compatible: false,
        motivo: 'Eje requiere controlador específico',
        controladoresRequeridos: ctrlReq.map(c => c.controlador),
      });
      return;
    }

    res.json({
      compatible: true,
      reglas: {
        familiasPermitidas: permitidas.length > 0 ? permitidas.map(p => p.familia) : null,
        familiasExcluidas: excluidas.length > 0 ? excluidas.map(e => e.familia) : null,
        controladoresRequeridos: ctrlReq.length > 0 ? ctrlReq.map(c => c.controlador) : null,
      },
    });
  } catch (err) { next(err); }
});

export default router;
