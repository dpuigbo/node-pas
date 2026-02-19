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
      prisma.informe.count({ where: { estado: 'borrador' } }),
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

export default router;
