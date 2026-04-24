import { z } from 'zod';

const tipoComponenteEnum = z.enum(['controller', 'mechanical_unit', 'drive_unit', 'external_axis']);

export const createSistemaSchema = z.object({
  clienteId: z.number().int().positive(),
  maquinaId: z.number().int().positive().optional().nullable(),
  fabricanteId: z.number().int().positive(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  descripcion: z.string().max(500).optional().nullable(),
});

export const updateSistemaSchema = createSistemaSchema.partial();

export const createComponenteSchema = z.object({
  modeloComponenteId: z.number().int().positive(),
  tipo: tipoComponenteEnum,
  etiqueta: z.string().min(1, 'La etiqueta es obligatoria').max(100),
  numeroSerie: z.string().max(100).optional().nullable(),
  numEjes: z.number().int().positive().optional().nullable(),
  metadata: z.any().optional().nullable(),
  orden: z.number().int().optional().default(0),
});

export const updateComponenteSchema = createComponenteSchema.partial();

// Schema for the wizard: create sistema + all components atomically
const componenteWizardSchema = z.object({
  modeloComponenteId: z.number().int().positive(),
  tipo: tipoComponenteEnum,
  etiqueta: z.string().min(1).max(100),
  numeroSerie: z.string().max(100).optional().nullable(),
  numEjes: z.number().int().positive().optional().nullable(),
  orden: z.number().int().optional().default(0),
});

export const createSistemaCompletoSchema = z.object({
  clienteId: z.number().int().positive(),
  maquinaId: z.number().int().positive().optional().nullable(),
  fabricanteId: z.number().int().positive(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  descripcion: z.string().max(500).optional().nullable(),
  componentes: z.array(componenteWizardSchema).min(2, 'Mínimo controladora + robot'),
});

export type CreateSistemaCompletoInput = z.infer<typeof createSistemaCompletoSchema>;
export type CreateSistemaInput = z.infer<typeof createSistemaSchema>;
export type UpdateSistemaInput = z.infer<typeof updateSistemaSchema>;
export type CreateComponenteInput = z.infer<typeof createComponenteSchema>;
export type UpdateComponenteInput = z.infer<typeof updateComponenteSchema>;
