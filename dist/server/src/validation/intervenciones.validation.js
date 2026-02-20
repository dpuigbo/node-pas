"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEstadoIntervencionSchema = exports.updateIntervencionSchema = exports.createIntervencionSchema = void 0;
const zod_1 = require("zod");
exports.createIntervencionSchema = zod_1.z.object({
    clienteId: zod_1.z.number().int().positive(),
    tipo: zod_1.z.enum(['preventiva', 'correctiva']),
    titulo: zod_1.z.string().min(1, 'El titulo es obligatorio').max(300),
    referencia: zod_1.z.string().max(100).optional().nullable(),
    fechaInicio: zod_1.z.string().datetime().optional().nullable(),
    fechaFin: zod_1.z.string().datetime().optional().nullable(),
    notas: zod_1.z.string().optional().nullable(),
    sistemaIds: zod_1.z.array(zod_1.z.number().int().positive()).optional().default([]),
});
exports.updateIntervencionSchema = exports.createIntervencionSchema.partial();
exports.updateEstadoIntervencionSchema = zod_1.z.object({
    estado: zod_1.z.enum(['borrador', 'en_curso', 'completada', 'facturada']),
});
//# sourceMappingURL=intervenciones.validation.js.map