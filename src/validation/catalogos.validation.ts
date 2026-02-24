import { z } from 'zod';

export const createAceiteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  fabricante: z.string().max(200).optional().nullable(),
  unidad: z.string().max(50).optional().nullable(),
  fabricanteRobot: z.string().max(500).optional().nullable(), // CSV: "ABB,KUKA"
  coste: z.number().positive().optional().nullable(),
  precio: z.number().positive().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const updateAceiteSchema = createAceiteSchema.partial();

export const createConsumibleSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  fabricante: z.string().max(200).optional().nullable(),
  tipo: z.string().max(50).optional().default('general'),
  compatibleCon: z.string().max(50).optional().nullable(),
  refOriginal: z.string().max(200).optional().nullable(),
  refProveedor: z.string().max(200).optional().nullable(),
  denominacion: z.string().max(200).optional().nullable(),
  fabricanteRobot: z.string().max(200).optional().nullable(),
  coste: z.number().positive().optional().nullable(),
  precio: z.number().positive().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const updateConsumibleSchema = createConsumibleSchema.partial();

export const updateConfigSchema = z.object({
  clave: z.string().min(1),
  valor: z.string(),
});

export const batchConfigSchema = z.array(updateConfigSchema);

export type CreateAceiteInput = z.infer<typeof createAceiteSchema>;
export type UpdateAceiteInput = z.infer<typeof updateAceiteSchema>;
export type CreateConsumibleInput = z.infer<typeof createConsumibleSchema>;
export type UpdateConsumibleInput = z.infer<typeof updateConsumibleSchema>;
