import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Auth routes (no prefix - /api/auth/*)
router.use('/auth', authRoutes);

// API v1 routes (will be added as we build CRUD endpoints)
// router.use('/v1/clientes', authMiddleware, clientesRoutes);
// router.use('/v1/fabricantes', authMiddleware, fabricantesRoutes);
// router.use('/v1/modelos', authMiddleware, modelosRoutes);
// etc.

// Placeholder v1 route
router.get('/v1', (_req, res) => {
  res.json({ message: 'PAS Robotics Manage API v1', version: '1.0.0' });
});

export default router;
