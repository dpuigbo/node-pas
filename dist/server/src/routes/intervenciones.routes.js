"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const intervenciones_validation_1 = require("../validation/intervenciones.validation");
const router = (0, express_1.Router)();
/** Build sistema rows from either `sistemas` (new) or `sistemaIds` (legacy) */
function buildSistemaRows(data) {
    if (data.sistemas && data.sistemas.length > 0) {
        return data.sistemas.map((s) => ({ sistemaId: s.sistemaId, nivel: s.nivel }));
    }
    if (data.sistemaIds && data.sistemaIds.length > 0) {
        return data.sistemaIds.map((id) => ({ sistemaId: id, nivel: '1' }));
    }
    return [];
}
// GET /api/v1/intervenciones
router.get('/', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.clienteId)
            where.clienteId = Number(req.query.clienteId);
        if (req.query.estado)
            where.estado = req.query.estado;
        if (req.query.tipo)
            where.tipo = req.query.tipo;
        const intervenciones = await database_1.prisma.intervencion.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                cliente: { select: { id: true, nombre: true } },
                sistemas: {
                    include: {
                        sistema: { select: { id: true, nombre: true } },
                    },
                },
                _count: { select: { informes: true } },
            },
        });
        res.json(intervenciones);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/intervenciones/:id
router.get('/:id', async (req, res, next) => {
    try {
        const intervencion = await database_1.prisma.intervencion.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                cliente: { select: { id: true, nombre: true } },
                sistemas: {
                    include: {
                        sistema: {
                            include: {
                                fabricante: { select: { id: true, nombre: true } },
                                componentes: {
                                    orderBy: { orden: 'asc' },
                                    include: { modeloComponente: { select: { id: true, nombre: true, tipo: true } } },
                                },
                            },
                        },
                    },
                },
                informes: {
                    include: {
                        sistema: { select: { id: true, nombre: true } },
                    },
                },
                pedidoCompra: { select: { id: true, estado: true } },
            },
        });
        if (!intervencion) {
            res.status(404).json({ error: 'Intervencion no encontrada' });
            return;
        }
        res.json(intervencion);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/intervenciones (admin)
router.post('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { sistemaIds, sistemas, ...data } = intervenciones_validation_1.createIntervencionSchema.parse(req.body);
        const rows = buildSistemaRows({ sistemas, sistemaIds });
        // If logistics fields not provided, copy from client (snapshot pattern)
        const logisticsFields = [
            'tarifaHoraTrabajo', 'tarifaHoraViaje', 'dietas', 'gestionAccesos',
            'horasTrayecto', 'diasViaje', 'km', 'peajes', 'precioHotel', 'precioKm',
        ];
        let logisticsData = {};
        const hasAnyLogistics = logisticsFields.some((f) => data[f] !== undefined && data[f] !== null);
        if (!hasAnyLogistics) {
            // Auto-copy from client
            const cliente = await database_1.prisma.cliente.findUnique({
                where: { id: data.clienteId },
                select: {
                    tarifaHoraTrabajo: true, tarifaHoraViaje: true, dietas: true, gestionAccesos: true,
                    horasTrayecto: true, diasViaje: true, km: true, peajes: true, precioHotel: true, precioKm: true,
                },
            });
            if (cliente) {
                for (const f of logisticsFields) {
                    logisticsData[f] = cliente[f] ?? null;
                }
            }
        }
        else {
            for (const f of logisticsFields) {
                if (data[f] !== undefined)
                    logisticsData[f] = data[f] ?? null;
            }
        }
        const intervencion = await database_1.prisma.intervencion.create({
            data: {
                clienteId: data.clienteId,
                tipo: data.tipo,
                titulo: data.titulo,
                referencia: data.referencia ?? null,
                fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
                fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
                notas: data.notas ?? null,
                ...logisticsData,
                gestionAccesosNueva: data.gestionAccesosNueva ?? false,
                numeroTecnicos: data.numeroTecnicos ?? 1,
                viajesIdaVuelta: data.viajesIdaVuelta ?? 1,
                incluyeConsumibles: data.incluyeConsumibles ?? true,
                horasDia: data.horasDia ?? null,
                dietasExtra: data.dietasExtra ?? null,
                diasTrabajo: data.diasTrabajo ?? '1,2,3,4,5',
                sistemas: {
                    create: rows,
                },
            },
            include: {
                cliente: { select: { id: true, nombre: true } },
                sistemas: { include: { sistema: { select: { id: true, nombre: true } } } },
            },
        });
        res.status(201).json(intervencion);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/intervenciones/:id (admin)
router.put('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { sistemaIds, sistemas, ...data } = intervenciones_validation_1.updateIntervencionSchema.parse(req.body);
        const id = Number(req.params.id);
        const updateData = { ...data };
        if (data.fechaInicio !== undefined)
            updateData.fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : null;
        if (data.fechaFin !== undefined)
            updateData.fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
        // Remove non-Prisma fields
        delete updateData.sistemaIds;
        delete updateData.sistemas;
        // If sistemas or sistemaIds provided, replace the junction table
        const hasSistemaChanges = (sistemas && sistemas.length > 0) || (sistemaIds && sistemaIds.length > 0);
        if (hasSistemaChanges) {
            const rows = buildSistemaRows({ sistemas, sistemaIds });
            await database_1.prisma.$transaction([
                database_1.prisma.intervencionSistema.deleteMany({ where: { intervencionId: id } }),
                database_1.prisma.intervencion.update({
                    where: { id },
                    data: {
                        ...updateData,
                        sistemas: { create: rows },
                    },
                }),
            ]);
        }
        else {
            await database_1.prisma.intervencion.update({ where: { id }, data: updateData });
        }
        const intervencion = await database_1.prisma.intervencion.findUnique({
            where: { id },
            include: {
                cliente: { select: { id: true, nombre: true } },
                sistemas: { include: { sistema: { select: { id: true, nombre: true } } } },
            },
        });
        res.json(intervencion);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/v1/intervenciones/:id/estado
router.patch('/:id/estado', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { estado } = intervenciones_validation_1.updateEstadoIntervencionSchema.parse(req.body);
        const intervencion = await database_1.prisma.intervencion.update({
            where: { id: Number(req.params.id) },
            data: { estado },
        });
        res.json(intervencion);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/intervenciones/:id (admin)
router.delete('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.intervencion.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'Intervencion eliminada' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=intervenciones.routes.js.map