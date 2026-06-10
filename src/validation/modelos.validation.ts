import { z } from 'zod';

const tipoComponenteEnum = z.enum(['controller', 'mechanical_unit', 'drive_unit', 'external_axis']);

const idArray = z.array(z.number().int().positive());

export const createModeloSchema = z.object({
  fabricanteId: z.number().int().positive(),
  tipo: tipoComponenteEnum,
  familiaId: z.number().int().positive().optional().nullable(),
  generacionControladorId: z.number().int().positive().optional().nullable(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(191),
  typeVariant: z.string().max(50).optional().nullable(),
  notas: z.string().optional().nullable(),
  activa: z.boolean().optional(),
  // Flags de niveles aplicables (fuente de verdad, D-075)
  nivelN1: z.boolean().optional(),
  nivelN2Inf: z.boolean().optional(),
  nivelN2Sup: z.boolean().optional(),
  nivelN3: z.boolean().optional(),
  // Arrays JSON de IDs
  montajesDisponibles: idArray.optional().nullable(),
  proteccionesDisponibles: idArray.optional().nullable(),
  controladoresCompatibles: idArray.optional().nullable(),
  // Capacidades de controladora
  soportaMultimove: z.boolean().optional().nullable(),
  maxRobotsMultimove: z.number().int().optional().nullable(),
  maxEjesExternos: z.number().int().optional().nullable(),
  tipoBateriaMedida: z.enum(['smb', 'eib']).optional().nullable(),
});

export const updateModeloSchema = createModeloSchema.partial().omit({ fabricanteId: true });

export const updateCompatibilidadSchema = z.object({
  controladorIds: z.array(z.number().int().positive()),
});

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
