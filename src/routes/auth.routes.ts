import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { authMiddleware, getAuthUser } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// Initiate Microsoft OAuth
router.get('/microsoft', (req: Request, res: Response, next: NextFunction) => {
  // Check strategy is registered (env vars might be missing after deploy)
  if (!(passport as any)._strategy('microsoft')) {
    res.status(503).json({
      error: 'Microsoft OAuth no configurado',
      hint: 'Las credenciales MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET no estan en .env del servidor. Recrear .env via SSH.',
      configured: {
        MICROSOFT_CLIENT_ID: !!env.MICROSOFT_CLIENT_ID,
        MICROSOFT_CLIENT_SECRET: !!env.MICROSOFT_CLIENT_SECRET,
        MICROSOFT_TENANT_ID: env.MICROSOFT_TENANT_ID || '(not set)',
        MICROSOFT_CALLBACK_URL: env.MICROSOFT_CALLBACK_URL,
      },
    });
    return;
  }
  passport.authenticate('microsoft', { session: false })(req, res, next);
});

// Microsoft OAuth callback (GET — Microsoft redirects with code in query string)
router.get('/microsoft/callback', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('microsoft', { session: false }, (err: any, user: any) => {
    if (err) {
      console.error('[Auth] Microsoft callback error:', err);
      res.redirect(`/login?error=${encodeURIComponent(err.message || 'auth_failed')}`);
      return;
    }
    if (!user) {
      res.redirect('/login?error=no_user');
      return;
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const redirectUrl = env.NODE_ENV === 'production' ? '/' : env.APP_URL;
    res.redirect(redirectUrl);
  })(req, res, next);
});

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
