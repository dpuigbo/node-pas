"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const pedidoCompra_validation_1 = require("../validation/pedidoCompra.validation");
const router = (0, express_1.Router)();
/** Helper: convert Decimal | null to number | null */
function dec(v) {
    if (v == null)
        return null;
    return Number(v);
}
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
                        sistema: {
                            include: {
                                componentes: {
                                    include: {
                                        modeloComponente: {
                                            include: {
                                                consumiblesNivel: true,
                                            },
                                        },
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
        // Collect all aceite IDs and consumible IDs we need to resolve
        const aceiteIds = new Set();
        const consumibleIds = new Set();
        // Build detailed lines
        const lineas = [];
        for (const intSistema of intervencion.sistemas) {
            const sistema = intSistema.sistema;
            const nivel = intSistema.nivel;
            for (const comp of sistema.componentes) {
                const modelo = comp.modeloComponente;
                // Find ConsumibleNivel for this modelo + nivel
                const cn = modelo.consumiblesNivel.find((c) => c.nivel === nivel);
                if (!cn || !cn.consumibles)
                    continue;
                const items = cn.consumibles;
                for (const item of items) {
                    if (item.id <= 0)
                        continue; // skip unselected items
                    if (item.tipo === 'aceite') {
                        aceiteIds.add(item.id);
                    }
                    else {
                        consumibleIds.add(item.id);
                    }
                    lineas.push({
                        tipo: item.tipo,
                        itemId: item.id,
                        nombre: '', // will be resolved below
                        cantidad: item.cantidad,
                        unidad: null,
                        coste: null,
                        precio: null,
                        sistemaId: sistema.id,
                        sistemaNombre: sistema.nombre,
                        componenteTipo: comp.tipo,
                        modeloNombre: modelo.nombre,
                        nivel,
                    });
                }
            }
        }
        // Resolve aceite and consumible names/prices
        const aceiteMap = new Map();
        const consumibleMap = new Map();
        if (aceiteIds.size > 0) {
            const aceites = await database_1.prisma.aceite.findMany({
                where: { id: { in: Array.from(aceiteIds) } },
            });
            for (const a of aceites) {
                aceiteMap.set(a.id, {
                    nombre: a.nombre,
                    unidad: a.unidad,
                    coste: dec(a.coste),
                    precio: dec(a.precio),
                });
            }
        }
        if (consumibleIds.size > 0) {
            const consumibles = await database_1.prisma.consumible.findMany({
                where: { id: { in: Array.from(consumibleIds) } },
            });
            for (const c of consumibles) {
                consumibleMap.set(c.id, {
                    nombre: c.nombre,
                    coste: dec(c.coste),
                    precio: dec(c.precio),
                });
            }
        }
        // Fill in names and prices
        for (const linea of lineas) {
            if (linea.tipo === 'aceite') {
                const info = aceiteMap.get(linea.itemId);
                if (info) {
                    linea.nombre = info.nombre;
                    linea.unidad = info.unidad;
                    linea.coste = info.coste;
                    linea.precio = info.precio;
                }
                else {
                    linea.nombre = `Aceite #${linea.itemId} (no encontrado)`;
                }
            }
            else {
                const info = consumibleMap.get(linea.itemId);
                if (info) {
                    linea.nombre = info.nombre;
                    linea.coste = info.coste;
                    linea.precio = info.precio;
                }
                else {
                    linea.nombre = `Consumible #${linea.itemId} (no encontrado)`;
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