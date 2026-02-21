import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /v1/document-templates — list all document templates
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.documentTemplate.findMany({
      orderBy: { tipo: 'asc' },
    });
    res.json(templates);
  } catch (error) {
    console.error('[DocumentTemplates] List error:', error);
    res.status(500).json({ error: 'Error al obtener plantillas de documento' });
  }
});

// GET /v1/document-templates/:id — get single template with schema
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const template = await prisma.documentTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    res.json(template);
  } catch (error) {
    console.error('[DocumentTemplates] Get error:', error);
    res.status(500).json({ error: 'Error al obtener plantilla de documento' });
  }
});

// PUT /v1/document-templates/:id — update template schema (admin only)
router.put('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { schema, nombre } = req.body;

    const updateData: Record<string, unknown> = {};
    if (schema !== undefined) updateData.schema = schema;
    if (nombre !== undefined) updateData.nombre = nombre;

    const template = await prisma.documentTemplate.update({
      where: { id },
      data: updateData,
    });
    res.json(template);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    console.error('[DocumentTemplates] Update error:', error);
    res.status(500).json({ error: 'Error al actualizar plantilla de documento' });
  }
});

export default router;
