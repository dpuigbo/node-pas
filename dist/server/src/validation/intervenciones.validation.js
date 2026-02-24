"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEstadoIntervencionSchema = exports.updateIntervencionSchema = exports.createIntervencionSchema = void 0;
const zod_1 = require("zod");
const sistemaNivelSchema = zod_1.z.object({
    sistemaId: zod_1.z.number().int().positive(),
    nivel: zod_1.z.enum(['1', '2_inferior', '2_superior', '3']).default('1'),
});
exports.createIntervencionSchema = zod_1.z.object({
    clienteId: zod_1.z.number().int().positive(),
    tipo: zod_1.z.enum(['preventiva', 'correctiva']),
    titulo: zod_1.z.string().min(1, 'El titulo es obligatorio').max(300),
    referencia: zod_1.z.string().max(100).optional().nullable(),
    fechaInicio: zod_1.z.string().datetime().optional().nullable(),
    fechaFin: zod_1.z.string().datetime().optional().nullable(),
    notas: zod_1.z.string().optional().nullable(),
    // Tarifas (snapshot del cliente)
    tarifaHoraTrabajo: zod_1.z.number().min(0).optional().nullable(),
    tarifaHoraViaje: zod_1.z.number().min(0).optional().nullable(),
    dietas: zod_1.z.number().min(0).optional().nullable(),
    gestionAccesos: zod_1.z.number().min(0).optional().nullable(),
    // Logistica viaje (snapshot del cliente)
    horasTrayecto: zod_1.z.number().min(0).optional().nullable(),
    diasViaje: zod_1.z.number().min(0).optional().nullable(),
    km: zod_1.z.number().min(0).optional().nullable(),
    peajes: zod_1.z.number().min(0).optional().nullable(),
    precioHotel: zod_1.z.number().min(0).optional().nullable(),
    precioKm: zod_1.z.number().min(0).optional().nullable(),
    // Campos especificos de intervencion
    gestionAccesosNueva: zod_1.z.boolean().optional().default(false),
    numeroTecnicos: zod_1.z.number().int().min(1).optional().default(1),
    viajesIdaVuelta: zod_1.z.number().int().min(1).optional().default(1),
    incluyeConsumibles: zod_1.z.boolean().optional().default(true),
    horasDia: zod_1.z.number().min(0).optional().nullable(),
    dietasExtra: zod_1.z.number().min(0).optional().nullable(),
    diasTrabajo: zod_1.z.string().max(50).optional().nullable(),
    // Legacy: array of ids (nivel defaults to '1')
    sistemaIds: zod_1.z.array(zod_1.z.number().int().positive()).optional().default([]),
    // New: array of { sistemaId, nivel }
    sistemas: zod_1.z.array(sistemaNivelSchema).optional().default([]),
});
exports.updateIntervencionSchema = exports.createIntervencionSchema.partial();
exports.updateEstadoIntervencionSchema = zod_1.z.object({
    estado: zod_1.z.enum(['borrador', 'en_curso', 'completada', 'facturada']),
});
//# sourceMappingURL=intervenciones.validation.js.map