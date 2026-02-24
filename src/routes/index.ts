import { Router } from 'express';
import authRoutes from './auth.routes';
import { authMiddleware } from '../middleware/auth.middleware';
import dashboardRoutes from './dashboard.routes';
import fabricantesRoutes from './fabricantes.routes';
import clientesRoutes from './clientes.routes';
import modelosRoutes from './modelos.routes';
import sistemasRoutes from './sistemas.routes';
import intervencionesRoutes from './intervenciones.routes';
import catalogosRoutes from './catalogos.routes';
import informesRoutes from './informes.routes';
import documentTemplatesRoutes from './document-templates.routes';
import consumiblesNivelRoutes from './consumiblesNivel.routes';

const router = Router();

// Auth routes (public - no auth required)
router.use('/auth', authRoutes);

// All v1 routes require authentication
router.use('/v1/dashboard', authMiddleware, dashboardRoutes);
router.use('/v1/fabricantes', authMiddleware, fabricantesRoutes);
router.use('/v1/clientes', authMiddleware, clientesRoutes);
router.use('/v1/modelos', authMiddleware, modelosRoutes);
router.use('/v1/sistemas', authMiddleware, sistemasRoutes);
router.use('/v1/intervenciones', authMiddleware, intervencionesRoutes);
router.use('/v1/catalogos', authMiddleware, catalogosRoutes);
router.use('/v1', authMiddleware, informesRoutes);
router.use('/v1/document-templates', authMiddleware, documentTemplatesRoutes);
router.use('/v1/consumibles-nivel', authMiddleware, consumiblesNivelRoutes);

export default router;
