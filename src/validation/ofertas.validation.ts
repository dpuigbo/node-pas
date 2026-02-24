import { z } from 'zod';

const ofertaSistemaSchema = z.object({
  sistemaId: z.number().int().positive(),
  nivel: z.enum(['1', '2_inferior', '2_superior', '3']).default('1'),
});

export const createOfertaSchema = z.object({
  clienteId: z.number().int().positive(),
  titulo: z.string().min(1, 'El titulo es obligatorio').max(300),
  referencia: z.string().max(100).optional().nullable(),
  tipo: z.enum(['preventiva', 'correctiva']),
  validezDias: z.number().int().min(1).default(30),
  notas: z.string().optional().nullable(),
  sistemas: z.array(ofertaSistemaSchema).min(1, 'Debe incluir al menos un sistema'),
});

export const updateOfertaSchema = z.object({
  titulo: z.string().min(1).max(300).optional(),
  referencia: z.string().max(100).optional().nullable(),
  tipo: z.enum(['preventiva', 'correctiva']).optional(),
  validezDias: z.number().int().min(1).optional(),
  notas: z.string().optional().nullable(),
  sistemas: z.array(ofertaSistemaSchema).optional(),
});

export const updateEstadoOfertaSchema = z.object({
  estado: z.enum(['borrador', 'enviada', 'aprobada', 'rechazada']),
});

export const generarIntervencionSchema = z.object({
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime(),
});

export type CreateOfertaInput = z.infer<typeof createOfertaSchema>;
export type UpdateOfertaInput = z.infer<typeof updateOfertaSchema>;
