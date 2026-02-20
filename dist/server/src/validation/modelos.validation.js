"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateVersionSchema = exports.updateVersionSchema = exports.createVersionSchema = exports.updateModeloSchema = exports.createModeloSchema = void 0;
const zod_1 = require("zod");
const tipoComponenteEnum = zod_1.z.enum(['controller', 'mechanical_unit', 'drive_unit']);
exports.createModeloSchema = zod_1.z.object({
    fabricanteId: zod_1.z.number().int().positive(),
    tipo: tipoComponenteEnum,
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    notas: zod_1.z.string().optional().nullable(),
    aceitesConfig: zod_1.z.any().optional().nullable(),
});
exports.updateModeloSchema = exports.createModeloSchema.partial().omit({ fabricanteId: true });
exports.createVersionSchema = zod_1.z.object({
    schema: zod_1.z.any().default({ pageConfig: {}, blocks: [] }),
    notas: zod_1.z.string().optional().nullable(),
});
exports.updateVersionSchema = zod_1.z.object({
    schema: zod_1.z.any().optional(),
    notas: zod_1.z.string().optional().nullable(),
});
exports.activateVersionSchema = zod_1.z.object({
    estado: zod_1.z.enum(['borrador', 'activo', 'obsoleto']),
});
//# sourceMappingURL=modelos.validation.js.map