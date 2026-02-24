import { z } from 'zod';

export const lineaPedidoSchema = z.object({
  tipo: z.enum(['aceite', 'bateria', 'consumible']),
  itemId: z.number().int(),
  nombre: z.string(),
  cantidad: z.number().min(0),
  unidad: z.string().nullable().optional(),
  coste: z.number().nullable().optional(),
  precio: z.number().nullable().optional(),
  sistemaId: z.number().int().optional(),
  sistemaNombre: z.string().optional(),
  componenteTipo: z.string().optional(),
  modeloNombre: z.string().optional(),
  nivel: z.string().optional(),
});

export const updatePedidoCompraSchema = z.object({
  estado: z.enum(['pendiente', 'pedido', 'recibido']).optional(),
  notas: z.string().nullable().optional(),
  lineas: z.array(lineaPedidoSchema).optional(),
});

export const updateEstadoPedidoSchema = z.object({
  estado: z.enum(['pendiente', 'pedido', 'recibido']),
});
