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
  // Codigo canonico (N1, N2_INF, ...) o legacy (1, 2_inferior, ...) - backend normaliza a nivelId
  nivel: z.string().min(1).max(20),
  horas: z.number().min(0).optional().nullable(),
  precioOtros: z.number().min(0).optional().nullable(),
  consumibles: z.array(consumibleItemSchema).optional().nullable(),
});

export const batchUpsertSchema = z.array(upsertConsumibleNivelSchema);

export type UpsertConsumibleNivelInput = z.infer<typeof upsertConsumibleNivelSchema>;
