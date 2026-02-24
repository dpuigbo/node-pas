import { z } from 'zod';

const tipoComponenteEnum = z.enum(['controller', 'mechanical_unit', 'drive_unit', 'external_axis']);

export const createModeloSchema = z.object({
  fabricanteId: z.number().int().positive(),
  tipo: tipoComponenteEnum,
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  notas: z.string().optional().nullable(),
  aceitesConfig: z.any().optional().nullable(),
  niveles: z.string().max(100).optional().nullable(), // CSV: "1,2_inferior,2_superior,3"
});

export const updateModeloSchema = createModeloSchema.partial().omit({ fabricanteId: true });

export const createVersionSchema = z.object({
  schema: z.any().default({ pageConfig: {}, blocks: [] }),
  notas: z.string().optional().nullable(),
});

export const updateVersionSchema = z.object({
  schema: z.any().optional(),
  notas: z.string().optional().nullable(),
});

export const activateVersionSchema = z.object({
  estado: z.enum(['borrador', 'activo', 'obsoleto']),
});

export type CreateModeloInput = z.infer<typeof createModeloSchema>;
export type UpdateModeloInput = z.infer<typeof updateModeloSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;
