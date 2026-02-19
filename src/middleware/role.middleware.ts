import { Request, Response, NextFunction } from 'express';
import { getAuthUser } from './auth.middleware';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!roles.includes(user.rol)) {
      res.status(403).json({ error: 'No tienes permisos para realizar esta accion' });
      return;
    }

    next();
  };
}
