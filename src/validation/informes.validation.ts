import { z } from 'zod';

export const updateEstadoInformeSchema = z.object({
  estado: z.enum(['borrador', 'finalizado', 'entregado']),
});

export const updateDatosComponenteSchema = z.object({
  datos: z.record(z.unknown()),
});
