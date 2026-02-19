import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { authMiddleware, getAuthUser } from '../middleware/auth.middleware';

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
// Access /api/auth/dev-login in browser to get authenticated
router.get('/dev-login', async (_req: Request, res: Response) => {
  try {
    const { prisma } = await import('../config/database');
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
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ error: 'Error en dev-login', details: String(error) });
  }
});

export default router;
