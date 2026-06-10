"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const consumibleNivel_validation_1 = require("../validation/consumibleNivel.validation");
const niveles_1 = require("../lib/niveles");
// v2.9: la tabla consumibles_nivel fue eliminada. Este router gestiona ahora
// las horas de trabajo por (modelo, nivel) en mantenimiento_horas_modelo
// (D-073/D-074). Se mantiene el prefijo /consumibles-nivel por compatibilidad.
const router = (0, express_1.Router)();
// GET /api/v1/consumibles-nivel?modeloId=5
router.get('/', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.modeloId)
            where.modeloComponenteId = Number(req.query.modeloId);
        const rows = await database_1.prisma.mantenimientoHorasModelo.findMany({
            where,
            include: { nivel: { select: { codigo: true, nombre: true, orden: true } } },
            orderBy: [{ modeloComponenteId: 'asc' }, { nivel: { orden: 'asc' } }],
        });
        res.json(rows.map((r) => ({
            ...r,
            modeloId: r.modeloComponenteId,
            horas: r.horas != null ? Number(r.horas) : null,
            nivel: r.nivel.codigo,
        })));
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/consumibles-nivel/por-fabricante/:fabricanteId
// Horas por nivel agrupadas por modelo para un fabricante.
router.get('/por-fabricante/:fabricanteId', async (req, res, next) => {
    try {
        const fabricanteId = Number(req.params.fabricanteId);
        const modelos = await database_1.prisma.modeloComponente.findMany({
            where: { fabricanteId, activa: true },
            include: {
                mantenimientoHoras: {
                    include: { nivel: { select: { codigo: true, nombre: true, orden: true } } },
                },
                familiaRel: { select: { codigo: true } },
            },
            orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
        });
        res.json(modelos.map((m) => ({
            ...m,
            familia: m.familiaRel?.codigo ?? null,
            horasNivel: m.mantenimientoHoras.map((h) => ({
                ...h,
                horas: h.horas != null ? Number(h.horas) : null,
                nivel: h.nivel.codigo,
            })),
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
async function upsertHoras(data) {
    const existing = await database_1.prisma.mantenimientoHorasModelo.findFirst({
        where: { modeloComponenteId: data.modeloId, nivelId: data.nivelId },
    });
    if (data.horas == null) {
        // Sin horas: si existia, eliminar la fila (horas es NOT NULL en BD)
        if (existing) {
            await database_1.prisma.mantenimientoHorasModelo.delete({ where: { id: existing.id } });
        }
        return null;
    }
    if (existing) {
        return database_1.prisma.mantenimientoHorasModelo.update({
            where: { id: existing.id },
            data: { horas: data.horas, notas: data.notas ?? existing.notas },
            include: { nivel: { select: { codigo: true } } },
        });
    }
    return database_1.prisma.mantenimientoHorasModelo.create({
        data: {
            modeloComponenteId: data.modeloId,
            nivelId: data.nivelId,
            horas: data.horas,
            notas: data.notas ?? null,
        },
        include: { nivel: { select: { codigo: true } } },
    });
}
// PUT /api/v1/consumibles-nivel (admin) — upsert single
router.put('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = consumibleNivel_validation_1.upsertHorasModeloSchema.parse(req.body);
        const nivelId = await resolveNivelOrThrow(data.nivel);
        const row = await upsertHoras({ modeloId: data.modeloId, nivelId, horas: data.horas ?? null, notas: data.notas ?? null });
        if (!row) {
            res.json({ modeloId: data.modeloId, nivel: data.nivel, horas: null, deleted: true });
            return;
        }
        res.json({ ...row, modeloId: row.modeloComponenteId, horas: Number(row.horas), nivel: row.nivel.codigo });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/consumibles-nivel/batch (admin) — upsert multiple
router.put('/batch', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const items = consumibleNivel_validation_1.batchUpsertHorasSchema.parse(req.body);
        const results = [];
        for (const data of items) {
            const nivelId = await resolveNivelOrThrow(data.nivel);
            const row = await upsertHoras({ modeloId: data.modeloId, nivelId, horas: data.horas ?? null, notas: data.notas ?? null });
            results.push(row
                ? { ...row, modeloId: row.modeloComponenteId, horas: Number(row.horas), nivel: row.nivel.codigo }
                : { modeloId: data.modeloId, nivel: data.nivel, horas: null, deleted: true });
        }
        res.json(results);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=consumiblesNivel.routes.js.map