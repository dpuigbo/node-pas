"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchUpsertSchema = exports.upsertConsumibleNivelSchema = void 0;
const zod_1 = require("zod");
// Formato v2: usa consumibleId del catalogo unificado
const consumibleItemV2Schema = zod_1.z.object({
    consumibleId: zod_1.z.number().int().positive(),
    cantidad: zod_1.z.number().positive(),
});
// Formato legacy: tipo + id (aceites/consumibles tables)
const consumibleItemLegacySchema = zod_1.z.object({
    tipo: zod_1.z.enum(['aceite', 'bateria', 'consumible']),
    id: zod_1.z.number().int().positive(),
    cantidad: zod_1.z.number().positive(),
});
const consumibleItemSchema = zod_1.z.union([consumibleItemV2Schema, consumibleItemLegacySchema]);
exports.upsertConsumibleNivelSchema = zod_1.z.object({
    modeloId: zod_1.z.number().int().positive(),
    // Codigo canonico (N1, N2_INF, ...) o legacy (1, 2_inferior, ...) - backend normaliza a nivelId
    nivel: zod_1.z.string().min(1).max(20),
    horas: zod_1.z.number().min(0).optional().nullable(),
    precioOtros: zod_1.z.number().min(0).optional().nullable(),
    consumibles: zod_1.z.array(consumibleItemSchema).optional().nullable(),
});
exports.batchUpsertSchema = zod_1.z.array(exports.upsertConsumibleNivelSchema);
//# sourceMappingURL=consumibleNivel.validation.js.map