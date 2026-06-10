import { z } from 'zod';

// ConsumibleCatalogo (v2.9 unificado). La tabla `aceites` fue eliminada;
// aceites y grasas viven en consumible_catalogo con tipo='aceite'|'grasa'.
export const consumibleTipoEnum = z.enum([
  'aceite', 'grasa', 'bateria', 'filtro', 'ventilador', 'rodamiento',
  'sello', 'cable', 'ball_screw', 'tope_mecanico', 'tarjeta',
  'desiccant', 'limpieza', 'otro',
]);

export const createConsumibleSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  tipo: consumibleTipoEnum,
  subtipo: z.string().max(80).optional().nullable(),
  codigoInterno: z.string().max(20).optional().nullable(),
  codigoFabricante: z.string().max(80).optional().nullable(),
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

export type CreateConsumibleInput = z.infer<typeof createConsumibleSchema>;
export type UpdateConsumibleInput = z.infer<typeof updateConsumibleSchema>;
