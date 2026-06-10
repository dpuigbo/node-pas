import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { getControladoresCompatiblesFamilia } from '../lib/validarCompatibilidadEje';
import { parseIdArray } from '../lib/planMantenimiento';

const router = Router();

// GET /api/v1/lookups/familias/:id/controladores-compatibles
// Controladores compatibles con la familia robot (union de los JSON
// controladores_compatibles de sus modelos activos).
router.get('/familias/:id/controladores-compatibles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familiaId = Number(req.params.id);
    const controladores = await getControladoresCompatiblesFamilia(familiaId);
    if (controladores.length === 0) {
      res.json([]);
      return;
    }
    const detalles = await prisma.modeloComponente.findMany({
      where: { id: { in: controladores.map((c) => c.id) } },
      select: {
        id: true, nombre: true,
        soportaMultimove: true, maxRobotsMultimove: true, maxEjesExternos: true,
        familiaRel: { select: { codigo: true } },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(detalles.map((d) => ({ ...d, familia: d.familiaRel?.codigo ?? null })));
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/controladores/:id/familias-compatibles
// Inverso: familias robot cuyos modelos declaran este controlador en su JSON.
router.get('/controladores/:id/familias-compatibles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const controladorId = Number(req.params.id);
    const modelos = await prisma.modeloComponente.findMany({
      where: { tipo: 'mechanical_unit', activa: true, familiaId: { not: null } },
      select: {
        familiaId: true,
        controladoresCompatibles: true,
        familiaRel: { select: { id: true, codigo: true, descripcion: true } },
      },
    });
    const familias = new Map<number, { id: number; codigo: string; descripcion: string | null }>();
    for (const m of modelos) {
      if (!(parseIdArray(m.controladoresCompatibles) ?? []).includes(controladorId)) continue;
      if (m.familiaRel) familias.set(m.familiaRel.id, m.familiaRel);
    }
    res.json(Array.from(familias.values()).sort((a, b) => a.codigo.localeCompare(b.codigo)));
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/familias?fabricanteId=1&tipo=mechanical_unit
router.get('/familias', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = { activa: true };
    if (req.query.fabricanteId) where.fabricanteId = Number(req.query.fabricanteId);
    if (req.query.tipo) where.tipo = String(req.query.tipo);
    const familias = await prisma.luFamilia.findMany({
      where,
      orderBy: { codigo: 'asc' },
      include: { fabricante: { select: { id: true, nombre: true } } },
    });
    res.json(familias);
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/generaciones-controlador
router.get('/generaciones-controlador', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const generaciones = await prisma.luGeneracionControlador.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });
    res.json(generaciones);
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/tipos-actividad
router.get('/tipos-actividad', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tipos = await prisma.luTipoActividad.findMany({
      orderBy: { orden: 'asc' },
    });
    res.json(tipos);
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/niveles-mantenimiento
router.get('/niveles-mantenimiento', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const niveles = await prisma.luNivelMantenimiento.findMany({
      orderBy: { orden: 'asc' },
    });
    res.json(niveles);
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/montajes
router.get('/montajes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const montajes = await prisma.luMontaje.findMany({ orderBy: { id: 'asc' } });
    res.json(montajes);
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/protecciones
router.get('/protecciones', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const protecciones = await prisma.luProteccion.findMany({
      where: { activa: true },
      orderBy: { id: 'asc' },
    });
    res.json(protecciones);
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/aceites?q=kyodo
// Compat: la tabla `aceites` fue eliminada en v2.9. Devuelve consumibles de
// tipo aceite/grasa del catalogo unificado.
router.get('/aceites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    const where: any = { activo: true, tipo: { in: ['aceite', 'grasa'] } };
    if (q) {
      where.OR = [
        { nombre: { contains: q } },
        { codigoInterno: { contains: q } },
        { codigoFabricante: { contains: q } },
        { equivalencias: { contains: q } },
      ];
    }
    const aceites = await prisma.consumibleCatalogo.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
    res.json(aceites);
  } catch (err) { next(err); }
});

// ===== ACTIVIDAD ↔ CONSUMIBLE (M:N) =====
// v2.9: actividad_cabinet y actividad_drive_module se fusionaron en
// actividad_preventiva; solo queda el tipo 'preventiva'.

// GET /api/v1/lookups/actividad/preventiva/:id/consumibles
router.get('/actividad/:tipo(preventiva)/:id/consumibles',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const items = await prisma.actividadConsumible.findMany({
        where: { actividadPreventivaId: id },
        include: { consumible: true },
      });
      res.json(items);
    } catch (err) { next(err); }
  });

// POST /api/v1/lookups/actividad/preventiva/:id/consumibles
router.post('/actividad/:tipo(preventiva)/:id/consumibles',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const { consumibleId, cantidad, unidad, notas } = req.body;
      const item = await prisma.actividadConsumible.create({
        data: { actividadPreventivaId: id, consumibleId, cantidad, unidad, notas },
        include: { consumible: true },
      });
      res.status(201).json(item);
    } catch (err) { next(err); }
  });

// DELETE /api/v1/lookups/actividad/preventiva/:id/consumibles/:linkId
router.delete('/actividad/:tipo(preventiva)/:id/consumibles/:linkId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const linkId = Number(req.params.linkId);
      await prisma.actividadConsumible.delete({ where: { id: linkId } });
      res.json({ message: 'Eliminado' });
    } catch (err) { next(err); }
  });

// GET /api/v1/lookups/actividades-preventivas?tipoComponente=mechanical_unit&nivel=N3
// Catalogo completo de actividades preventivas (v2.9, unificadas).
router.get('/actividades-preventivas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.tipoComponente) where.tipoComponenteAplicable = String(req.query.tipoComponente);
    const items = await prisma.actividadPreventiva.findMany({
      where,
      include: {
        tipoActividad: { select: { id: true, codigo: true, nombre: true, categoria: true } },
        nivel: { select: { id: true, codigo: true, nombre: true } },
        consumibles: {
          include: {
            consumible: { select: { id: true, codigoInterno: true, nombre: true, tipo: true } },
          },
        },
      },
      orderBy: [{ tipoComponenteAplicable: 'asc' }, { orden: 'asc' }, { id: 'asc' }],
    });
    const nivelCodigo = req.query.nivel ? String(req.query.nivel) : null;
    const filtered = nivelCodigo ? items.filter((i) => i.nivel?.codigo === nivelCodigo) : items;
    // Resolver nombres de modelos aplicables en batch
    const modeloIds = new Set<number>();
    for (const it of filtered) {
      for (const id of parseIdArray(it.modelosAplicables) ?? []) modeloIds.add(id);
    }
    const modelos = modeloIds.size > 0
      ? await prisma.modeloComponente.findMany({
          where: { id: { in: Array.from(modeloIds) } },
          select: { id: true, nombre: true },
        })
      : [];
    const modeloMap = new Map(modelos.map((m) => [m.id, m.nombre]));
    res.json(filtered.map((it) => ({
      ...it,
      modelosAplicablesInfo: (parseIdArray(it.modelosAplicables) ?? [])
        .map((id) => ({ id, nombre: modeloMap.get(id) ?? `#${id}` })),
    })));
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/consumibles-catalogo?tipo=aceite&subtipo=engranaje&q=...
router.get('/consumibles-catalogo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.activo !== '0') where.activo = true;
    if (req.query.tipo) where.tipo = String(req.query.tipo);
    if (req.query.subtipo) where.subtipo = String(req.query.subtipo);
    if (req.query.q) {
      where.OR = [
        { nombre: { contains: String(req.query.q) } },
        { codigoInterno: { contains: String(req.query.q) } },
        { codigoFabricante: { contains: String(req.query.q) } },
      ];
    }
    const items = await prisma.consumibleCatalogo.findMany({
      where,
      orderBy: [{ tipo: 'asc' }, { subtipo: 'asc' }, { nombre: 'asc' }],
    });
    res.json(items);
  } catch (err) { next(err); }
});

// POST /api/v1/lookups/consumibles-catalogo
router.post('/consumibles-catalogo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.consumibleCatalogo.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

// PUT /api/v1/lookups/consumibles-catalogo/:id
router.put('/consumibles-catalogo/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.consumibleCatalogo.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (err) { next(err); }
});

// DELETE /api/v1/lookups/consumibles-catalogo/:id (soft delete)
router.delete('/consumibles-catalogo/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.consumibleCatalogo.update({
      where: { id: Number(req.params.id) },
      data: { activo: false },
    });
    res.json(item);
  } catch (err) { next(err); }
});

export default router;
