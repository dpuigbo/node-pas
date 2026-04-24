import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

const router = Router();

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

// GET /api/v1/lookups/unidades-intervalo
router.get('/unidades-intervalo', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const unidades = await prisma.luUnidadIntervalo.findMany({
      orderBy: { orden: 'asc' },
    });
    res.json(unidades);
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/aceites?q=kyodo
router.get('/aceites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    if (q) {
      // Buscar por alias (incluye nombre original)
      const aliases = await prisma.aceiteAlias.findMany({
        where: { alias: { contains: q } },
        include: {
          aceite: true,
        },
      });
      // Deduplicar aceites
      const seen = new Set<number>();
      const aceites = aliases
        .map(a => a.aceite)
        .filter(a => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
      res.json(aceites);
    } else {
      const aceites = await prisma.aceite.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });
      res.json(aceites);
    }
  } catch (err) { next(err); }
});

// GET /api/v1/lookups/puntos-control?categoria=manipulador
router.get('/puntos-control', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.categoria) where.categoria = String(req.query.categoria);
    const puntos = await prisma.puntoControlGenerico.findMany({
      where,
      orderBy: { orden: 'asc' },
    });
    res.json(puntos);
  } catch (err) { next(err); }
});

export default router;
