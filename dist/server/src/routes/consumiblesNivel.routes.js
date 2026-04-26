"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const consumibleNivel_validation_1 = require("../validation/consumibleNivel.validation");
const niveles_1 = require("../lib/niveles");
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
            include: { nivel: { select: { codigo: true, nombre: true, orden: true } } },
            orderBy: [{ modeloId: 'asc' }, { nivel: { orden: 'asc' } }],
        });
        res.json(rows.map((r) => ({ ...r, nivel: r.nivel.codigo })));
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
            include: {
                consumiblesNivel: {
                    include: { nivel: { select: { codigo: true, nombre: true, orden: true } } },
                },
            },
            orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
        });
        // Aplanar: serializar nivel.codigo a string en cada fila
        res.json(modelos.map((m) => ({
            ...m,
            consumiblesNivel: m.consumiblesNivel.map((c) => ({ ...c, nivel: c.nivel.codigo })),
        })));
    }
    catch (err) {
        next(err);
    }
});
async function resolveNivelOrThrow(codigo) {
    const id = await (0, niveles_1.nivelIdFromCodigo)(codigo);
    if (id == null)
        throw new Error(`Nivel desconocido: ${codigo}`);
    return id;
}
// PUT /api/v1/consumibles-nivel (admin) — upsert single
router.put('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = consumibleNivel_validation_1.upsertConsumibleNivelSchema.parse(req.body);
        const nivelId = await resolveNivelOrThrow(data.nivel);
        const row = await database_1.prisma.consumibleNivel.upsert({
            where: {
                modeloId_nivelId: { modeloId: data.modeloId, nivelId },
            },
            update: {
                horas: data.horas ?? null,
                precioOtros: data.precioOtros ?? null,
                consumibles: data.consumibles ?? undefined,
            },
            create: {
                modeloId: data.modeloId,
                nivelId,
                horas: data.horas ?? null,
                precioOtros: data.precioOtros ?? null,
                consumibles: data.consumibles ?? undefined,
            },
            include: { nivel: { select: { codigo: true } } },
        });
        res.json({ ...row, nivel: row.nivel.codigo });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/consumibles-nivel/batch (admin) — upsert multiple
router.put('/batch', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const items = consumibleNivel_validation_1.batchUpsertSchema.parse(req.body);
        const itemsWithIds = await Promise.all(items.map(async (data) => ({
            ...data,
            nivelId: await resolveNivelOrThrow(data.nivel),
        })));
        const results = await database_1.prisma.$transaction(itemsWithIds.map((data) => database_1.prisma.consumibleNivel.upsert({
            where: {
                modeloId_nivelId: { modeloId: data.modeloId, nivelId: data.nivelId },
            },
            update: {
                horas: data.horas ?? null,
                precioOtros: data.precioOtros ?? null,
                consumibles: data.consumibles ?? undefined,
            },
            create: {
                modeloId: data.modeloId,
                nivelId: data.nivelId,
                horas: data.horas ?? null,
                precioOtros: data.precioOtros ?? null,
                consumibles: data.consumibles ?? undefined,
            },
            include: { nivel: { select: { codigo: true } } },
        })));
        res.json(results.map((r) => ({ ...r, nivel: r.nivel.codigo })));
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=consumiblesNivel.routes.js.map