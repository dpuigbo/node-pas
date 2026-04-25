import { z } from 'zod';

// Formato v2: usa consumibleId del catalogo unificado
const consumibleItemV2Schema = z.object({
  consumibleId: z.number().int().positive(),
  cantidad: z.number().positive(),
});

// Formato legacy: tipo + id (aceites/consumibles tables)
const consumibleItemLegacySchema = z.object({
  tipo: z.enum(['aceite', 'bateria', 'consumible']),
  id: z.number().int().positive(),
  cantidad: z.number().positive(),
});

const consumibleItemSchema = z.union([consumibleItemV2Schema, consumibleItemLegacySchema]);

export const upsertConsumibleNivelSchema = z.object({
  modeloId: z.number().int().positive(),
  nivel: z.enum(['1', '2', '2_inferior', '2_superior', '3']),
  horas: z.number().min(0).optional().nullable(),
  precioOtros: z.number().min(0).optional().nullable(),
  consumibles: z.array(consumibleItemSchema).optional().nullable(),
});

export const batchUpsertSchema = z.array(upsertConsumibleNivelSchema);

export type UpsertConsumibleNivelInput = z.infer<typeof upsertConsumibleNivelSchema>;
