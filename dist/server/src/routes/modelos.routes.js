"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const modelos_validation_1 = require("../validation/modelos.validation");
const templateSeeds_1 = require("../lib/templateSeeds");
const router = (0, express_1.Router)();
// ===== MODELOS COMPONENTE =====
// GET /api/v1/modelos
router.get('/', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.fabricanteId)
            where.fabricanteId = Number(req.query.fabricanteId);
        if (req.query.tipo)
            where.tipo = req.query.tipo;
        const modelos = await database_1.prisma.modeloComponente.findMany({
            where,
            orderBy: [{ fabricanteId: 'asc' }, { tipo: 'asc' }, { nombre: 'asc' }],
            include: {
                fabricante: { select: { id: true, nombre: true } },
                _count: { select: { versiones: true } },
            },
        });
        res.json(modelos);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/modelos/:id
router.get('/:id', async (req, res, next) => {
    try {
        const modelo = await database_1.prisma.modeloComponente.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                fabricante: { select: { id: true, nombre: true } },
                versiones: { orderBy: { version: 'desc' } },
            },
        });
        if (!modelo) {
            res.status(404).json({ error: 'Modelo no encontrado' });
            return;
        }
        res.json(modelo);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/modelos (admin)
router.post('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = modelos_validation_1.createModeloSchema.parse(req.body);
        const modelo = await database_1.prisma.modeloComponente.create({
            data,
            include: { fabricante: { select: { id: true, nombre: true } } },
        });
        res.status(201).json(modelo);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/modelos/:id (admin)
router.put('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = modelos_validation_1.updateModeloSchema.parse(req.body);
        const modelo = await database_1.prisma.modeloComponente.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json(modelo);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/modelos/:id (admin)
router.delete('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.modeloComponente.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'Modelo eliminado' });
    }
    catch (err) {
        next(err);
    }
});
// ===== VERSIONES TEMPLATE (nested under modelo) =====
// GET /api/v1/modelos/:modeloId/versiones
router.get('/:modeloId/versiones', async (req, res, next) => {
    try {
        const versiones = await database_1.prisma.versionTemplate.findMany({
            where: { modeloComponenteId: Number(req.params.modeloId) },
            orderBy: { version: 'desc' },
        });
        res.json(versiones);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/modelos/:modeloId/versiones/:versionId
router.get('/:modeloId/versiones/:versionId', async (req, res, next) => {
    try {
        const version = await database_1.prisma.versionTemplate.findUnique({
            where: { id: Number(req.params.versionId) },
            include: {
                modeloComponente: {
                    include: { fabricante: { select: { id: true, nombre: true } } },
                },
            },
        });
        if (!version) {
            res.status(404).json({ error: 'Version no encontrada' });
            return;
        }
        res.json(version);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/modelos/:modeloId/versiones (admin)
router.post('/:modeloId/versiones', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = modelos_validation_1.createVersionSchema.parse(req.body);
        const modeloId = Number(req.params.modeloId);
        // Auto-calculate next version number
        const lastVersion = await database_1.prisma.versionTemplate.findFirst({
            where: { modeloComponenteId: modeloId },
            orderBy: { version: 'desc' },
        });
        const nextVersion = (lastVersion?.version ?? 0) + 1;
        // If schema is empty and it's the first version, use seed template based on model tipo
        let schema = data.schema;
        const blocks = schema?.blocks;
        if (!blocks || (Array.isArray(blocks) && blocks.length === 0)) {
            const modelo = await database_1.prisma.modeloComponente.findUnique({
                where: { id: modeloId },
                select: { tipo: true },
            });
            if (modelo) {
                schema = (0, templateSeeds_1.getSeedTemplate)(modelo.tipo);
            }
        }
        const version = await database_1.prisma.versionTemplate.create({
            data: {
                modeloComponenteId: modeloId,
                version: nextVersion,
                schema: schema,
                notas: data.notas,
            },
        });
        res.status(201).json(version);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/modelos/:modeloId/versiones/:versionId (admin)
router.put('/:modeloId/versiones/:versionId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = modelos_validation_1.updateVersionSchema.parse(req.body);
        const version = await database_1.prisma.versionTemplate.update({
            where: { id: Number(req.params.versionId) },
            data,
        });
        res.json(version);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/v1/modelos/:modeloId/versiones/:versionId/estado (admin)
// Business rule: activating a version deactivates all other active versions of the same model
router.patch('/:modeloId/versiones/:versionId/estado', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { estado } = modelos_validation_1.activateVersionSchema.parse(req.body);
        const versionId = Number(req.params.versionId);
        const modeloId = Number(req.params.modeloId);
        if (estado === 'activo') {
            // Atomic transaction: deactivate others + activate this one
            const [, version] = await database_1.prisma.$transaction([
                database_1.prisma.versionTemplate.updateMany({
                    where: { modeloComponenteId: modeloId, estado: 'activo' },
                    data: { estado: 'obsoleto' },
                }),
                database_1.prisma.versionTemplate.update({
                    where: { id: versionId },
                    data: { estado: 'activo' },
                }),
            ]);
            res.json(version);
        }
        else {
            const version = await database_1.prisma.versionTemplate.update({
                where: { id: versionId },
                data: { estado },
            });
            res.json(version);
        }
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/modelos/:modeloId/versiones/:versionId (admin)
router.delete('/:modeloId/versiones/:versionId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const version = await database_1.prisma.versionTemplate.findUnique({
            where: { id: Number(req.params.versionId) },
        });
        if (version?.estado === 'activo') {
            res.status(400).json({ error: 'No se puede eliminar una version activa. Desactivala primero.' });
            return;
        }
        await database_1.prisma.versionTemplate.delete({ where: { id: Number(req.params.versionId) } });
        res.json({ message: 'Version eliminada' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=modelos.routes.js.map