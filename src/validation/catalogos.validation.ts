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

// ConsumibleCatalogo (v2 unificado). Los campos legacy `compatibleCon` y
// `denominacion` se eliminaron al droppear la tabla `consumibles` (2026-04).
export const consumibleTipoEnum = z.enum([
  'aceite', 'grasa', 'bateria', 'filtro', 'ventilador', 'rodamiento',
  'sello', 'cable', 'ball_screw', 'tope_mecanico', 'tarjeta',
  'desiccant', 'limpieza', 'otro',
]);

export const createConsumibleSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  tipo: consumibleTipoEnum,
  subtipo: z.string().max(80).optional().nullable(),
  codigoAbb: z.string().max(80).optional().nullable(),
  fabricante: z.string().max(100).optional().nullable(),
  unidad: z.string().max(20).optional().nullable(),
  refOriginal: z.string().max(100).optional().nullable(),
  refProveedor: z.string().max(100).optional().nullable(),
  proveedor: z.string().max(100).optional().nullable(),
  fabricanteRobot: z.string().max(100).optional().nullable(),
  coste: z.number().positive().optional().nullable(),
  precio: z.number().positive().optional().nullable(),
  notas: z.string().optional().nullable(),
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
