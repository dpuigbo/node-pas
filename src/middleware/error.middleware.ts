import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message);

  if (err.name === 'ZodError') {
    res.status(400).json({ error: 'Datos invalidos', details: err });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(409).json({ error: 'Error de base de datos', message: err.message });
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}
