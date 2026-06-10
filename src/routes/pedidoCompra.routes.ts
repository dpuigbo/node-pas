import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import { updatePedidoCompraSchema, updateEstadoPedidoSchema } from '../validation/pedidoCompra.validation';
import { getConsumiblesPlan, nivelEfectivoParaTipo } from '../lib/planMantenimiento';

const router = Router();

interface LineaPedido {
  tipo: string;
  itemId: number;
  codigoInterno?: string | null;
  nombre: string;
  cantidad: number;
  unidad: string | null;
  coste: number | null;
  precio: number | null;
  sistemaId: number;
  sistemaNombre: string;
  componenteTipo: string;
  modeloNombre: string;
  nivel: string;
  origen?: string;
  detalle?: string;
}

// POST /api/v1/pedidos-compra/generar/:intervencionId (admin)
// Generates purchase order from intervention's systems + niveles + ConsumibleNivel data
router.post('/generar/:intervencionId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intervencionId = Number(req.params.intervencionId);

    // Check if pedido already exists
    const existing = await prisma.pedidoCompra.findUnique({
      where: { intervencionId },
    });
    if (existing) {
      res.status(400).json({ error: 'Ya existe un pedido de compra para esta intervencion. Eliminalo primero si quieres regenerar.' });
      return;
    }

    // Get intervention with systems + niveles
    const intervencion = await prisma.intervencion.findUnique({
      where: { id: intervencionId },
      include: {
        sistemas: {
          include: {
            nivel: { select: { codigo: true } },
            sistema: {
              include: {
                componentes: {
                  include: {
                    modeloComponente: { select: { id: true, nombre: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!intervencion) {
      res.status(404).json({ error: 'Intervencion no encontrada' });
      return;
    }

    if (intervencion.sistemas.length === 0) {
      res.status(400).json({ error: 'La intervencion no tiene sistemas asignados' });
      return;
    }

    // Build lines v2.9: lubricacion + consumibles de actividades por
    // (modelo, nivel efectivo) de cada componente del sistema.
    const lineas: LineaPedido[] = [];

    for (const intSistema of intervencion.sistemas) {
      const sistema = intSistema.sistema;
      const nivel = intSistema.nivel?.codigo ?? null;
      if (!nivel) continue; // sistema sin nivel asignado, no genera lineas

      const ctrl = sistema.componentes.find((c) => c.tipo === 'controller');

      for (const comp of sistema.componentes) {
        const nivelEfectivo = nivelEfectivoParaTipo(comp.tipo, nivel);
        if (!nivelEfectivo) continue;
        const items = await getConsumiblesPlan(comp.modeloComponenteId, nivelEfectivo, {
          controladorId: ctrl?.modeloComponenteId ?? null,
        });
        for (const item of items) {
          lineas.push({
            tipo: item.tipo,
            itemId: item.consumibleId,
            codigoInterno: item.codigoInterno,
            nombre: item.nombre,
            cantidad: item.cantidad,
            unidad: item.unidad,
            coste: item.coste,
            precio: item.precio,
            sistemaId: sistema.id,
            sistemaNombre: sistema.nombre,
            componenteTipo: comp.tipo,
            modeloNombre: comp.modeloComponente.nombre,
            nivel: nivelEfectivo,
            origen: item.origen,
            detalle: item.detalle,
          });
        }
      }
    }

    // Calculate totals
    let totalCoste = 0;
    let totalPrecio = 0;
    for (const l of lineas) {
      if (l.coste != null) totalCoste += l.coste * l.cantidad;
      if (l.precio != null) totalPrecio += l.precio * l.cantidad;
    }

    // Create pedido
    const pedido = await prisma.pedidoCompra.create({
      data: {
        intervencionId,
        lineas: lineas as unknown as import('@prisma/client').Prisma.InputJsonValue,
        totalCoste: totalCoste || null,
        totalPrecio: totalPrecio || null,
      },
    });

    res.status(201).json(pedido);
  } catch (err) { next(err); }
});

// GET /api/v1/pedidos-compra/intervencion/:intervencionId
router.get('/intervencion/:intervencionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intervencionId = Number(req.params.intervencionId);
    const pedido = await prisma.pedidoCompra.findUnique({
      where: { intervencionId },
    });
    if (!pedido) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }
    res.json(pedido);
  } catch (err) { next(err); }
});

// PUT /api/v1/pedidos-compra/:id (admin)
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const data = updatePedidoCompraSchema.parse(req.body);

    const updateData: any = {};
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.lineas !== undefined) {
      updateData.lineas = data.lineas;
      // Recalculate totals
      let totalCoste = 0;
      let totalPrecio = 0;
      for (const l of data.lineas) {
        if (l.coste != null) totalCoste += l.coste * l.cantidad;
        if (l.precio != null) totalPrecio += l.precio * l.cantidad;
      }
      updateData.totalCoste = totalCoste || null;
      updateData.totalPrecio = totalPrecio || null;
    }

    const pedido = await prisma.pedidoCompra.update({
      where: { id },
      data: updateData,
    });
    res.json(pedido);
  } catch (err) { next(err); }
});

// PATCH /api/v1/pedidos-compra/:id/estado (admin)
router.patch('/:id/estado', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = updateEstadoPedidoSchema.parse(req.body);
    const pedido = await prisma.pedidoCompra.update({
      where: { id: Number(req.params.id) },
      data: { estado },
    });
    res.json(pedido);
  } catch (err) { next(err); }
});

// DELETE /api/v1/pedidos-compra/:id (admin)
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.pedidoCompra.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Pedido eliminado' });
  } catch (err) { next(err); }
});

export default router;
