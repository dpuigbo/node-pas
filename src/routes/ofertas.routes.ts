import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createOfertaSchema,
  updateOfertaSchema,
  updateEstadoOfertaSchema,
  generarIntervencionSchema,
} from '../validation/ofertas.validation';

const router = Router();

/** Helper: convert Decimal | null to number | null */
function dec(v: any): number | null {
  if (v == null) return null;
  return Number(v);
}

interface ConsumibleItem {
  tipo: 'aceite' | 'bateria' | 'consumible';
  id: number;
  cantidad: number;
}

/**
 * Calculate totals for an oferta's sistemas based on ConsumibleNivel data.
 * Returns per-system costs and overall totals.
 */
async function calculateOfertaTotals(
  sistemas: { sistemaId: number; nivel: string }[]
): Promise<{
  sistemaTotals: Map<number, { horas: number; coste: number; precio: number }>;
  totalHoras: number;
  totalCoste: number;
  totalPrecio: number;
}> {
  const sistemaTotals = new Map<number, { horas: number; coste: number; precio: number }>();
  let totalHoras = 0;
  let totalCoste = 0;
  let totalPrecio = 0;

  // Batch load all systems with their components and consumibles-nivel
  const sistemaIds = sistemas.map((s) => s.sistemaId);
  const sistemasDb = await prisma.sistema.findMany({
    where: { id: { in: sistemaIds } },
    include: {
      componentes: {
        include: {
          modeloComponente: {
            include: { consumiblesNivel: true },
          },
        },
      },
    },
  });

  const sistemaMap = new Map(sistemasDb.map((s) => [s.id, s]));

  // Collect all aceite/consumible IDs needed for price lookup
  const aceiteIds = new Set<number>();
  const consumibleIds = new Set<number>();

  for (const { sistemaId, nivel } of sistemas) {
    const sistema = sistemaMap.get(sistemaId);
    if (!sistema) continue;

    for (const comp of sistema.componentes) {
      const cn = comp.modeloComponente.consumiblesNivel.find((c) => c.nivel === nivel);
      if (!cn?.consumibles) continue;
      const items = cn.consumibles as unknown as ConsumibleItem[];
      for (const item of items) {
        if (item.id <= 0) continue;
        if (item.tipo === 'aceite') aceiteIds.add(item.id);
        else consumibleIds.add(item.id);
      }
    }
  }

  // Load prices
  const aceiteMap = new Map<number, { coste: number | null; precio: number | null }>();
  const consumibleMap = new Map<number, { coste: number | null; precio: number | null }>();

  if (aceiteIds.size > 0) {
    const aceites = await prisma.aceite.findMany({ where: { id: { in: Array.from(aceiteIds) } } });
    for (const a of aceites) aceiteMap.set(a.id, { coste: dec(a.coste), precio: dec(a.precio) });
  }
  if (consumibleIds.size > 0) {
    const consumibles = await prisma.consumible.findMany({ where: { id: { in: Array.from(consumibleIds) } } });
    for (const c of consumibles) consumibleMap.set(c.id, { coste: dec(c.coste), precio: dec(c.precio) });
  }

  // Calculate per system
  for (const { sistemaId, nivel } of sistemas) {
    const sistema = sistemaMap.get(sistemaId);
    if (!sistema) continue;

    let sysHoras = 0;
    let sysCoste = 0;
    let sysPrecio = 0;

    for (const comp of sistema.componentes) {
      const cn = comp.modeloComponente.consumiblesNivel.find((c) => c.nivel === nivel);
      if (!cn) continue;

      // Add hours
      sysHoras += dec(cn.horas) ?? 0;
      // Add precioOtros
      sysCoste += dec(cn.precioOtros) ?? 0;
      sysPrecio += dec(cn.precioOtros) ?? 0;

      // Add consumibles costs
      if (cn.consumibles) {
        const items = cn.consumibles as unknown as ConsumibleItem[];
        for (const item of items) {
          if (item.id <= 0) continue;
          const priceInfo = item.tipo === 'aceite'
            ? aceiteMap.get(item.id)
            : consumibleMap.get(item.id);
          if (priceInfo) {
            sysCoste += (priceInfo.coste ?? 0) * item.cantidad;
            sysPrecio += (priceInfo.precio ?? 0) * item.cantidad;
          }
        }
      }
    }

    sistemaTotals.set(sistemaId, { horas: sysHoras, coste: sysCoste, precio: sysPrecio });
    totalHoras += sysHoras;
    totalCoste += sysCoste;
    totalPrecio += sysPrecio;
  }

  return { sistemaTotals, totalHoras, totalCoste, totalPrecio };
}

// GET /api/v1/ofertas
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.clienteId) where.clienteId = Number(req.query.clienteId);
    if (req.query.estado) where.estado = req.query.estado;

    const ofertas = await prisma.oferta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: {
          include: {
            sistema: { select: { id: true, nombre: true } },
          },
        },
      },
    });
    res.json(ofertas);
  } catch (err) { next(err); }
});

// GET /api/v1/ofertas/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oferta = await prisma.oferta.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        cliente: { select: { id: true, nombre: true, sede: true, tarifaHoraTrabajo: true } },
        sistemas: {
          include: {
            sistema: {
              select: {
                id: true,
                nombre: true,
                fabricante: { select: { id: true, nombre: true } },
                componentes: {
                  orderBy: { orden: 'asc' },
                  select: { id: true, etiqueta: true, tipo: true, modeloComponente: { select: { id: true, nombre: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!oferta) {
      res.status(404).json({ error: 'Oferta no encontrada' });
      return;
    }
    res.json(oferta);
  } catch (err) { next(err); }
});

// POST /api/v1/ofertas (admin)
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createOfertaSchema.parse(req.body);

    // Calculate totals
    const { sistemaTotals, totalHoras, totalCoste, totalPrecio } =
      await calculateOfertaTotals(data.sistemas);

    const oferta = await prisma.oferta.create({
      data: {
        clienteId: data.clienteId,
        titulo: data.titulo,
        referencia: data.referencia ?? null,
        tipo: data.tipo,
        validezDias: data.validezDias,
        notas: data.notas ?? null,
        totalHoras: totalHoras || null,
        totalCoste: totalCoste || null,
        totalPrecio: totalPrecio || null,
        sistemas: {
          create: data.sistemas.map((s) => {
            const totals = sistemaTotals.get(s.sistemaId);
            return {
              sistemaId: s.sistemaId,
              nivel: s.nivel,
              horas: totals?.horas ?? null,
              costeConsumibles: totals?.coste ?? null,
              precioConsumibles: totals?.precio ?? null,
            };
          }),
        },
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: {
          include: {
            sistema: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    res.status(201).json(oferta);
  } catch (err) { next(err); }
});

// PUT /api/v1/ofertas/:id (admin)
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const data = updateOfertaSchema.parse(req.body);

    // Check oferta exists and is in borrador
    const existing = await prisma.oferta.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Oferta no encontrada' });
      return;
    }
    if (existing.estado !== 'borrador') {
      res.status(400).json({ error: 'Solo se pueden editar ofertas en estado borrador' });
      return;
    }

    const updateData: any = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.referencia !== undefined) updateData.referencia = data.referencia;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.validezDias !== undefined) updateData.validezDias = data.validezDias;
    if (data.notas !== undefined) updateData.notas = data.notas;

    if (data.sistemas) {
      // Recalculate totals
      const { sistemaTotals, totalHoras, totalCoste, totalPrecio } =
        await calculateOfertaTotals(data.sistemas);

      updateData.totalHoras = totalHoras || null;
      updateData.totalCoste = totalCoste || null;
      updateData.totalPrecio = totalPrecio || null;

      // Replace junction rows
      await prisma.$transaction([
        prisma.ofertaSistema.deleteMany({ where: { ofertaId: id } }),
        prisma.oferta.update({
          where: { id },
          data: {
            ...updateData,
            sistemas: {
              create: data.sistemas.map((s) => {
                const totals = sistemaTotals.get(s.sistemaId);
                return {
                  sistemaId: s.sistemaId,
                  nivel: s.nivel,
                  horas: totals?.horas ?? null,
                  costeConsumibles: totals?.coste ?? null,
                  precioConsumibles: totals?.precio ?? null,
                };
              }),
            },
          },
        }),
      ]);
    } else {
      await prisma.oferta.update({ where: { id }, data: updateData });
    }

    const oferta = await prisma.oferta.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: {
          include: {
            sistema: { select: { id: true, nombre: true } },
          },
        },
      },
    });
    res.json(oferta);
  } catch (err) { next(err); }
});

// PATCH /api/v1/ofertas/:id/estado (admin)
router.patch('/:id/estado', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = updateEstadoOfertaSchema.parse(req.body);
    const oferta = await prisma.oferta.update({
      where: { id: Number(req.params.id) },
      data: { estado },
    });
    res.json(oferta);
  } catch (err) { next(err); }
});

// POST /api/v1/ofertas/:id/generar-intervencion (admin)
// Generates an intervention from an approved oferta with specified dates
router.post('/:id/generar-intervencion', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ofertaId = Number(req.params.id);
    const { fechaInicio, fechaFin } = generarIntervencionSchema.parse(req.body);

    const oferta = await prisma.oferta.findUnique({
      where: { id: ofertaId },
      include: {
        sistemas: true,
      },
    });

    if (!oferta) {
      res.status(404).json({ error: 'Oferta no encontrada' });
      return;
    }

    if (oferta.estado !== 'aprobada') {
      res.status(400).json({ error: 'Solo se puede generar intervencion de ofertas aprobadas' });
      return;
    }

    // Create intervencion with sistemas from oferta
    const intervencion = await prisma.intervencion.create({
      data: {
        clienteId: oferta.clienteId,
        ofertaId: oferta.id,
        tipo: oferta.tipo,
        titulo: oferta.titulo,
        referencia: oferta.referencia,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        notas: oferta.notas,
        estado: 'borrador',
        sistemas: {
          create: oferta.sistemas.map((s) => ({
            sistemaId: s.sistemaId,
            nivel: s.nivel,
          })),
        },
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: {
          include: {
            sistema: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    res.status(201).json(intervencion);
  } catch (err) { next(err); }
});

// POST /api/v1/ofertas/:id/recalcular (admin)
// Recalculates totals based on current ConsumibleNivel data
router.post('/:id/recalcular', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const oferta = await prisma.oferta.findUnique({
      where: { id },
      include: { sistemas: true },
    });

    if (!oferta) {
      res.status(404).json({ error: 'Oferta no encontrada' });
      return;
    }

    const sistemas = oferta.sistemas.map((s) => ({ sistemaId: s.sistemaId, nivel: s.nivel }));
    const { sistemaTotals, totalHoras, totalCoste, totalPrecio } =
      await calculateOfertaTotals(sistemas);

    // Update oferta totals
    await prisma.oferta.update({
      where: { id },
      data: {
        totalHoras: totalHoras || null,
        totalCoste: totalCoste || null,
        totalPrecio: totalPrecio || null,
      },
    });

    // Update per-system totals
    for (const [sistemaId, totals] of sistemaTotals) {
      await prisma.ofertaSistema.update({
        where: { ofertaId_sistemaId: { ofertaId: id, sistemaId } },
        data: {
          horas: totals.horas || null,
          costeConsumibles: totals.coste || null,
          precioConsumibles: totals.precio || null,
        },
      });
    }

    const updated = await prisma.oferta.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true } },
        sistemas: {
          include: {
            sistema: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/v1/ofertas/:id (admin)
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.oferta.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Oferta eliminada' });
  } catch (err) { next(err); }
});

export default router;
