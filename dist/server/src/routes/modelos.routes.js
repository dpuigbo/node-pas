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
                _count: { select: { versiones: true, compatibleConControladores: true, componentesCompatibles: true } },
            },
        });
        res.json(modelos);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/modelos/compatible?sistemaId=X&tipo=Y
// Returns models compatible with the controllers already in a system
router.get('/compatible', async (req, res, next) => {
    try {
        const sistemaId = Number(req.query.sistemaId);
        const tipo = req.query.tipo;
        if (!sistemaId || !tipo) {
            res.status(400).json({ error: 'sistemaId y tipo son obligatorios' });
            return;
        }
        // For controllers: return all controllers of the system's fabricante (no compatibility filter)
        if (tipo === 'controller') {
            const sistema = await database_1.prisma.sistema.findUnique({
                where: { id: sistemaId },
                select: { fabricanteId: true },
            });
            if (!sistema) {
                res.status(404).json({ error: 'Sistema no encontrado' });
                return;
            }
            const modelos = await database_1.prisma.modeloComponente.findMany({
                where: { fabricanteId: sistema.fabricanteId, tipo: 'controller' },
                orderBy: { nombre: 'asc' },
                include: { fabricante: { select: { id: true, nombre: true } } },
            });
            res.json({ modelos, warning: null });
            return;
        }
        // For non-controllers: find controllers in this system, then get compatible models
        const controladores = await database_1.prisma.componenteSistema.findMany({
            where: { sistemaId, tipo: 'controller' },
            select: { modeloComponenteId: true },
        });
        if (controladores.length === 0) {
            // No controllers yet: return all models of this tipo + warning
            const sistema = await database_1.prisma.sistema.findUnique({
                where: { id: sistemaId },
                select: { fabricanteId: true },
            });
            if (!sistema) {
                res.status(404).json({ error: 'Sistema no encontrado' });
                return;
            }
            const modelos = await database_1.prisma.modeloComponente.findMany({
                where: { fabricanteId: sistema.fabricanteId, tipo },
                orderBy: { nombre: 'asc' },
                include: { fabricante: { select: { id: true, nombre: true } } },
            });
            res.json({ modelos, warning: 'No hay controladoras en el sistema. Se muestran todos los modelos.' });
            return;
        }
        const controllerModelIds = [...new Set(controladores.map((c) => c.modeloComponenteId))];
        // Get models that are compatible with ANY of the controllers in the system
        const compatibles = await database_1.prisma.compatibilidadControlador.findMany({
            where: {
                controladorId: { in: controllerModelIds },
                componente: { tipo },
            },
            select: { componenteId: true },
        });
        const compatibleIds = [...new Set(compatibles.map((c) => c.componenteId))];
        if (compatibleIds.length === 0) {
            // No compatibility configured: return empty with warning
            const sistema = await database_1.prisma.sistema.findUnique({ where: { id: sistemaId }, select: { fabricanteId: true } });
            const totalSinConfig = await database_1.prisma.modeloComponente.count({
                where: { tipo, fabricanteId: sistema?.fabricanteId },
            });
            res.json({
                modelos: [],
                warning: `Ninguno de los ${totalSinConfig} modelos de este tipo tiene compatibilidad configurada con las controladoras del sistema.`,
            });
            return;
        }
        const modelos = await database_1.prisma.modeloComponente.findMany({
            where: { id: { in: compatibleIds } },
            orderBy: { nombre: 'asc' },
            include: { fabricante: { select: { id: true, nombre: true } } },
        });
        res.json({ modelos, warning: null });
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
                compatibleConControladores: {
                    include: { controlador: { select: { id: true, nombre: true, tipo: true } } },
                },
                componentesCompatibles: {
                    include: { componente: { select: { id: true, nombre: true, tipo: true } } },
                },
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
// ===== COMPATIBILIDAD CONTROLADOR =====
// GET /api/v1/modelos/:id/compatibilidad
// For controllers: returns compatible components
// For non-controllers: returns compatible controllers
router.get('/:id/compatibilidad', async (req, res, next) => {
    try {
        const modelo = await database_1.prisma.modeloComponente.findUnique({
            where: { id: Number(req.params.id) },
            select: { id: true, tipo: true, fabricanteId: true },
        });
        if (!modelo) {
            res.status(404).json({ error: 'Modelo no encontrado' });
            return;
        }
        if (modelo.tipo === 'controller') {
            // Controller: return components compatible with this controller
            const rels = await database_1.prisma.compatibilidadControlador.findMany({
                where: { controladorId: modelo.id },
                include: { componente: { select: { id: true, nombre: true, tipo: true } } },
            });
            res.json(rels.map((r) => r.componente));
        }
        else {
            // Non-controller: return controllers compatible with this component
            const rels = await database_1.prisma.compatibilidadControlador.findMany({
                where: { componenteId: modelo.id },
                include: { controlador: { select: { id: true, nombre: true, tipo: true } } },
            });
            res.json(rels.map((r) => r.controlador));
        }
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/modelos/:id/compatibilidad (admin)
// Body: { ids: [1, 5, 8] } — set compatible model IDs (replaces all)
router.put('/:id/compatibilidad', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { ids } = modelos_validation_1.compatibilidadSchema.parse(req.body);
        const modeloId = Number(req.params.id);
        const modelo = await database_1.prisma.modeloComponente.findUnique({
            where: { id: modeloId },
            select: { id: true, tipo: true, fabricanteId: true },
        });
        if (!modelo) {
            res.status(404).json({ error: 'Modelo no encontrado' });
            return;
        }
        // Validate that all target IDs exist, belong to the same fabricante, and have the correct type
        if (ids.length > 0) {
            const targets = await database_1.prisma.modeloComponente.findMany({
                where: { id: { in: ids } },
                select: { id: true, tipo: true, fabricanteId: true },
            });
            // Check all exist
            if (targets.length !== ids.length) {
                res.status(400).json({ error: 'Algunos modelos no existen' });
                return;
            }
            // Check same fabricante
            const wrongFabricante = targets.filter((t) => t.fabricanteId !== modelo.fabricanteId);
            if (wrongFabricante.length > 0) {
                res.status(400).json({ error: 'Todos los modelos deben pertenecer al mismo fabricante' });
                return;
            }
            // Check correct types
            if (modelo.tipo === 'controller') {
                // Controller: targets must be non-controllers
                const wrongTipo = targets.filter((t) => t.tipo === 'controller');
                if (wrongTipo.length > 0) {
                    res.status(400).json({ error: 'Un controlador solo puede asociarse con componentes (no con otros controladores)' });
                    return;
                }
            }
            else {
                // Non-controller: targets must be controllers
                const wrongTipo = targets.filter((t) => t.tipo !== 'controller');
                if (wrongTipo.length > 0) {
                    res.status(400).json({ error: 'Un componente solo puede asociarse con controladores' });
                    return;
                }
            }
        }
        // Transaction: delete all existing + create new
        await database_1.prisma.$transaction(async (tx) => {
            if (modelo.tipo === 'controller') {
                await tx.compatibilidadControlador.deleteMany({ where: { controladorId: modeloId } });
                if (ids.length > 0) {
                    await tx.compatibilidadControlador.createMany({
                        data: ids.map((componenteId) => ({ controladorId: modeloId, componenteId })),
                    });
                }
            }
            else {
                await tx.compatibilidadControlador.deleteMany({ where: { componenteId: modeloId } });
                if (ids.length > 0) {
                    await tx.compatibilidadControlador.createMany({
                        data: ids.map((controladorId) => ({ controladorId, componenteId: modeloId })),
                    });
                }
            }
        });
        res.json({ message: 'Compatibilidad actualizada', count: ids.length });
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