"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEstadoPedidoSchema = exports.updatePedidoCompraSchema = exports.lineaPedidoSchema = void 0;
const zod_1 = require("zod");
exports.lineaPedidoSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['aceite', 'bateria', 'consumible']),
    itemId: zod_1.z.number().int(),
    nombre: zod_1.z.string(),
    cantidad: zod_1.z.number().min(0),
    unidad: zod_1.z.string().nullable().optional(),
    coste: zod_1.z.number().nullable().optional(),
    precio: zod_1.z.number().nullable().optional(),
    sistemaId: zod_1.z.number().int().optional(),
    sistemaNombre: zod_1.z.string().optional(),
    componenteTipo: zod_1.z.string().optional(),
    modeloNombre: zod_1.z.string().optional(),
    nivel: zod_1.z.string().optional(),
});
exports.updatePedidoCompraSchema = zod_1.z.object({
    estado: zod_1.z.enum(['pendiente', 'pedido', 'recibido']).optional(),
    notas: zod_1.z.string().nullable().optional(),
    lineas: zod_1.z.array(exports.lineaPedidoSchema).optional(),
});
exports.updateEstadoPedidoSchema = zod_1.z.object({
    estado: zod_1.z.enum(['pendiente', 'pedido', 'recibido']),
});
//# sourceMappingURL=pedidoCompra.validation.js.map