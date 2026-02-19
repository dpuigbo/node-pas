import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';

export interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, nombre: true, rol: true },
    });

    if (!user || !user.rol) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    req.user = user as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalido' });
  }
}
