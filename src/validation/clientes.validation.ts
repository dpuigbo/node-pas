import { z } from 'zod';

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
  horasTrayecto: z.number().min(0).optional().nullable(),
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
});

export const updateMaquinaSchema = createMaquinaSchema.partial();

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
export type CreateMaquinaInput = z.infer<typeof createMaquinaSchema>;
export type UpdateMaquinaInput = z.infer<typeof updateMaquinaSchema>;
