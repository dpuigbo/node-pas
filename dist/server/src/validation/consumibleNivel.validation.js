"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchUpsertSchema = exports.upsertConsumibleNivelSchema = void 0;
const zod_1 = require("zod");
const consumibleItemSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['aceite', 'bateria', 'consumible']),
    id: zod_1.z.number().int().positive(),
    cantidad: zod_1.z.number().positive(),
});
exports.upsertConsumibleNivelSchema = zod_1.z.object({
    modeloId: zod_1.z.number().int().positive(),
    nivel: zod_1.z.enum(['1', '2', '2_inferior', '2_superior', '3']),
    horas: zod_1.z.number().min(0).optional().nullable(),
    precioOtros: zod_1.z.number().min(0).optional().nullable(),
    consumibles: zod_1.z.array(consumibleItemSchema).optional().nullable(),
});
exports.batchUpsertSchema = zod_1.z.array(exports.upsertConsumibleNivelSchema);
//# sourceMappingURL=consumibleNivel.validation.js.map