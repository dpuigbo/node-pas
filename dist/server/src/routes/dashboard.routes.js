"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// GET /api/v1/dashboard
router.get('/', async (_req, res, next) => {
    try {
        const [totalClientes, totalSistemas, intervencionesActivas, informesPendientes, ultimasIntervenciones,] = await Promise.all([
            database_1.prisma.cliente.count({ where: { activo: true } }),
            database_1.prisma.sistema.count(),
            database_1.prisma.intervencion.count({ where: { estado: { in: ['borrador', 'en_curso'] } } }),
            database_1.prisma.informe.count({ where: { estado: 'borrador' } }),
            database_1.prisma.intervencion.findMany({
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
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map