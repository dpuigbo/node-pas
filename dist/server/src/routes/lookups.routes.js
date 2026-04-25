"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// GET /api/v1/lookups/familias?fabricanteId=1&tipo=mechanical_unit
router.get('/familias', async (req, res, next) => {
    try {
        const where = { activa: true };
        if (req.query.fabricanteId)
            where.fabricanteId = Number(req.query.fabricanteId);
        if (req.query.tipo)
            where.tipo = String(req.query.tipo);
        const familias = await database_1.prisma.luFamilia.findMany({
            where,
            orderBy: { codigo: 'asc' },
            include: { fabricante: { select: { id: true, nombre: true } } },
        });
        res.json(familias);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/lookups/generaciones-controlador
router.get('/generaciones-controlador', async (_req, res, next) => {
    try {
        const generaciones = await database_1.prisma.luGeneracionControlador.findMany({
            where: { activo: true },
            orderBy: { orden: 'asc' },
        });
        res.json(generaciones);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/lookups/tipos-actividad
router.get('/tipos-actividad', async (_req, res, next) => {
    try {
        const tipos = await database_1.prisma.luTipoActividad.findMany({
            orderBy: { orden: 'asc' },
        });
        res.json(tipos);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/lookups/niveles-mantenimiento
router.get('/niveles-mantenimiento', async (_req, res, next) => {
    try {
        const niveles = await database_1.prisma.luNivelMantenimiento.findMany({
            orderBy: { orden: 'asc' },
        });
        res.json(niveles);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/lookups/unidades-intervalo
router.get('/unidades-intervalo', async (_req, res, next) => {
    try {
        const unidades = await database_1.prisma.luUnidadIntervalo.findMany({
            orderBy: { orden: 'asc' },
        });
        res.json(unidades);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/lookups/aceites?q=kyodo
router.get('/aceites', async (req, res, next) => {
    try {
        const q = req.query.q ? String(req.query.q) : '';
        if (q) {
            // Buscar por alias (incluye nombre original)
            const aliases = await database_1.prisma.aceiteAlias.findMany({
                where: { alias: { contains: q } },
                include: {
                    aceite: true,
                },
            });
            // Deduplicar aceites
            const seen = new Set();
            const aceites = aliases
                .map(a => a.aceite)
                .filter(a => {
                if (seen.has(a.id))
                    return false;
                seen.add(a.id);
                return true;
            });
            res.json(aceites);
        }
        else {
            const aceites = await database_1.prisma.aceite.findMany({
                where: { activo: true },
                orderBy: { nombre: 'asc' },
            });
            res.json(aceites);
        }
    }
    catch (err) {
        next(err);
    }
});
// ===== ACTIVIDAD ↔ CONSUMIBLE (M:N) =====
// GET /api/v1/lookups/actividad/:id/consumibles
router.get('/actividad/:tipo(preventiva|cabinet|drive-module)/:id/consumibles', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const tipo = req.params.tipo;
        let items = [];
        if (tipo === 'preventiva') {
            items = await database_1.prisma.actividadConsumible.findMany({
                where: { actividadPreventivaId: id },
                include: { consumible: true },
            });
        }
        else if (tipo === 'cabinet') {
            items = await database_1.prisma.actividadCabinetConsumible.findMany({
                where: { actividadCabinetId: id },
                include: { consumible: true },
            });
        }
        else {
            items = await database_1.prisma.actividadDriveModuleConsumible.findMany({
                where: { actividadDriveModuleId: id },
                include: { consumible: true },
            });
        }
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/lookups/actividad/:tipo/:id/consumibles
router.post('/actividad/:tipo(preventiva|cabinet|drive-module)/:id/consumibles', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const tipo = req.params.tipo;
        const { consumibleId, cantidad, unidad, notas } = req.body;
        let item;
        if (tipo === 'preventiva') {
            item = await database_1.prisma.actividadConsumible.create({
                data: { actividadPreventivaId: id, consumibleId, cantidad, unidad, notas },
                include: { consumible: true },
            });
        }
        else if (tipo === 'cabinet') {
            item = await database_1.prisma.actividadCabinetConsumible.create({
                data: { actividadCabinetId: id, consumibleId, cantidad, unidad, notas },
                include: { consumible: true },
            });
        }
        else {
            item = await database_1.prisma.actividadDriveModuleConsumible.create({
                data: { actividadDriveModuleId: id, consumibleId, cantidad, unidad, notas },
                include: { consumible: true },
            });
        }
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/lookups/actividad/:tipo/:id/consumibles/:linkId
router.delete('/actividad/:tipo(preventiva|cabinet|drive-module)/:id/consumibles/:linkId', async (req, res, next) => {
    try {
        const linkId = Number(req.params.linkId);
        const tipo = req.params.tipo;
        if (tipo === 'preventiva') {
            await database_1.prisma.actividadConsumible.delete({ where: { id: linkId } });
        }
        else if (tipo === 'cabinet') {
            await database_1.prisma.actividadCabinetConsumible.delete({ where: { id: linkId } });
        }
        else {
            await database_1.prisma.actividadDriveModuleConsumible.delete({ where: { id: linkId } });
        }
        res.json({ message: 'Eliminado' });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/lookups/punto-control/:id/consumible
router.put('/punto-control/:id/consumible', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { consumibleId } = req.body;
        const punto = await database_1.prisma.puntoControlGenerico.update({
            where: { id },
            data: { consumibleId: consumibleId ?? null },
            include: { consumible: true },
        });
        res.json(punto);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/lookups/consumibles-catalogo?tipo=aceite&subtipo=engranaje&q=...
router.get('/consumibles-catalogo', async (req, res, next) => {
    try {
        const where = { activo: true };
        if (req.query.tipo)
            where.tipo = String(req.query.tipo);
        if (req.query.subtipo)
            where.subtipo = String(req.query.subtipo);
        if (req.query.q) {
            where.OR = [
                { nombre: { contains: String(req.query.q) } },
                { codigoAbb: { contains: String(req.query.q) } },
            ];
        }
        const items = await database_1.prisma.consumibleCatalogo.findMany({
            where,
            orderBy: [{ tipo: 'asc' }, { subtipo: 'asc' }, { nombre: 'asc' }],
        });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/lookups/equivalencias?familiaId=X&tipo=lubricacion
router.get('/equivalencias', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.familiaId)
            where.familiaId = Number(req.query.familiaId);
        if (req.query.tipo)
            where.tipoEquivalencia = String(req.query.tipo);
        const equivalencias = await database_1.prisma.equivalenciaFamilia.findMany({
            where,
            orderBy: { id: 'asc' },
            include: {
                familia: { select: { id: true, codigo: true, tipo: true } },
            },
        });
        res.json(equivalencias);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/lookups/puntos-control?categoria=manipulador
router.get('/puntos-control', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.categoria)
            where.categoria = String(req.query.categoria);
        const puntos = await database_1.prisma.puntoControlGenerico.findMany({
            where,
            orderBy: { orden: 'asc' },
        });
        res.json(puntos);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=lookups.routes.js.map