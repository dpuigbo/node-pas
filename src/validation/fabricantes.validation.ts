import { z } from 'zod';

export const createFabricanteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  activo: z.boolean().optional().default(true),
  orden: z.number().int().optional().default(0),
});

export const updateFabricanteSchema = createFabricanteSchema.partial();

export type CreateFabricanteInput = z.infer<typeof createFabricanteSchema>;
export type UpdateFabricanteInput = z.infer<typeof updateFabricanteSchema>;
