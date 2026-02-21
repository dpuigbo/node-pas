"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDatosComponenteSchema = exports.updateEstadoInformeSchema = void 0;
const zod_1 = require("zod");
exports.updateEstadoInformeSchema = zod_1.z.object({
    estado: zod_1.z.enum(['borrador', 'finalizado', 'entregado']),
});
exports.updateDatosComponenteSchema = zod_1.z.object({
    datos: zod_1.z.record(zod_1.z.unknown()),
});
//# sourceMappingURL=informes.validation.js.map