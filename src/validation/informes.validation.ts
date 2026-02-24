import { z } from 'zod';

export const updateEstadoInformeSchema = z.object({
  estado: z.enum(['inactivo', 'activo', 'finalizado']),
});

export const updateDatosComponenteSchema = z.object({
  datos: z.record(z.unknown()),
});
