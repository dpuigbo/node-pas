"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const sistemas_validation_1 = require("../validation/sistemas.validation");
const router = (0, express_1.Router)();
// ===== SISTEMAS =====
// GET /api/v1/sistemas
router.get('/', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.clienteId)
            where.clienteId = Number(req.query.clienteId);
        if (req.query.maquinaId)
            where.maquinaId = Number(req.query.maquinaId);
        const sistemas = await database_1.prisma.sistema.findMany({
            where,
            orderBy: { nombre: 'asc' },
            include: {
                cliente: { select: { id: true, nombre: true } },
                maquina: { select: { id: true, nombre: true } },
                fabricante: { select: { id: true, nombre: true } },
                _count: { select: { componentes: true } },
            },
        });
        res.json(sistemas);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/sistemas/:id
router.get('/:id', async (req, res, next) => {
    try {
        const sistema = await database_1.prisma.sistema.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                cliente: { select: { id: true, nombre: true } },
                maquina: { select: { id: true, nombre: true } },
                fabricante: { select: { id: true, nombre: true } },
                componentes: {
                    orderBy: { orden: 'asc' },
                    include: {
                        modeloComponente: {
                            select: { id: true, nombre: true, tipo: true },
                        },
                    },
                },
            },
        });
        if (!sistema) {
            res.status(404).json({ error: 'Sistema no encontrado' });
            return;
        }
        res.json(sistema);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/sistemas (admin)
router.post('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = sistemas_validation_1.createSistemaSchema.parse(req.body);
        const sistema = await database_1.prisma.sistema.create({
            data,
            include: {
                cliente: { select: { id: true, nombre: true } },
                fabricante: { select: { id: true, nombre: true } },
            },
        });
        res.status(201).json(sistema);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/sistemas/:id (admin)
router.put('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = sistemas_validation_1.updateSistemaSchema.parse(req.body);
        const sistema = await database_1.prisma.sistema.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json(sistema);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/sistemas/:id (admin)
router.delete('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.sistema.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'Sistema eliminado' });
    }
    catch (err) {
        next(err);
    }
});
// ===== COMPONENTES SISTEMA (nested under sistema) =====
// GET /api/v1/sistemas/:sistemaId/componentes
router.get('/:sistemaId/componentes', async (req, res, next) => {
    try {
        const componentes = await database_1.prisma.componenteSistema.findMany({
            where: { sistemaId: Number(req.params.sistemaId) },
            orderBy: { orden: 'asc' },
            include: {
                modeloComponente: {
                    select: { id: true, nombre: true, tipo: true, fabricanteId: true },
                    include: { fabricante: { select: { nombre: true } } },
                },
            },
        });
        res.json(componentes);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/sistemas/:sistemaId/componentes (admin)
router.post('/:sistemaId/componentes', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = sistemas_validation_1.createComponenteSchema.parse(req.body);
        const componente = await database_1.prisma.componenteSistema.create({
            data: { ...data, sistemaId: Number(req.params.sistemaId) },
        });
        res.status(201).json(componente);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/sistemas/:sistemaId/componentes/:componenteId (admin)
router.put('/:sistemaId/componentes/:componenteId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = sistemas_validation_1.updateComponenteSchema.parse(req.body);
        const componente = await database_1.prisma.componenteSistema.update({
            where: { id: Number(req.params.componenteId) },
            data,
        });
        res.json(componente);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/sistemas/:sistemaId/componentes/:componenteId (admin)
router.delete('/:sistemaId/componentes/:componenteId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.componenteSistema.delete({ where: { id: Number(req.params.componenteId) } });
        res.json({ message: 'Componente eliminado' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=sistemas.routes.js.map