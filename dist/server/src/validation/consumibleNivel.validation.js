"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchUpsertHorasSchema = exports.upsertHorasModeloSchema = void 0;
const zod_1 = require("zod");
// v2.9: la tabla consumibles_nivel fue eliminada. Estas rutas editan ahora
// mantenimiento_horas_modelo (horas por modelo + nivel, D-073).
exports.upsertHorasModeloSchema = zod_1.z.object({
    modeloId: zod_1.z.number().int().positive(),
    // Codigo canonico (N1, N2_INF, ...) - backend normaliza a nivelId
    nivel: zod_1.z.string().min(1).max(20),
    horas: zod_1.z.number().min(0).nullable().optional(),
    notas: zod_1.z.string().max(500).nullable().optional(),
});
exports.batchUpsertHorasSchema = zod_1.z.array(exports.upsertHorasModeloSchema);
//# sourceMappingURL=consumibleNivel.validation.js.map