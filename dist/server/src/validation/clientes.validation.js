"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaquinaSchema = exports.createMaquinaSchema = exports.updatePlantaSchema = exports.createPlantaSchema = exports.updateClienteSchema = exports.createClienteSchema = void 0;
const zod_1 = require("zod");
exports.createClienteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    sede: zod_1.z.string().max(200).optional().nullable(),
    tarifaHoraTrabajo: zod_1.z.number().positive().optional().nullable(),
    tarifaHoraViaje: zod_1.z.number().positive().optional().nullable(),
    dietas: zod_1.z.number().positive().optional().nullable(),
    peajes: zod_1.z.number().positive().optional().nullable(),
    km: zod_1.z.number().positive().optional().nullable(),
    activo: zod_1.z.boolean().optional().default(true),
});
exports.updateClienteSchema = exports.createClienteSchema.partial();
exports.createPlantaSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    direccion: zod_1.z.string().max(500).optional().nullable(),
});
exports.updatePlantaSchema = exports.createPlantaSchema.partial();
exports.createMaquinaSchema = zod_1.z.object({
    plantaId: zod_1.z.number().int().positive(),
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    descripcion: zod_1.z.string().max(500).optional().nullable(),
});
exports.updateMaquinaSchema = exports.createMaquinaSchema.partial();
//# sourceMappingURL=clientes.validation.js.map