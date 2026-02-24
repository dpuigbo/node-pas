import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import { updatePedidoCompraSchema, updateEstadoPedidoSchema } from '../validation/pedidoCompra.validation';

const router = Router();

interface ConsumibleItem {
  tipo: 'aceite' | 'bateria' | 'consumible';
  id: number;
  cantidad: number;
}

interface LineaPedido {
  tipo: string;
  itemId: number;
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
}

/** Helper: convert Decimal | null to number | null */
function dec(v: any): number | null {
  if (v == null) return null;
  return Number(v);
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
            sistema: {
              include: {
                componentes: {
                  include: {
                    modeloComponente: {
                      include: {
                        consumiblesNivel: true,
                      },
                    },
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

    // Collect all aceite IDs and consumible IDs we need to resolve
    const aceiteIds = new Set<number>();
    const consumibleIds = new Set<number>();

    // Build detailed lines
    const lineas: LineaPedido[] = [];

    for (const intSistema of intervencion.sistemas) {
      const sistema = intSistema.sistema;
      const nivel = intSistema.nivel;

      for (const comp of sistema.componentes) {
        const modelo = comp.modeloComponente;
        // Find ConsumibleNivel for this modelo + nivel
        const cn = modelo.consumiblesNivel.find((c) => c.nivel === nivel);
        if (!cn || !cn.consumibles) continue;

        const items = cn.consumibles as unknown as ConsumibleItem[];
        for (const item of items) {
          if (item.id <= 0) continue; // skip unselected items
          if (item.tipo === 'aceite') {
            aceiteIds.add(item.id);
          } else {
            consumibleIds.add(item.id);
          }
          lineas.push({
            tipo: item.tipo,
            itemId: item.id,
            nombre: '', // will be resolved below
            cantidad: item.cantidad,
            unidad: null,
            coste: null,
            precio: null,
            sistemaId: sistema.id,
            sistemaNombre: sistema.nombre,
            componenteTipo: comp.tipo,
            modeloNombre: modelo.nombre,
            nivel,
          });
        }
      }
    }

    // Resolve aceite and consumible names/prices
    const aceiteMap = new Map<number, { nombre: string; unidad: string | null; coste: number | null; precio: number | null }>();
    const consumibleMap = new Map<number, { nombre: string; coste: number | null; precio: number | null }>();

    if (aceiteIds.size > 0) {
      const aceites = await prisma.aceite.findMany({
        where: { id: { in: Array.from(aceiteIds) } },
      });
      for (const a of aceites) {
        aceiteMap.set(a.id, {
          nombre: a.nombre,
          unidad: a.unidad,
          coste: dec(a.coste),
          precio: dec(a.precio),
        });
      }
    }

    if (consumibleIds.size > 0) {
      const consumibles = await prisma.consumible.findMany({
        where: { id: { in: Array.from(consumibleIds) } },
      });
      for (const c of consumibles) {
        consumibleMap.set(c.id, {
          nombre: c.nombre,
          coste: dec(c.coste),
          precio: dec(c.precio),
        });
      }
    }

    // Fill in names and prices
    for (const linea of lineas) {
      if (linea.tipo === 'aceite') {
        const info = aceiteMap.get(linea.itemId);
        if (info) {
          linea.nombre = info.nombre;
          linea.unidad = info.unidad;
          linea.coste = info.coste;
          linea.precio = info.precio;
        } else {
          linea.nombre = `Aceite #${linea.itemId} (no encontrado)`;
        }
      } else {
        const info = consumibleMap.get(linea.itemId);
        if (info) {
          linea.nombre = info.nombre;
          linea.coste = info.coste;
          linea.precio = info.precio;
        } else {
          linea.nombre = `Consumible #${linea.itemId} (no encontrado)`;
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
