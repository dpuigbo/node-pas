"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /v1/document-templates — list all document templates
router.get('/', async (_req, res) => {
    try {
        const templates = await database_1.prisma.documentTemplate.findMany({
            orderBy: { tipo: 'asc' },
        });
        res.json(templates);
    }
    catch (error) {
        console.error('[DocumentTemplates] List error:', error);
        res.status(500).json({ error: 'Error al obtener plantillas de documento' });
    }
});
// GET /v1/document-templates/:id — get single template with schema
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const template = await database_1.prisma.documentTemplate.findUnique({
            where: { id },
        });
        if (!template) {
            return res.status(404).json({ error: 'Plantilla no encontrada' });
        }
        res.json(template);
    }
    catch (error) {
        console.error('[DocumentTemplates] Get error:', error);
        res.status(500).json({ error: 'Error al obtener plantilla de documento' });
    }
});
// PUT /v1/document-templates/:id — update template schema (admin only)
router.put('/:id', auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { schema, nombre } = req.body;
        const updateData = {};
        if (schema !== undefined)
            updateData.schema = schema;
        if (nombre !== undefined)
            updateData.nombre = nombre;
        const template = await database_1.prisma.documentTemplate.update({
            where: { id },
            data: updateData,
        });
        res.json(template);
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ error: 'Plantilla no encontrada' });
        }
        console.error('[DocumentTemplates] Update error:', error);
        res.status(500).json({ error: 'Error al actualizar plantilla de documento' });
    }
});
exports.default = router;
//# sourceMappingURL=document-templates.routes.js.map