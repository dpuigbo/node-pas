"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const consumibleNivel_validation_1 = require("../validation/consumibleNivel.validation");
const router = (0, express_1.Router)();
// GET /api/v1/consumibles-nivel?modeloId=5
// Returns all consumibles-nivel rows for a given modelo (or all if no filter)
router.get('/', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.modeloId)
            where.modeloId = Number(req.query.modeloId);
        const rows = await database_1.prisma.consumibleNivel.findMany({
            where,
            orderBy: [{ modeloId: 'asc' }, { nivel: 'asc' }],
        });
        res.json(rows);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/consumibles-nivel/por-fabricante/:fabricanteId
// Returns all consumibles-nivel grouped by modelo for a fabricante
router.get('/por-fabricante/:fabricanteId', async (req, res, next) => {
    try {
        const fabricanteId = Number(req.params.fabricanteId);
        const modelos = await database_1.prisma.modeloComponente.findMany({
            where: { fabricanteId },
            include: { consumiblesNivel: true },
            orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
        });
        res.json(modelos);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/consumibles-nivel (admin) — upsert single
router.put('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = consumibleNivel_validation_1.upsertConsumibleNivelSchema.parse(req.body);
        const row = await database_1.prisma.consumibleNivel.upsert({
            where: {
                modeloId_nivel: { modeloId: data.modeloId, nivel: data.nivel },
            },
            update: {
                horas: data.horas ?? null,
                precioOtros: data.precioOtros ?? null,
                consumibles: data.consumibles ?? undefined,
            },
            create: {
                modeloId: data.modeloId,
                nivel: data.nivel,
                horas: data.horas ?? null,
                precioOtros: data.precioOtros ?? null,
                consumibles: data.consumibles ?? undefined,
            },
        });
        res.json(row);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/consumibles-nivel/batch (admin) — upsert multiple
router.put('/batch', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const items = consumibleNivel_validation_1.batchUpsertSchema.parse(req.body);
        const results = await database_1.prisma.$transaction(items.map((data) => database_1.prisma.consumibleNivel.upsert({
            where: {
                modeloId_nivel: { modeloId: data.modeloId, nivel: data.nivel },
            },
            update: {
                horas: data.horas ?? null,
                precioOtros: data.precioOtros ?? null,
                consumibles: data.consumibles ?? undefined,
            },
            create: {
                modeloId: data.modeloId,
                nivel: data.nivel,
                horas: data.horas ?? null,
                precioOtros: data.precioOtros ?? null,
                consumibles: data.consumibles ?? undefined,
            },
        })));
        res.json(results);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=consumiblesNivel.routes.js.map