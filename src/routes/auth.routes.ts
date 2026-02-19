import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { authMiddleware, getAuthUser } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// Initiate Microsoft OAuth
router.get(
  '/microsoft',
  passport.authenticate('microsoft', { session: false }),
);

// Microsoft OAuth callback
router.post(
  '/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const redirectUrl = env.NODE_ENV === 'production' ? '/' : env.APP_URL;
    res.redirect(redirectUrl);
  },
);

// Get current user
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: getAuthUser(req) });
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Sesion cerrada' });
});

// DEV: Auto-login as admin (creates user if not exists, sets JWT cookie)
// Step 1: /api/auth/dev-login -> creates user + sets cookie + shows debug
// Step 2: navigate to / to see the app
router.get('/dev-login', async (_req: Request, res: Response) => {
  try {
    const user = await prisma.user.upsert({
      where: { microsoftId: 'dev-admin' },
      update: {},
      create: {
        microsoftId: 'dev-admin',
        email: 'admin@pasrobotics.com',
        nombre: 'Admin Dev',
        rol: 'admin',
      },
    });
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      message: 'Login OK. Cookie seteada. Navega a / para ver la app.',
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      env_node_env: env.NODE_ENV,
      jwt_secret_length: env.JWT_SECRET?.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en dev-login', details: String(error) });
  }
});

export default router;
