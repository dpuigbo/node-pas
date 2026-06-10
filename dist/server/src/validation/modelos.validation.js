"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateVersionSchema = exports.updateVersionSchema = exports.createVersionSchema = exports.updateCompatibilidadSchema = exports.updateModeloSchema = exports.createModeloSchema = void 0;
const zod_1 = require("zod");
const tipoComponenteEnum = zod_1.z.enum(['controller', 'mechanical_unit', 'drive_unit', 'external_axis']);
const idArray = zod_1.z.array(zod_1.z.number().int().positive());
exports.createModeloSchema = zod_1.z.object({
    fabricanteId: zod_1.z.number().int().positive(),
    tipo: tipoComponenteEnum,
    familiaId: zod_1.z.number().int().positive().optional().nullable(),
    generacionControladorId: zod_1.z.number().int().positive().optional().nullable(),
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(191),
    typeVariant: zod_1.z.string().max(50).optional().nullable(),
    notas: zod_1.z.string().optional().nullable(),
    activa: zod_1.z.boolean().optional(),
    // Flags de niveles aplicables (fuente de verdad, D-075)
    nivelN1: zod_1.z.boolean().optional(),
    nivelN2Inf: zod_1.z.boolean().optional(),
    nivelN2Sup: zod_1.z.boolean().optional(),
    nivelN3: zod_1.z.boolean().optional(),
    // Arrays JSON de IDs
    montajesDisponibles: idArray.optional().nullable(),
    proteccionesDisponibles: idArray.optional().nullable(),
    controladoresCompatibles: idArray.optional().nullable(),
    // Capacidades de controladora
    soportaMultimove: zod_1.z.boolean().optional().nullable(),
    maxRobotsMultimove: zod_1.z.number().int().optional().nullable(),
    maxEjesExternos: zod_1.z.number().int().optional().nullable(),
    tipoBateriaMedida: zod_1.z.enum(['smb', 'eib']).optional().nullable(),
});
exports.updateModeloSchema = exports.createModeloSchema.partial().omit({ fabricanteId: true });
exports.updateCompatibilidadSchema = zod_1.z.object({
    controladorIds: zod_1.z.array(zod_1.z.number().int().positive()),
});
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