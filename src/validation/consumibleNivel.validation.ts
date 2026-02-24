import { z } from 'zod';

const consumibleItemSchema = z.object({
  tipo: z.enum(['aceite', 'bateria', 'consumible']),
  id: z.number().int().positive(),
  cantidad: z.number().positive(),
});

export const upsertConsumibleNivelSchema = z.object({
  modeloId: z.number().int().positive(),
  nivel: z.enum(['1', '2_inferior', '2_superior', '3']),
  horas: z.number().min(0).optional().nullable(),
  precioOtros: z.number().min(0).optional().nullable(),
  consumibles: z.array(consumibleItemSchema).optional().nullable(),
});

export const batchUpsertSchema = z.array(upsertConsumibleNivelSchema);

export type UpsertConsumibleNivelInput = z.infer<typeof upsertConsumibleNivelSchema>;
