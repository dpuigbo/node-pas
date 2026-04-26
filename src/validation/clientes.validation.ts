import { z } from 'zod';

// Redondea horas al ceil del multiplo de 0.5h
// (50 min = 0.83h → 1.0h, 9:37h = 9.62h → 10h, 9:30h = 9.5h → 9.5h)
function ceilHalfHour(h: number): number {
  return Math.ceil(h * 2) / 2;
}

const horasTrayectoTransformer = z.number().min(0).transform(ceilHalfHour);

export const createClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  sede: z.string().max(200).optional().nullable(),
  direccion: z.string().max(500).optional().nullable(),
  ciudad: z.string().max(200).optional().nullable(),
  codigoPostal: z.string().max(20).optional().nullable(),
  provincia: z.string().max(200).optional().nullable(),
  telefono: z.string().max(50).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  personaContacto: z.string().max(200).optional().nullable(),
  logo: z.string().max(500).optional().nullable(),
  tarifaHoraTrabajo: z.number().min(0).optional().nullable(),
  tarifaHoraViaje: z.number().min(0).optional().nullable(),
  dietas: z.number().min(0).optional().nullable(),
  gestionAccesos: z.number().min(0).optional().nullable(),
  horasTrayecto: horasTrayectoTransformer.optional().nullable(),
  diasViaje: z.number().min(0).optional().nullable(),
  km: z.number().min(0).optional().nullable(),
  peajes: z.number().min(0).optional().nullable(),
  precioHotel: z.number().min(0).optional().nullable(),
  precioKm: z.number().min(0).optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const updateClienteSchema = createClienteSchema.partial();

export const createMaquinaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  descripcion: z.string().max(500).optional().nullable(),
  plantaId: z.number().int().positive(),
});

export const updateMaquinaSchema = createMaquinaSchema.partial();

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
export type CreateMaquinaInput = z.infer<typeof createMaquinaSchema>;
export type UpdateMaquinaInput = z.infer<typeof updateMaquinaSchema>;
