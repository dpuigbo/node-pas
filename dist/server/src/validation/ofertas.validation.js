"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarIntervencionSchema = exports.updateEstadoOfertaSchema = exports.updateOfertaSchema = exports.createOfertaSchema = void 0;
const zod_1 = require("zod");
const ofertaSistemaSchema = zod_1.z.object({
    sistemaId: zod_1.z.number().int().positive(),
    nivel: zod_1.z.enum(['1', '2_inferior', '2_superior', '3']).default('1'),
});
exports.createOfertaSchema = zod_1.z.object({
    clienteId: zod_1.z.number().int().positive(),
    titulo: zod_1.z.string().min(1, 'El titulo es obligatorio').max(300),
    referencia: zod_1.z.string().max(100).optional().nullable(),
    tipo: zod_1.z.enum(['preventiva', 'correctiva']),
    validezDias: zod_1.z.number().int().min(1).default(30),
    notas: zod_1.z.string().optional().nullable(),
    sistemas: zod_1.z.array(ofertaSistemaSchema).min(1, 'Debe incluir al menos un sistema'),
});
exports.updateOfertaSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1).max(300).optional(),
    referencia: zod_1.z.string().max(100).optional().nullable(),
    tipo: zod_1.z.enum(['preventiva', 'correctiva']).optional(),
    validezDias: zod_1.z.number().int().min(1).optional(),
    notas: zod_1.z.string().optional().nullable(),
    sistemas: zod_1.z.array(ofertaSistemaSchema).optional(),
});
exports.updateEstadoOfertaSchema = zod_1.z.object({
    estado: zod_1.z.enum(['borrador', 'enviada', 'aprobada', 'rechazada']),
});
exports.generarIntervencionSchema = zod_1.z.object({
    fechaInicio: zod_1.z.string().datetime(),
    fechaFin: zod_1.z.string().datetime(),
});
//# sourceMappingURL=ofertas.validation.js.map