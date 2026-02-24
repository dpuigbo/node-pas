import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

const router = Router();

// GET /api/v1/dashboard
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalClientes,
      totalSistemas,
      intervencionesActivas,
      informesPendientes,
      ultimasIntervenciones,
    ] = await Promise.all([
      prisma.cliente.count({ where: { activo: true } }),
      prisma.sistema.count(),
      prisma.intervencion.count({ where: { estado: { in: ['borrador', 'en_curso'] } } }),
      prisma.informe.count({ where: { estado: { in: ['inactivo', 'activo'] } } }),
      prisma.intervencion.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true } },
          _count: { select: { informes: true, sistemas: true } },
        },
      }),
    ]);

    res.json({
      stats: {
        totalClientes,
        totalSistemas,
        intervencionesActivas,
        informesPendientes,
      },
      ultimasIntervenciones,
    });
  } catch (err) { next(err); }
});

// GET /api/v1/dashboard/calendario?mes=2026-02
// Returns intervenciones for a given month (for calendar view)
router.get('/calendario', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mes = req.query.mes as string; // formato: YYYY-MM
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      res.status(400).json({ error: 'Parametro mes requerido (formato: YYYY-MM)' });
      return;
    }

    const [year, month] = mes.split('-').map(Number);
    const start = new Date(year!, month! - 1, 1); // first day of month
    const end = new Date(year!, month!, 1); // first day of next month

    // Find intervenciones that overlap with the month range
    // An intervention overlaps if: fechaInicio < end AND (fechaFin >= start OR fechaFin is null)
    const intervenciones = await prisma.intervencion.findMany({
      where: {
        OR: [
          // Has fechaInicio in this month
          {
            fechaInicio: { gte: start, lt: end },
          },
          // Has fechaFin in this month
          {
            fechaFin: { gte: start, lt: end },
          },
          // Spans the entire month (starts before, ends after)
          {
            fechaInicio: { lt: start },
            fechaFin: { gte: end },
          },
        ],
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: {
          include: {
            sistema: { select: { id: true, nombre: true } },
          },
        },
        _count: { select: { informes: true } },
      },
      orderBy: { fechaInicio: 'asc' },
    });

    res.json(intervenciones);
  } catch (err) { next(err); }
});

export default router;
