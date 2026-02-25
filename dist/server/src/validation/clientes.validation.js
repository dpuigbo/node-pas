"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaquinaSchema = exports.createMaquinaSchema = exports.updateClienteSchema = exports.createClienteSchema = void 0;
const zod_1 = require("zod");
exports.createClienteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    sede: zod_1.z.string().max(200).optional().nullable(),
    direccion: zod_1.z.string().max(500).optional().nullable(),
    ciudad: zod_1.z.string().max(200).optional().nullable(),
    codigoPostal: zod_1.z.string().max(20).optional().nullable(),
    provincia: zod_1.z.string().max(200).optional().nullable(),
    telefono: zod_1.z.string().max(50).optional().nullable(),
    email: zod_1.z.string().max(200).optional().nullable(),
    personaContacto: zod_1.z.string().max(200).optional().nullable(),
    logo: zod_1.z.string().max(500).optional().nullable(),
    tarifaHoraTrabajo: zod_1.z.number().min(0).optional().nullable(),
    tarifaHoraViaje: zod_1.z.number().min(0).optional().nullable(),
    dietas: zod_1.z.number().min(0).optional().nullable(),
    gestionAccesos: zod_1.z.number().min(0).optional().nullable(),
    horasTrayecto: zod_1.z.number().min(0).optional().nullable(),
    diasViaje: zod_1.z.number().min(0).optional().nullable(),
    km: zod_1.z.number().min(0).optional().nullable(),
    peajes: zod_1.z.number().min(0).optional().nullable(),
    precioHotel: zod_1.z.number().min(0).optional().nullable(),
    precioKm: zod_1.z.number().min(0).optional().nullable(),
    activo: zod_1.z.boolean().optional().default(true),
});
exports.updateClienteSchema = exports.createClienteSchema.partial();
exports.createMaquinaSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es obligatorio').max(200),
    descripcion: zod_1.z.string().max(500).optional().nullable(),
});
exports.updateMaquinaSchema = exports.createMaquinaSchema.partial();
//# sourceMappingURL=clientes.validation.js.map