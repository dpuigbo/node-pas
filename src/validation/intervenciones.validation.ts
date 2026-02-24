import { z } from 'zod';

const sistemaNivelSchema = z.object({
  sistemaId: z.number().int().positive(),
  nivel: z.enum(['1', '2_inferior', '2_superior', '3']).default('1'),
});

export const createIntervencionSchema = z.object({
  clienteId: z.number().int().positive(),
  tipo: z.enum(['preventiva', 'correctiva']),
  titulo: z.string().min(1, 'El titulo es obligatorio').max(300),
  referencia: z.string().max(100).optional().nullable(),
  fechaInicio: z.string().datetime().optional().nullable(),
  fechaFin: z.string().datetime().optional().nullable(),
  notas: z.string().optional().nullable(),
  // Tarifas (snapshot del cliente)
  tarifaHoraTrabajo: z.number().min(0).optional().nullable(),
  tarifaHoraViaje: z.number().min(0).optional().nullable(),
  dietas: z.number().min(0).optional().nullable(),
  gestionAccesos: z.number().min(0).optional().nullable(),
  // Logistica viaje (snapshot del cliente)
  horasTrayecto: z.number().min(0).optional().nullable(),
  diasViaje: z.number().min(0).optional().nullable(),
  km: z.number().min(0).optional().nullable(),
  peajes: z.number().min(0).optional().nullable(),
  precioHotel: z.number().min(0).optional().nullable(),
  precioKm: z.number().min(0).optional().nullable(),
  // Campos especificos de intervencion
  gestionAccesosNueva: z.boolean().optional().default(false),
  numeroTecnicos: z.number().int().min(1).optional().default(1),
  viajesIdaVuelta: z.number().int().min(1).optional().default(1),
  incluyeConsumibles: z.boolean().optional().default(true),
  horasDia: z.number().min(0).optional().nullable(),
  dietasExtra: z.number().min(0).optional().nullable(),
  diasTrabajo: z.string().max(50).optional().nullable(),
  // Legacy: array of ids (nivel defaults to '1')
  sistemaIds: z.array(z.number().int().positive()).optional().default([]),
  // New: array of { sistemaId, nivel }
  sistemas: z.array(sistemaNivelSchema).optional().default([]),
});

export const updateIntervencionSchema = createIntervencionSchema.partial();

export const updateEstadoIntervencionSchema = z.object({
  estado: z.enum(['borrador', 'en_curso', 'completada', 'facturada']),
});

export type CreateIntervencionInput = z.infer<typeof createIntervencionSchema>;
export type UpdateIntervencionInput = z.infer<typeof updateIntervencionSchema>;
