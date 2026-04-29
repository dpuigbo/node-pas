"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchConfigSchema = exports.updateConfigSchema = exports.updateConsumibleSchema = exports.createConsumibleSchema = exports.consumibleTipoEnum = exports.updateAceiteSchema = exports.createAceiteSchema = void 0;
const zod_1 = require("zod");
exports.createAceiteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    fabricante: zod_1.z.string().max(200).optional().nullable(),
    unidad: zod_1.z.string().max(50).optional().nullable(),
    fabricanteRobot: zod_1.z.string().max(500).optional().nullable(), // CSV: "ABB,KUKA"
    coste: zod_1.z.number().positive().optional().nullable(),
    precio: zod_1.z.number().positive().optional().nullable(),
    activo: zod_1.z.boolean().optional().default(true),
});
exports.updateAceiteSchema = exports.createAceiteSchema.partial();
// ConsumibleCatalogo (v2 unificado). Los campos legacy `compatibleCon` y
// `denominacion` se eliminaron al droppear la tabla `consumibles` (2026-04).
exports.consumibleTipoEnum = zod_1.z.enum([
    'aceite', 'grasa', 'bateria', 'filtro', 'ventilador', 'rodamiento',
    'sello', 'cable', 'ball_screw', 'tope_mecanico', 'tarjeta',
    'desiccant', 'limpieza', 'otro',
]);
exports.createConsumibleSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    tipo: exports.consumibleTipoEnum,
    subtipo: zod_1.z.string().max(80).optional().nullable(),
    codigoAbb: zod_1.z.string().max(80).optional().nullable(),
    fabricante: zod_1.z.string().max(100).optional().nullable(),
    unidad: zod_1.z.string().max(20).optional().nullable(),
    refOriginal: zod_1.z.string().max(100).optional().nullable(),
    refProveedor: zod_1.z.string().max(100).optional().nullable(),
    proveedor: zod_1.z.string().max(100).optional().nullable(),
    fabricanteRobot: zod_1.z.string().max(100).optional().nullable(),
    coste: zod_1.z.number().positive().optional().nullable(),
    precio: zod_1.z.number().positive().optional().nullable(),
    notas: zod_1.z.string().optional().nullable(),
    activo: zod_1.z.boolean().optional().default(true),
});
exports.updateConsumibleSchema = exports.createConsumibleSchema.partial();
exports.updateConfigSchema = zod_1.z.object({
    clave: zod_1.z.string().min(1),
    valor: zod_1.z.string(),
});
exports.batchConfigSchema = zod_1.z.array(exports.updateConfigSchema);
//# sourceMappingURL=catalogos.validation.js.map