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

    (req as any).authUser = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalido' });
  }
}

export function getAuthUser(req: Request): AuthUser {
  return (req as any).authUser;
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user || user.rol !== 'admin') {
    res.status(403).json({ error: 'Se requieren permisos de administrador' });
    return;
  }
  next();
}
