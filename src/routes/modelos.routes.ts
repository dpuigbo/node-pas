import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createModeloSchema, updateModeloSchema, updateCompatibilidadSchema,
  createVersionSchema, updateVersionSchema, activateVersionSchema,
} from '../validation/modelos.validation';
import { getSeedTemplate } from '../lib/templateSeeds';
import { ensureNivelesFijos, getNivelesFijos } from '../lib/niveles';
import { getNivelesAplicablesModelo } from '../lib/ofertaMantenimiento';

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
      orderBy: [{ familia: 'asc' }, { nombre: 'asc' }],
      include: {
        fabricante: { select: { id: true, nombre: true } },
        controladoresCompatibles: {
          include: { controlador: { select: { id: true, nombre: true, familia: true } } },
        },
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

    // Query through junction table: models compatible with any controller in the system
    const modelos = await prisma.modeloComponente.findMany({
      where: {
        tipo,
        controladoresCompatibles: {
          some: { controladorId: { in: controllerModelIds } },
        },
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
        warning: `Ninguno de los ${totalSinConfig} modelos de este tipo tiene compatibilidad con las controladoras del sistema.`,
      });
      return;
    }

    res.json({ modelos, warning: null });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/compatible-con?controladorId=X&tipo=Y
// Devuelve modelos compatibles con una controladora especifica.
// Para tipo='mechanical_unit' usa la matriz nueva compatibilidad_robot_controlador
// (cabinet-especifica, verificada Daniel). Para los demas tipos usa la tabla
// legacy compatibilidad_controlador.
router.get('/compatible-con', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const controladorId = Number(req.query.controladorId);
    const tipo = req.query.tipo as string;
    if (!controladorId || !tipo) {
      res.status(400).json({ error: 'controladorId y tipo son obligatorios' });
      return;
    }

    if (tipo === 'mechanical_unit') {
      // Matriz nueva: familia robot ↔ variante de cabinet
      const familiasOk = await prisma.compatibilidadRobotControlador.findMany({
        where: { controladorModeloId: controladorId },
        select: { robotFamiliaId: true },
      });
      const familiaIds = familiasOk.map(f => f.robotFamiliaId);
      if (familiaIds.length === 0) {
        res.json([]);
        return;
      }
      const modelos = await prisma.modeloComponente.findMany({
        where: {
          tipo: 'mechanical_unit',
          familiaId: { in: familiaIds },
        },
        orderBy: [{ familia: 'asc' }, { nombre: 'asc' }],
        include: {
          fabricante: { select: { id: true, nombre: true } },
        },
      });
      res.json(modelos);
      return;
    }

    // Otros tipos (drive_unit, external_axis): tabla legacy
    const modelos = await prisma.modeloComponente.findMany({
      where: {
        tipo: tipo as any,
        controladoresCompatibles: {
          some: { controladorId },
        },
      },
      orderBy: [{ familia: 'asc' }, { nombre: 'asc' }],
      include: {
        fabricante: { select: { id: true, nombre: true } },
      },
    });
    res.json(modelos);
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/niveles-aplicables
// Niveles aplicables para un modelo + horas + costes limpieza desde mantenimiento_horas_modelo.
// Va antes de /:id para evitar conflicto de Express.
router.get('/:id/niveles-aplicables', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const niveles = await getNivelesAplicablesModelo(modeloId);
    res.json({ modeloId, niveles });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/diagnostico
// Devuelve estadisticas para diagnosticar por que faltan datos:
//   - familiaId del modelo + nombre de familia
//   - conteo de actividades preventivas (v2) por familia
//   - conteo de actividades mantenimiento (legacy) por nombre familia
//   - conteo de lubricacion (v2) por modelo
//   - conteo de lubricacion_reductora (legacy) por fabricante + variante
router.get('/:id/diagnostico', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      include: {
        familiaRel: true,
        fabricante: { select: { id: true, nombre: true } },
      },
    });
    if (!modelo) {
      res.status(404).json({ error: 'Modelo no encontrado' });
      return;
    }

    const familiaIdNum = modelo.familiaId;
    const [
      actividadesV2,
      lubricacionV2,
      actividadesLegacy,
      lubricacionLegacy,
    ] = await Promise.all([
      familiaIdNum ? prisma.actividadPreventiva.count({ where: { familiaId: familiaIdNum } }) : Promise.resolve(0),
      prisma.lubricacion.count({ where: { modeloComponenteId: modeloId } }),
      prisma.actividadMantenimiento.count({
        where: {
          fabricanteId: modelo.fabricanteId,
          OR: [
            modelo.familia ? { familiaRobot: { contains: modelo.familia } } : { id: -1 },
            { familiaRobot: { contains: modelo.nombre } },
          ],
        },
      }),
      prisma.lubricacionReductora.count({
        where: {
          fabricanteId: modelo.fabricanteId,
          OR: [
            { varianteTrm: { contains: modelo.nombre } },
            modelo.familia ? { varianteTrm: { contains: modelo.familia } } : { id: -1 },
          ],
        },
      }),
    ]);

    res.json({
      modeloId,
      modeloNombre: modelo.nombre,
      modeloTipo: modelo.tipo,
      modeloFamiliaTexto: modelo.familia,
      familiaId: familiaIdNum,
      familia: modelo.familiaRel
        ? { codigo: modelo.familiaRel.codigo, descripcion: modelo.familiaRel.descripcion }
        : null,
      fabricante: modelo.fabricante,
      conteos: {
        actividades_preventiva_v2: actividadesV2,
        actividades_mantenimiento_legacy: actividadesLegacy,
        lubricacion_v2: lubricacionV2,
        lubricacion_reductora_legacy: lubricacionLegacy,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/lubricacion
// Devuelve la tabla de lubricacion del modelo (ejes con aceite, cantidad, unidad).
// Fallback a lubricacion_reductora (legacy) si tabla v2 esta vacia para el modelo.
router.get('/:id/lubricacion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const rows = await prisma.lubricacion.findMany({
      where: { modeloComponenteId: modeloId },
      include: {
        aceite: { select: { id: true, nombre: true, fabricante: true } },
        consumible: { select: { id: true, nombre: true, tipo: true, unidad: true } },
      },
      orderBy: [{ eje: 'asc' }, { id: 'asc' }],
    });
    if (rows.length > 0) {
      // Shape dual: `lubricacion/fuente` (oferta) + `records/source` (modelos)
      res.json({
        modeloId,
        lubricacion: rows,
        records: rows,
        fuente: 'lubricacion',
        source: 'v2',
      });
      return;
    }
    // Fallback a lubricacion_reductora por nombre del modelo
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      select: { nombre: true, fabricanteId: true, familia: true },
    });
    if (!modelo) {
      res.json({ modeloId, lubricacion: [], records: [], fuente: 'ninguna', source: 'v2' });
      return;
    }
    const legacy = await prisma.lubricacionReductora.findMany({
      where: {
        fabricanteId: modelo.fabricanteId,
        OR: [
          { varianteTrm: { contains: modelo.nombre } },
          modelo.familia ? { varianteTrm: { contains: modelo.familia } } : { id: -1 },
        ],
      },
      orderBy: [{ eje: 'asc' }, { id: 'asc' }],
      take: 200,
    });
    // Mapear a formato similar
    const mapped = legacy.map((r) => ({
      id: -r.id, // negativo para identificar legacy
      modeloComponenteId: modeloId,
      eje: r.eje,
      cantidadValor: null,
      cantidadUnidad: null,
      cantidadTextoLegacy: r.cantidad,
      varianteTrmLegacy: r.varianteTrm,
      tipoLubricanteLegacy: r.tipoLubricante,
      webConfig: r.webConfig,
      notas: null,
      aceite: null,
      consumible: null,
    }));
    res.json({
      modeloId,
      lubricacion: mapped,
      records: mapped,
      fuente: 'lubricacion_reductora_legacy',
      source: 'legacy',
    });
  } catch (err) { next(err); }
});

// PUT /api/v1/modelos/:id/lubricacion/:lubId (admin) — editar fila.
// Si lubId > 0 → update fila v2.
// Si lubId < 0 → crear fila v2 nueva clonando datos de lubricacion_reductora
//   (id = -lubId). Sirve para "promover" datos legacy a editables.
router.put('/:id/lubricacion/:lubId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const lubId = Number(req.params.lubId);
    const { eje, cantidadValor, cantidadUnidad, notas } = req.body;

    if (lubId > 0) {
      // Update v2 directo
      const updateData: any = {};
      if (eje !== undefined) updateData.eje = String(eje).trim();
      if (cantidadValor !== undefined) {
        updateData.cantidadValor = cantidadValor === null || cantidadValor === ''
          ? null
          : Number(cantidadValor);
      }
      if (cantidadUnidad !== undefined) {
        updateData.cantidadUnidad = cantidadUnidad || null;
      }
      if (notas !== undefined) updateData.notas = notas || null;
      const row = await prisma.lubricacion.update({
        where: { id: lubId },
        data: updateData,
        include: {
          aceite: { select: { id: true, nombre: true, fabricante: true } },
          consumible: { select: { id: true, nombre: true, tipo: true, unidad: true } },
        },
      });
      res.json(row);
      return;
    }

    // Legacy → clonar a v2
    const legacyId = -lubId;
    const legacy = await prisma.lubricacionReductora.findUnique({ where: { id: legacyId } });
    if (!legacy) {
      res.status(404).json({ error: 'Fila legacy no encontrada' });
      return;
    }
    // Si ya existe una fila v2 para (modelo, eje), updatear esa en vez de duplicar
    const existing = await prisma.lubricacion.findFirst({
      where: { modeloComponenteId: modeloId, eje: eje !== undefined ? String(eje).trim() : legacy.eje },
    });
    const dataPayload: any = {
      modeloComponenteId: modeloId,
      eje: eje !== undefined ? String(eje).trim() : legacy.eje,
      cantidadValor: cantidadValor === null || cantidadValor === '' || cantidadValor === undefined
        ? null : Number(cantidadValor),
      cantidadUnidad: cantidadUnidad || null,
      cantidadTextoLegacy: legacy.cantidad,
      varianteTrmLegacy: legacy.varianteTrm,
      tipoLubricanteLegacy: legacy.tipoLubricante,
      webConfig: legacy.webConfig,
      notas: notas || null,
    };
    let row;
    if (existing) {
      row = await prisma.lubricacion.update({
        where: { id: existing.id },
        data: dataPayload,
        include: {
          aceite: { select: { id: true, nombre: true, fabricante: true } },
          consumible: { select: { id: true, nombre: true, tipo: true, unidad: true } },
        },
      });
    } else {
      row = await prisma.lubricacion.create({
        data: dataPayload,
        include: {
          aceite: { select: { id: true, nombre: true, fabricante: true } },
          consumible: { select: { id: true, nombre: true, tipo: true, unidad: true } },
        },
      });
    }
    res.json(row);
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/actividades?nivel=X
// Devuelve las actividades preventivas de la familia del modelo, opcionalmente
// filtradas por nivel (CSV niveles incluye o esta vacio).
// Fallback a actividades_mantenimiento (legacy) si la familia v2 esta vacia.
router.get('/:id/actividades', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const nivel = (req.query.nivel as string | undefined)?.trim() || null;
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      select: { familiaId: true, fabricanteId: true, familia: true, nombre: true },
    });
    if (!modelo) {
      res.status(404).json({ error: 'Modelo no encontrado' });
      return;
    }

    // Resolver nivel codigo -> id para filtrar via actividad_nivel
    const nivelRow = nivel
      ? await prisma.luNivelMantenimiento.findUnique({ where: { codigo: nivel } })
      : null;
    const nivelId = nivelRow?.id ?? null;

    let actividades: any[] = [];
    if (modelo.familiaId) {
      const where: any = { familiaId: modelo.familiaId };
      // Filtrar por actividad_nivel si nivel especificado
      if (nivelId != null) {
        where.nivelesActividad = { some: { nivelId } };
      }
      actividades = await prisma.actividadPreventiva.findMany({
        where,
        include: {
          tipoActividad: { select: { codigo: true, nombre: true, categoria: true } },
          consumibles: {
            include: { consumible: { select: { id: true, nombre: true, tipo: true, unidad: true, coste: true, precio: true } } },
          },
          nivelesActividad: {
            include: { nivel: { select: { codigo: true } } },
          },
        },
        orderBy: { id: 'asc' },
      });
      // Si filtramos por nivelId, anadir info "obligatoria" del link concreto
      actividades = actividades.map((a) => {
        const link = nivelId != null ? a.nivelesActividad.find((l: any) => l.nivelId === nivelId) : null;
        return {
          ...a,
          obligatoria: link?.obligatoria ?? null,
          // Niveles asignados a esta actividad (codigos)
          nivelesAsignados: a.nivelesActividad.map((l: any) => l.nivel.codigo),
        };
      });
    }

    let fuente: 'actividad_preventiva' | 'actividades_mantenimiento_legacy' | 'ninguna' = 'actividad_preventiva';
    if (actividades.length === 0) {
      // Fallback a actividades_mantenimiento (legacy)
      const legacy = await prisma.actividadMantenimiento.findMany({
        where: {
          fabricanteId: modelo.fabricanteId,
          OR: [
            modelo.familia ? { familiaRobot: { contains: modelo.familia } } : { id: -1 },
            { familiaRobot: { contains: modelo.nombre } },
          ],
        },
        orderBy: { id: 'asc' },
        take: 200,
      });
      actividades = legacy.map((a) => ({
        id: -a.id,
        familiaId: null,
        componente: a.componente,
        intervaloHoras: null,
        intervaloMeses: null,
        intervaloCondicion: 'periodico',
        intervaloTextoLegacy: a.intervaloEstandar,
        intervaloFoundryHoras: null,
        intervaloFoundryMeses: null,
        niveles: null,
        nivelesAsignados: [],
        obligatoria: null,
        notas: a.notas,
        tipoActividad: { codigo: 'legacy', nombre: a.tipoActividad, categoria: 'otro' },
        consumibles: [],
      }));
      fuente = actividades.length > 0 ? 'actividades_mantenimiento_legacy' : 'ninguna';
    }

    res.json({ modeloId, nivel, actividades, fuente });
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        fabricante: { select: { id: true, nombre: true } },
        familiaRel: { select: { id: true, codigo: true, tipo: true, descripcion: true } },
        generacion: { select: { id: true, codigo: true, nombre: true } },
        versiones: { orderBy: { version: 'desc' } },
        controladoresCompatibles: {
          include: { controlador: { select: { id: true, nombre: true } } },
        },
        componentesCompatibles: {
          include: { componente: { select: { id: true, nombre: true, tipo: true } } },
        },
      },
    });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }
    res.json(modelo);
  } catch (err) { next(err); }
});

// GET /api/v1/modelos/:id/compatibilidad
// Devuelve la compatibilidad completa segun tipo:
//   external_axis: tri-via (whitelist familias, blacklist familias, whitelist controladores)
//   mechanical_unit: controllers compatibles
//   controller: modelos compatibles (robots + ejes)
//   drive_unit: controllers compatibles
router.get('/:id/compatibilidad', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      select: { id: true, nombre: true, tipo: true, familia: true, familiaId: true },
    });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }

    if (modelo.tipo === 'external_axis') {
      const [permitidas, excluidas, controladores] = await Promise.all([
        prisma.compatibilidadEjePermitida.findMany({
          where: { ejeModeloId: modeloId },
          include: { familia: { select: { id: true, codigo: true, descripcion: true } } },
        }),
        prisma.compatibilidadEjeExcluye.findMany({
          where: { ejeModeloId: modeloId },
          include: { familia: { select: { id: true, codigo: true, descripcion: true } } },
        }),
        prisma.compatibilidadEjeControlador.findMany({
          where: { ejeModeloId: modeloId },
          include: { controlador: { select: { id: true, nombre: true, familia: true } } },
        }),
      ]);

      res.json({
        tipo: 'external_axis',
        modelo,
        familiasPermitidas: permitidas.map(p => p.familia),
        familiasExcluidas: excluidas.map(e => e.familia),
        controladoresRequeridos: controladores.map(c => c.controlador),
      });
      return;
    }

    if (modelo.tipo === 'mechanical_unit' || modelo.tipo === 'drive_unit') {
      const compat = await prisma.compatibilidadControlador.findMany({
        where: { componenteId: modeloId },
        include: { controlador: { select: { id: true, nombre: true, familia: true } } },
      });
      res.json({
        tipo: modelo.tipo,
        modelo,
        controladoresCompatibles: compat.map(c => c.controlador),
      });
      return;
    }

    if (modelo.tipo === 'controller') {
      const [robots, ejes] = await Promise.all([
        prisma.compatibilidadControlador.findMany({
          where: { controladorId: modeloId },
          include: { componente: { select: { id: true, nombre: true, familia: true, tipo: true } } },
        }).then(rows => rows.filter(r => r.componente.tipo === 'mechanical_unit')),
        prisma.compatibilidadControlador.findMany({
          where: { controladorId: modeloId },
          include: { componente: { select: { id: true, nombre: true, familia: true, tipo: true } } },
        }).then(rows => rows.filter(r => r.componente.tipo === 'external_axis')),
      ]);

      res.json({
        tipo: 'controller',
        modelo,
        robotsCompatibles: robots.map(r => r.componente),
        ejesCompatibles: ejes.map(r => r.componente),
      });
      return;
    }

    res.json({ tipo: modelo.tipo, modelo });
  } catch (err) { next(err); }
});

// POST /api/v1/modelos (admin)
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { controladorIds, ...modelData } = createModeloSchema.parse(req.body);
    // Auto-assign fixed levels based on component type
    modelData.niveles = ensureNivelesFijos(modelData.tipo, modelData.niveles);

    // Application-level duplicate check: same (fabricanteId, tipo, familia, nombre) + same controller set
    const existing = await prisma.modeloComponente.findMany({
      where: { fabricanteId: modelData.fabricanteId, tipo: modelData.tipo, familia: modelData.familia ?? null, nombre: modelData.nombre },
      include: { controladoresCompatibles: { select: { controladorId: true } } },
    });
    const sortedNew = [...(controladorIds ?? [])].sort((a, b) => a - b);
    const isDuplicate = existing.some((e) => {
      const sortedExisting = e.controladoresCompatibles.map((c) => c.controladorId).sort((a, b) => a - b);
      return JSON.stringify(sortedExisting) === JSON.stringify(sortedNew);
    });
    if (isDuplicate) {
      res.status(409).json({ error: 'Ya existe un modelo identico con las mismas controladoras asociadas.' });
      return;
    }

    const modelo = await prisma.modeloComponente.create({
      data: {
        ...modelData,
        controladoresCompatibles: {
          create: (controladorIds ?? []).map((cId: number) => ({ controladorId: cId })),
        },
      },
      include: {
        fabricante: { select: { id: true, nombre: true } },
        controladoresCompatibles: {
          include: { controlador: { select: { id: true, nombre: true } } },
        },
      },
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

// PUT /api/v1/modelos/:id/compatibilidad (admin) — sync controller associations
router.put('/:id/compatibilidad', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { controladorIds } = updateCompatibilidadSchema.parse(req.body);
    const id = Number(req.params.id);

    // Get current model info for duplicate check
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id },
      select: { fabricanteId: true, tipo: true, familia: true, nombre: true },
    });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }

    // Duplicate check: another model with same familia+name + same controller set
    const existing = await prisma.modeloComponente.findMany({
      where: { fabricanteId: modelo.fabricanteId, tipo: modelo.tipo, familia: modelo.familia, nombre: modelo.nombre, id: { not: id } },
      include: { controladoresCompatibles: { select: { controladorId: true } } },
    });
    const sortedNew = [...controladorIds].sort((a, b) => a - b);
    const isDuplicate = existing.some((e) => {
      const sortedExisting = e.controladoresCompatibles.map((c) => c.controladorId).sort((a, b) => a - b);
      return JSON.stringify(sortedExisting) === JSON.stringify(sortedNew);
    });
    if (isDuplicate) {
      res.status(409).json({ error: 'Ya existe otro modelo identico con las mismas controladoras.' });
      return;
    }

    // Delete-and-recreate junction records
    await prisma.$transaction([
      prisma.compatibilidadControlador.deleteMany({ where: { componenteId: id } }),
      ...(controladorIds.length > 0
        ? [prisma.modeloComponente.update({
            where: { id },
            data: {
              controladoresCompatibles: {
                create: controladorIds.map((cId) => ({ controladorId: cId })),
              },
            },
          })]
        : []),
    ]);

    const updated = await prisma.modeloComponente.findUnique({
      where: { id },
      include: {
        controladoresCompatibles: {
          include: { controlador: { select: { id: true, nombre: true } } },
        },
      },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/v1/modelos/:id (admin)
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.modeloComponente.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Modelo eliminado' });
  } catch (err) { next(err); }
});

// ===== MANTENIMIENTO (nested under modelo) =====
// (lubricacion ahora esta unificado arriba en /:id/lubricacion)

// GET /api/v1/modelos/:id/mantenimiento
// Returns activities depending on the model type:
//   controller       → actividad_cabinet
//   drive_unit       → actividad_drive_module
//   mechanical_unit  → actividad_preventiva
//   external_axis    → actividad_preventiva
router.get('/:id/mantenimiento', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modeloId = Number(req.params.id);
    const modelo = await prisma.modeloComponente.findUnique({
      where: { id: modeloId },
      select: { tipo: true, familia: true, familiaId: true, fabricanteId: true },
    });
    if (!modelo) { res.status(404).json({ error: 'Modelo no encontrado' }); return; }

    // Controller → actividad_cabinet
    if (modelo.tipo === 'controller') {
      const records = await prisma.actividadCabinet.findMany({
        where: { cabinetModeloId: modeloId },
        orderBy: [{ tipoActividadId: 'asc' }, { componente: 'asc' }],
        include: {
          tipoActividad: { select: { id: true, nombre: true, categoria: true } },
        },
      });
      res.json({ source: 'cabinet', records });
      return;
    }

    // Drive unit → actividad_drive_module
    if (modelo.tipo === 'drive_unit') {
      const records = await prisma.actividadDriveModule.findMany({
        where: { driveModuleModeloId: modeloId },
        orderBy: [{ tipoActividadId: 'asc' }, { componente: 'asc' }],
        include: {
          tipoActividad: { select: { id: true, nombre: true, categoria: true } },
          controladorAsociado: { select: { id: true, nombre: true } },
        },
      });
      res.json({ source: 'drive_module', records });
      return;
    }

    // Mechanical unit / external axis → actividad_preventiva (por familia)
    if (modelo.familiaId) {
      const normalized = await prisma.actividadPreventiva.findMany({
        where: { familiaId: modelo.familiaId },
        orderBy: [{ tipoActividadId: 'asc' }, { componente: 'asc' }],
        include: {
          tipoActividad: { select: { id: true, nombre: true, categoria: true } },
          familia: { select: { id: true, codigo: true } },
        },
      });

      if (normalized.length > 0) {
        res.json({ source: 'v2', records: normalized });
        return;
      }
    }

    // Fallback legacy
    const legacy = await prisma.actividadMantenimiento.findMany({
      where: {
        fabricanteId: modelo.fabricanteId,
        familiaRobot: modelo.familia ?? '',
      },
      orderBy: [{ tipoActividad: 'asc' }, { componente: 'asc' }],
    });
    res.json({ source: 'legacy', records: legacy });
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
