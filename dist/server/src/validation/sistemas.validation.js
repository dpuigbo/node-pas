"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComponenteSchema = exports.createComponenteSchema = exports.updateSistemaSchema = exports.createSistemaSchema = void 0;
const zod_1 = require("zod");
const tipoComponenteEnum = zod_1.z.enum(['controller', 'mechanical_unit', 'drive_unit', 'external_axis']);
exports.createSistemaSchema = zod_1.z.object({
    clienteId: zod_1.z.number().int().positive(),
    maquinaId: zod_1.z.number().int().positive().optional().nullable(),
    fabricanteId: zod_1.z.number().int().positive(),
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    descripcion: zod_1.z.string().max(500).optional().nullable(),
});
exports.updateSistemaSchema = exports.createSistemaSchema.partial();
exports.createComponenteSchema = zod_1.z.object({
    modeloComponenteId: zod_1.z.number().int().positive(),
    tipo: tipoComponenteEnum,
    etiqueta: zod_1.z.string().min(1, 'La etiqueta es obligatoria').max(100),
    numeroSerie: zod_1.z.string().max(100).optional().nullable(),
    numEjes: zod_1.z.number().int().positive().optional().nullable(),
    metadata: zod_1.z.any().optional().nullable(),
    orden: zod_1.z.number().int().optional().default(0),
});
exports.updateComponenteSchema = exports.createComponenteSchema.partial();
//# sourceMappingURL=sistemas.validation.js.map