import { z } from 'zod';

// v2.9: la tabla consumibles_nivel fue eliminada. Estas rutas editan ahora
// mantenimiento_horas_modelo (horas por modelo + nivel, D-073).
export const upsertHorasModeloSchema = z.object({
  modeloId: z.number().int().positive(),
  // Codigo canonico (N1, N2_INF, ...) - backend normaliza a nivelId
  nivel: z.string().min(1).max(20),
  horas: z.number().min(0).nullable().optional(),
  notas: z.string().max(500).nullable().optional(),
});

export const batchUpsertHorasSchema = z.array(upsertHorasModeloSchema);

export type UpsertHorasModeloInput = z.infer<typeof upsertHorasModeloSchema>;
