"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const fabricantes_validation_1 = require("../validation/fabricantes.validation");
const router = (0, express_1.Router)();
// GET /api/v1/fabricantes
router.get('/', async (_req, res, next) => {
    try {
        const fabricantes = await database_1.prisma.fabricante.findMany({
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
            include: { _count: { select: { modelos: true } } },
        });
        res.json(fabricantes);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/fabricantes/:id
router.get('/:id', async (req, res, next) => {
    try {
        const fabricante = await database_1.prisma.fabricante.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                modelos: {
                    orderBy: { nombre: 'asc' },
                    include: { _count: { select: { versiones: true } } },
                },
            },
        });
        if (!fabricante) {
            res.status(404).json({ error: 'Fabricante no encontrado' });
            return;
        }
        res.json(fabricante);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/fabricantes (admin)
router.post('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = fabricantes_validation_1.createFabricanteSchema.parse(req.body);
        const fabricante = await database_1.prisma.fabricante.create({ data });
        res.status(201).json(fabricante);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/fabricantes/:id (admin)
router.put('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = fabricantes_validation_1.updateFabricanteSchema.parse(req.body);
        const fabricante = await database_1.prisma.fabricante.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json(fabricante);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/fabricantes/:id (admin) - soft delete
router.delete('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const fabricante = await database_1.prisma.fabricante.update({
            where: { id: Number(req.params.id) },
            data: { activo: false },
        });
        res.json(fabricante);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=fabricantes.routes.js.map