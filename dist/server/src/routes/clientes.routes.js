"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const clientes_validation_1 = require("../validation/clientes.validation");
const router = (0, express_1.Router)();
// Multer config for logo uploads
const PROJECT_ROOT = [__dirname, path_1.default.join(__dirname, '..'), path_1.default.join(__dirname, '..', '..', '..')]
    .find(d => fs_1.default.existsSync(path_1.default.join(d, 'package.json'))) || path_1.default.join(__dirname, '..');
const logosDir = path_1.default.join(PROJECT_ROOT, 'uploads', 'logos');
fs_1.default.mkdirSync(logosDir, { recursive: true });
const logoStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, logosDir),
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase() || '.png';
        cb(null, `logo-${req.params.id}-${Date.now()}${ext}`);
    },
});
const uploadLogo = (0, multer_1.default)({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext))
            cb(null, true);
        else
            cb(new Error('Solo se permiten imagenes (jpg, png, gif, webp, svg)'));
    },
});
// ===== CLIENTES =====
// GET /api/v1/clientes
router.get('/', async (req, res, next) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const clientes = await database_1.prisma.cliente.findMany({
            where: includeInactive ? {} : { activo: true },
            orderBy: { nombre: 'asc' },
            include: {
                _count: { select: { maquinas: true, sistemas: true, intervenciones: true } },
            },
        });
        res.json(clientes);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/clientes/:id
router.get('/:id', async (req, res, next) => {
    try {
        const cliente = await database_1.prisma.cliente.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                _count: { select: { maquinas: true, sistemas: true, intervenciones: true } },
            },
        });
        if (!cliente) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json(cliente);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/clientes (admin)
router.post('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = clientes_validation_1.createClienteSchema.parse(req.body);
        const cliente = await database_1.prisma.cliente.create({ data });
        res.status(201).json(cliente);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/clientes/:id (admin)
router.put('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = clientes_validation_1.updateClienteSchema.parse(req.body);
        const cliente = await database_1.prisma.cliente.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json(cliente);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/clientes/:id (admin) - soft delete
router.delete('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const cliente = await database_1.prisma.cliente.update({
            where: { id: Number(req.params.id) },
            data: { activo: false },
        });
        res.json(cliente);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/clientes/:id/logo (admin) - upload logo image
router.post('/:id/logo', (0, role_middleware_1.requireRole)('admin'), uploadLogo.single('logo'), async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No se ha enviado ningun archivo' });
            return;
        }
        const clienteId = Number(req.params.id);
        // Delete old logo file if exists
        const existing = await database_1.prisma.cliente.findUnique({ where: { id: clienteId }, select: { logo: true } });
        if (existing?.logo) {
            const oldPath = path_1.default.join(logosDir, existing.logo);
            if (fs_1.default.existsSync(oldPath))
                fs_1.default.unlinkSync(oldPath);
        }
        const cliente = await database_1.prisma.cliente.update({
            where: { id: clienteId },
            data: { logo: req.file.filename },
        });
        res.json(cliente);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/clientes/:id/logo (admin) - remove logo
router.delete('/:id/logo', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const clienteId = Number(req.params.id);
        const existing = await database_1.prisma.cliente.findUnique({ where: { id: clienteId }, select: { logo: true } });
        if (existing?.logo) {
            const oldPath = path_1.default.join(logosDir, existing.logo);
            if (fs_1.default.existsSync(oldPath))
                fs_1.default.unlinkSync(oldPath);
        }
        const cliente = await database_1.prisma.cliente.update({
            where: { id: clienteId },
            data: { logo: null },
        });
        res.json(cliente);
    }
    catch (err) {
        next(err);
    }
});
// ===== MAQUINAS (nested under cliente) =====
// GET /api/v1/clientes/:clienteId/maquinas
router.get('/:clienteId/maquinas', async (req, res, next) => {
    try {
        const maquinas = await database_1.prisma.maquina.findMany({
            where: { clienteId: Number(req.params.clienteId) },
            orderBy: { nombre: 'asc' },
        });
        res.json(maquinas);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/clientes/:clienteId/maquinas (admin)
router.post('/:clienteId/maquinas', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = clientes_validation_1.createMaquinaSchema.parse(req.body);
        const maquina = await database_1.prisma.maquina.create({
            data: { ...data, clienteId: Number(req.params.clienteId) },
        });
        res.status(201).json(maquina);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/clientes/:clienteId/maquinas/:maquinaId (admin)
router.put('/:clienteId/maquinas/:maquinaId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = clientes_validation_1.updateMaquinaSchema.parse(req.body);
        const maquina = await database_1.prisma.maquina.update({
            where: { id: Number(req.params.maquinaId) },
            data,
        });
        res.json(maquina);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/clientes/:clienteId/maquinas/:maquinaId (admin)
router.delete('/:clienteId/maquinas/:maquinaId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.maquina.delete({ where: { id: Number(req.params.maquinaId) } });
        res.json({ message: 'Maquina eliminada' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=clientes.routes.js.map