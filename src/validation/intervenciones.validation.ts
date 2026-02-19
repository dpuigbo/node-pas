import { z } from 'zod';

export const createIntervencionSchema = z.object({
  clienteId: z.number().int().positive(),
  tipo: z.enum(['preventiva', 'correctiva']),
  titulo: z.string().min(1, 'El titulo es obligatorio').max(300),
  referencia: z.string().max(100).optional().nullable(),
  fechaInicio: z.string().datetime().optional().nullable(),
  fechaFin: z.string().datetime().optional().nullable(),
  notas: z.string().optional().nullable(),
  sistemaIds: z.array(z.number().int().positive()).optional().default([]),
});

export const updateIntervencionSchema = createIntervencionSchema.partial();

export const updateEstadoIntervencionSchema = z.object({
  estado: z.enum(['borrador', 'en_curso', 'completada', 'facturada']),
});

export type CreateIntervencionInput = z.infer<typeof createIntervencionSchema>;
export type UpdateIntervencionInput = z.infer<typeof updateIntervencionSchema>;
