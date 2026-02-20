"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const clientes_validation_1 = require("../validation/clientes.validation");
const router = (0, express_1.Router)();
// ===== CLIENTES =====
// GET /api/v1/clientes
router.get('/', async (req, res, next) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const clientes = await database_1.prisma.cliente.findMany({
            where: includeInactive ? {} : { activo: true },
            orderBy: { nombre: 'asc' },
            include: {
                _count: { select: { plantas: true, sistemas: true, intervenciones: true } },
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
                plantas: { orderBy: { nombre: 'asc' } },
                _count: { select: { sistemas: true, intervenciones: true } },
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
// ===== PLANTAS (nested under cliente) =====
// GET /api/v1/clientes/:clienteId/plantas
router.get('/:clienteId/plantas', async (req, res, next) => {
    try {
        const plantas = await database_1.prisma.planta.findMany({
            where: { clienteId: Number(req.params.clienteId) },
            orderBy: { nombre: 'asc' },
            include: { _count: { select: { maquinas: true, sistemas: true } } },
        });
        res.json(plantas);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/clientes/:clienteId/plantas (admin)
router.post('/:clienteId/plantas', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = clientes_validation_1.createPlantaSchema.parse(req.body);
        const planta = await database_1.prisma.planta.create({
            data: { ...data, clienteId: Number(req.params.clienteId) },
        });
        res.status(201).json(planta);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/clientes/:clienteId/plantas/:plantaId (admin)
router.put('/:clienteId/plantas/:plantaId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = clientes_validation_1.updatePlantaSchema.parse(req.body);
        const planta = await database_1.prisma.planta.update({
            where: { id: Number(req.params.plantaId) },
            data,
        });
        res.json(planta);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/clientes/:clienteId/plantas/:plantaId (admin)
router.delete('/:clienteId/plantas/:plantaId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.planta.delete({ where: { id: Number(req.params.plantaId) } });
        res.json({ message: 'Planta eliminada' });
    }
    catch (err) {
        next(err);
    }
});
// ===== MAQUINAS (nested under cliente) =====
// GET /api/v1/clientes/:clienteId/maquinas
router.get('/:clienteId/maquinas', async (req, res, next) => {
    try {
        const where = { clienteId: Number(req.params.clienteId) };
        if (req.query.plantaId)
            where.plantaId = Number(req.query.plantaId);
        const maquinas = await database_1.prisma.maquina.findMany({
            where,
            orderBy: { nombre: 'asc' },
            include: { planta: { select: { id: true, nombre: true } } },
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