"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const catalogos_validation_1 = require("../validation/catalogos.validation");
const router = (0, express_1.Router)();
// ===== ACEITES =====
// GET /api/v1/catalogos/aceites
router.get('/aceites', async (_req, res, next) => {
    try {
        const aceites = await database_1.prisma.aceite.findMany({ orderBy: { nombre: 'asc' } });
        res.json(aceites);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/catalogos/aceites (admin)
router.post('/aceites', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = catalogos_validation_1.createAceiteSchema.parse(req.body);
        const aceite = await database_1.prisma.aceite.create({ data });
        res.status(201).json(aceite);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/catalogos/aceites/:id (admin)
router.put('/aceites/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = catalogos_validation_1.updateAceiteSchema.parse(req.body);
        const aceite = await database_1.prisma.aceite.update({ where: { id: Number(req.params.id) }, data });
        res.json(aceite);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/catalogos/aceites/:id (admin) - soft delete
router.delete('/aceites/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const aceite = await database_1.prisma.aceite.update({
            where: { id: Number(req.params.id) },
            data: { activo: false },
        });
        res.json(aceite);
    }
    catch (err) {
        next(err);
    }
});
// ===== CONSUMIBLES =====
// GET /api/v1/catalogos/consumibles
router.get('/consumibles', async (_req, res, next) => {
    try {
        const consumibles = await database_1.prisma.consumible.findMany({ orderBy: { nombre: 'asc' } });
        res.json(consumibles);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/catalogos/consumibles (admin)
router.post('/consumibles', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = catalogos_validation_1.createConsumibleSchema.parse(req.body);
        const consumible = await database_1.prisma.consumible.create({ data });
        res.status(201).json(consumible);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/catalogos/consumibles/:id (admin)
router.put('/consumibles/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = catalogos_validation_1.updateConsumibleSchema.parse(req.body);
        const consumible = await database_1.prisma.consumible.update({ where: { id: Number(req.params.id) }, data });
        res.json(consumible);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/catalogos/consumibles/:id (admin) - soft delete
router.delete('/consumibles/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const consumible = await database_1.prisma.consumible.update({
            where: { id: Number(req.params.id) },
            data: { activo: false },
        });
        res.json(consumible);
    }
    catch (err) {
        next(err);
    }
});
// ===== CONFIGURACION APP =====
// GET /api/v1/catalogos/configuracion
router.get('/configuracion', async (_req, res, next) => {
    try {
        const config = await database_1.prisma.configuracionApp.findMany({ orderBy: { clave: 'asc' } });
        // Convert to key-value object
        const configObj = config.reduce((acc, item) => {
            acc[item.clave] = item.valor;
            return acc;
        }, {});
        res.json(configObj);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/catalogos/configuracion (admin) - batch update
router.put('/configuracion', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const items = catalogos_validation_1.batchConfigSchema.parse(req.body);
        await database_1.prisma.$transaction(items.map(item => database_1.prisma.configuracionApp.upsert({
            where: { clave: item.clave },
            update: { valor: item.valor },
            create: { clave: item.clave, valor: item.valor },
        })));
        res.json({ message: 'Configuracion actualizada' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=catalogos.routes.js.map