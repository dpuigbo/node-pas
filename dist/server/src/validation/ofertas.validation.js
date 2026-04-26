"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkBloquesSchema = exports.updateBloqueSchema = exports.createBloqueSchema = exports.upsertOfertaComponenteSchema = exports.generarIntervencionSchema = exports.updateEstadoOfertaSchema = exports.updateOfertaSchema = exports.createOfertaSchema = void 0;
const zod_1 = require("zod");
// Codigo de nivel: canonico (N1, N2_INF, N2_SUP, N3, N_CTRL, N_DU, N0_EJE,
// N1_EJE, N2_EJE) o legacy (1, 2_inferior, 2_superior, 3) — el backend
// los normaliza al guardar.
const nivelCodigoSchema = zod_1.z.string().min(1).max(20);
const ofertaSistemaSchema = zod_1.z.object({
    sistemaId: zod_1.z.number().int().positive(),
    nivel: nivelCodigoSchema.default('N1'),
});
exports.createOfertaSchema = zod_1.z.object({
    clienteId: zod_1.z.number().int().positive(),
    titulo: zod_1.z.string().min(1, 'El titulo es obligatorio').max(300),
    referencia: zod_1.z.string().max(100).optional().nullable(),
    tipo: zod_1.z.enum(['preventiva', 'correctiva']),
    tipoOferta: zod_1.z.enum(['mantenimiento', 'solo_limpieza']).default('mantenimiento'),
    validezDias: zod_1.z.number().int().min(1).default(30),
    notas: zod_1.z.string().optional().nullable(),
    sistemas: zod_1.z.array(ofertaSistemaSchema).min(0),
    // Planificacion horaria (opcional)
    fechaInicio: zod_1.z.string().datetime().optional().nullable(),
    fechaFin: zod_1.z.string().datetime().optional().nullable(),
    horaInicioJornada: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional().nullable(),
    horaFinJornada: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional().nullable(),
    diasTrabajo: zod_1.z.string().optional().nullable(), // "1,2,3,4,5"
});
exports.updateOfertaSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1).max(300).optional(),
    referencia: zod_1.z.string().max(100).optional().nullable(),
    tipo: zod_1.z.enum(['preventiva', 'correctiva']).optional(),
    tipoOferta: zod_1.z.enum(['mantenimiento', 'solo_limpieza']).optional(),
    validezDias: zod_1.z.number().int().min(1).optional(),
    notas: zod_1.z.string().optional().nullable(),
    sistemas: zod_1.z.array(ofertaSistemaSchema).optional(),
    // Planificacion horaria (opcional)
    fechaInicio: zod_1.z.string().datetime().optional().nullable(),
    fechaFin: zod_1.z.string().datetime().optional().nullable(),
    horaInicioJornada: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional().nullable(),
    horaFinJornada: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional().nullable(),
    diasTrabajo: zod_1.z.string().optional().nullable(),
});
exports.updateEstadoOfertaSchema = zod_1.z.object({
    estado: zod_1.z.enum(['borrador', 'enviada', 'aprobada', 'rechazada']),
});
exports.generarIntervencionSchema = zod_1.z.object({
    fechaInicio: zod_1.z.string().datetime(),
    fechaFin: zod_1.z.string().datetime(),
});
// Upsert oferta-componente (configuracion de mantenimiento por componente)
exports.upsertOfertaComponenteSchema = zod_1.z.object({
    nivel: zod_1.z.string().max(20).optional().nullable(),
    conBaterias: zod_1.z.boolean().optional(),
    conAceite: zod_1.z.boolean().optional(),
    notas: zod_1.z.string().max(500).optional().nullable(),
});
// Bloques de calendario para planificacion
exports.createBloqueSchema = zod_1.z.object({
    fecha: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
    horaInicio: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    horaFin: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    tipo: zod_1.z.enum(['trabajo', 'desplazamiento', 'comida']),
    ofertaComponenteId: zod_1.z.number().int().positive().optional().nullable(),
    origenTipo: zod_1.z.enum(['componente', 'desplazamiento', 'manual', 'comida']).optional(),
    notas: zod_1.z.string().max(500).optional().nullable(),
});
exports.updateBloqueSchema = exports.createBloqueSchema.partial();
exports.bulkBloquesSchema = zod_1.z.object({
    bloques: zod_1.z.array(exports.createBloqueSchema),
});
//# sourceMappingURL=ofertas.validation.js.map