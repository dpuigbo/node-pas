"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFabricanteSchema = exports.createFabricanteSchema = void 0;
const zod_1 = require("zod");
exports.createFabricanteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(100),
    activo: zod_1.z.boolean().optional().default(true),
    orden: zod_1.z.number().int().optional().default(0),
});
exports.updateFabricanteSchema = exports.createFabricanteSchema.partial();
//# sourceMappingURL=fabricantes.validation.js.map