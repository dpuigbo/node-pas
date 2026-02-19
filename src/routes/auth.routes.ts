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

export default router;
