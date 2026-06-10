"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const pedidoCompra_validation_1 = require("../validation/pedidoCompra.validation");
const planMantenimiento_1 = require("../lib/planMantenimiento");
const router = (0, express_1.Router)();
// POST /api/v1/pedidos-compra/generar/:intervencionId (admin)
// Generates purchase order from intervention's systems + niveles + ConsumibleNivel data
router.post('/generar/:intervencionId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const intervencionId = Number(req.params.intervencionId);
        // Check if pedido already exists
        const existing = await database_1.prisma.pedidoCompra.findUnique({
            where: { intervencionId },
        });
        if (existing) {
            res.status(400).json({ error: 'Ya existe un pedido de compra para esta intervencion. Eliminalo primero si quieres regenerar.' });
            return;
        }
        // Get intervention with systems + niveles
        const intervencion = await database_1.prisma.intervencion.findUnique({
            where: { id: intervencionId },
            include: {
                sistemas: {
                    include: {
                        nivel: { select: { codigo: true } },
                        sistema: {
                            include: {
                                componentes: {
                                    include: {
                                        modeloComponente: { select: { id: true, nombre: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!intervencion) {
            res.status(404).json({ error: 'Intervencion no encontrada' });
            return;
        }
        if (intervencion.sistemas.length === 0) {
            res.status(400).json({ error: 'La intervencion no tiene sistemas asignados' });
            return;
        }
        // Build lines v2.9: lubricacion + consumibles de actividades por
        // (modelo, nivel efectivo) de cada componente del sistema.
        const lineas = [];
        for (const intSistema of intervencion.sistemas) {
            const sistema = intSistema.sistema;
            const nivel = intSistema.nivel?.codigo ?? null;
            if (!nivel)
                continue; // sistema sin nivel asignado, no genera lineas
            const ctrl = sistema.componentes.find((c) => c.tipo === 'controller');
            for (const comp of sistema.componentes) {
                const nivelEfectivo = (0, planMantenimiento_1.nivelEfectivoParaTipo)(comp.tipo, nivel);
                if (!nivelEfectivo)
                    continue;
                const items = await (0, planMantenimiento_1.getConsumiblesPlan)(comp.modeloComponenteId, nivelEfectivo, {
                    controladorId: ctrl?.modeloComponenteId ?? null,
                });
                for (const item of items) {
                    lineas.push({
                        tipo: item.tipo,
                        itemId: item.consumibleId,
                        codigoInterno: item.codigoInterno,
                        nombre: item.nombre,
                        cantidad: item.cantidad,
                        unidad: item.unidad,
                        coste: item.coste,
                        precio: item.precio,
                        sistemaId: sistema.id,
                        sistemaNombre: sistema.nombre,
                        componenteTipo: comp.tipo,
                        modeloNombre: comp.modeloComponente.nombre,
                        nivel: nivelEfectivo,
                        origen: item.origen,
                        detalle: item.detalle,
                    });
                }
            }
        }
        // Calculate totals
        let totalCoste = 0;
        let totalPrecio = 0;
        for (const l of lineas) {
            if (l.coste != null)
                totalCoste += l.coste * l.cantidad;
            if (l.precio != null)
                totalPrecio += l.precio * l.cantidad;
        }
        // Create pedido
        const pedido = await database_1.prisma.pedidoCompra.create({
            data: {
                intervencionId,
                lineas: lineas,
                totalCoste: totalCoste || null,
                totalPrecio: totalPrecio || null,
            },
        });
        res.status(201).json(pedido);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/pedidos-compra/intervencion/:intervencionId
router.get('/intervencion/:intervencionId', async (req, res, next) => {
    try {
        const intervencionId = Number(req.params.intervencionId);
        const pedido = await database_1.prisma.pedidoCompra.findUnique({
            where: { intervencionId },
        });
        if (!pedido) {
            res.status(404).json({ error: 'Pedido no encontrado' });
            return;
        }
        res.json(pedido);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/pedidos-compra/:id (admin)
router.put('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = pedidoCompra_validation_1.updatePedidoCompraSchema.parse(req.body);
        const updateData = {};
        if (data.estado !== undefined)
            updateData.estado = data.estado;
        if (data.notas !== undefined)
            updateData.notas = data.notas;
        if (data.lineas !== undefined) {
            updateData.lineas = data.lineas;
            // Recalculate totals
            let totalCoste = 0;
            let totalPrecio = 0;
            for (const l of data.lineas) {
                if (l.coste != null)
                    totalCoste += l.coste * l.cantidad;
                if (l.precio != null)
                    totalPrecio += l.precio * l.cantidad;
            }
            updateData.totalCoste = totalCoste || null;
            updateData.totalPrecio = totalPrecio || null;
        }
        const pedido = await database_1.prisma.pedidoCompra.update({
            where: { id },
            data: updateData,
        });
        res.json(pedido);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/v1/pedidos-compra/:id/estado (admin)
router.patch('/:id/estado', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { estado } = pedidoCompra_validation_1.updateEstadoPedidoSchema.parse(req.body);
        const pedido = await database_1.prisma.pedidoCompra.update({
            where: { id: Number(req.params.id) },
            data: { estado },
        });
        res.json(pedido);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/pedidos-compra/:id (admin)
router.delete('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.pedidoCompra.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'Pedido eliminado' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=pedidoCompra.routes.js.map