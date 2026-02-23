"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchConfigSchema = exports.updateConfigSchema = exports.updateConsumibleSchema = exports.createConsumibleSchema = exports.updateAceiteSchema = exports.createAceiteSchema = void 0;
const zod_1 = require("zod");
exports.createAceiteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    fabricante: zod_1.z.string().max(200).optional().nullable(),
    unidad: zod_1.z.string().max(50).optional().nullable(),
    coste: zod_1.z.number().positive().optional().nullable(),
    precio: zod_1.z.number().positive().optional().nullable(),
    activo: zod_1.z.boolean().optional().default(true),
});
exports.updateAceiteSchema = exports.createAceiteSchema.partial();
exports.createConsumibleSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    fabricante: zod_1.z.string().max(200).optional().nullable(),
    tipo: zod_1.z.string().max(50).optional().default('general'),
    compatibleCon: zod_1.z.string().max(50).optional().nullable(),
    coste: zod_1.z.number().positive().optional().nullable(),
    precio: zod_1.z.number().positive().optional().nullable(),
    activo: zod_1.z.boolean().optional().default(true),
});
exports.updateConsumibleSchema = exports.createConsumibleSchema.partial();
exports.updateConfigSchema = zod_1.z.object({
    clave: zod_1.z.string().min(1),
    valor: zod_1.z.string(),
});
exports.batchConfigSchema = zod_1.z.array(exports.updateConfigSchema);
//# sourceMappingURL=catalogos.validation.js.map