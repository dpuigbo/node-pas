"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const fabricantes_routes_1 = __importDefault(require("./fabricantes.routes"));
const clientes_routes_1 = __importDefault(require("./clientes.routes"));
const modelos_routes_1 = __importDefault(require("./modelos.routes"));
const sistemas_routes_1 = __importDefault(require("./sistemas.routes"));
const intervenciones_routes_1 = __importDefault(require("./intervenciones.routes"));
const catalogos_routes_1 = __importDefault(require("./catalogos.routes"));
const informes_routes_1 = __importDefault(require("./informes.routes"));
const document_templates_routes_1 = __importDefault(require("./document-templates.routes"));
const router = (0, express_1.Router)();
// Auth routes (public - no auth required)
router.use('/auth', auth_routes_1.default);
// All v1 routes require authentication
router.use('/v1/dashboard', auth_middleware_1.authMiddleware, dashboard_routes_1.default);
router.use('/v1/fabricantes', auth_middleware_1.authMiddleware, fabricantes_routes_1.default);
router.use('/v1/clientes', auth_middleware_1.authMiddleware, clientes_routes_1.default);
router.use('/v1/modelos', auth_middleware_1.authMiddleware, modelos_routes_1.default);
router.use('/v1/sistemas', auth_middleware_1.authMiddleware, sistemas_routes_1.default);
router.use('/v1/intervenciones', auth_middleware_1.authMiddleware, intervenciones_routes_1.default);
router.use('/v1/catalogos', auth_middleware_1.authMiddleware, catalogos_routes_1.default);
router.use('/v1', auth_middleware_1.authMiddleware, informes_routes_1.default);
router.use('/v1/document-templates', auth_middleware_1.authMiddleware, document_templates_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map