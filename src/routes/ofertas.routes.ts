import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { prisma } from '../config/database';
import {
  createOfertaSchema,
  updateOfertaSchema,
  updateEstadoOfertaSchema,
  generarIntervencionSchema,
  upsertOfertaComponenteSchema,
} from '../validation/ofertas.validation';
import {
  calcularComponenteOferta,
  getNivelesAplicablesModelo,
} from '../lib/ofertaMantenimiento';

const router = Router();

/** Helper: convert Decimal | null to number | null */
function dec(v: any): number | null {
  if (v == null) return null;
  return Number(v);
}

// Soporta ambos formatos: legacy (tipo+id) y v2 (consumibleId)
interface ConsumibleItem {
  tipo?: 'aceite' | 'bateria' | 'consumible';
  id?: number;
  consumibleId?: number;
  cantidad: number;
}

// ===== SURCHARGE TIME BANDS (fixed hours) =====
const FRANJAS = [
  { nombre: 'Madrugada (6-8h)', inicio: 6, fin: 8, key: 'recargo_madrugada_pct' },
  { nombre: 'Diurno (8-18h)', inicio: 8, fin: 18, key: 'recargo_diurno_pct' },
  { nombre: 'Tarde (18-22h)', inicio: 18, fin: 22, key: 'recargo_tarde_pct' },
  { nombre: 'Nocturno (22-6h)', inicio: 22, fin: 30, key: 'recargo_nocturno_pct' }, // 30 = 6 next day
] as const;

interface RecargosConfig {
  recargo_diurno_pct: number;     // always 0
  recargo_tarde_pct: number;      // default 25
  recargo_nocturno_pct: number;   // default 100
  recargo_madrugada_pct: number;  // default 25
  recargo_domingo_festivo_pct: number; // default 100
  recargo_navidad_pct: number;    // default 200
  festivos: string[];             // ["2026-01-01", "2026-01-06", ...]
  festivos_especiales: string[];  // ["2026-12-25", "2027-01-01", ...]
}

interface DesgloseRecargo {
  diasTotales: number;
  horasJornada: number;
  diasNormales: number;
  diasDomFestivos: number;
  diasEspeciales: number;
  resumen: { tipo: string; horas: number; recargoPct: number; importe: number }[];
  totalHorasTrabajo: number;
  totalRecargo: number;
  tarifaBase: number;
}

/** Load surcharge config from ConfiguracionApp table */
async function loadRecargosConfig(): Promise<RecargosConfig> {
  const rows = await prisma.configuracionApp.findMany({
    where: {
      clave: {
        in: [
          'recargo_tarde_pct', 'recargo_nocturno_pct', 'recargo_madrugada_pct',
          'recargo_domingo_festivo_pct', 'recargo_navidad_pct',
          'festivos', 'festivos_especiales',
        ],
      },
    },
  });
  const cfg: Record<string, string> = {};
  for (const r of rows) cfg[r.clave] = r.valor;

  const parseNum = (key: string, def: number) => {
    const v = parseFloat(cfg[key] ?? '');
    return isNaN(v) ? def : v;
  };
  const parseJsonArray = (key: string): string[] => {
    try { return JSON.parse(cfg[key] || '[]'); } catch { return []; }
  };

  return {
    recargo_diurno_pct: 0, // always 0
    recargo_tarde_pct: parseNum('recargo_tarde_pct', 25),
    recargo_nocturno_pct: parseNum('recargo_nocturno_pct', 100),
    recargo_madrugada_pct: parseNum('recargo_madrugada_pct', 25),
    recargo_domingo_festivo_pct: parseNum('recargo_domingo_festivo_pct', 100),
    recargo_navidad_pct: parseNum('recargo_navidad_pct', 200),
    festivos: parseJsonArray('festivos'),
    festivos_especiales: parseJsonArray('festivos_especiales'),
  };
}

/**
 * Calculate hours overlap between a work shift and a time band.
 * Handles overnight bands (e.g., Nocturno 22-30 means 22:00-06:00 next day).
 * shiftStart/shiftEnd and bandStart/bandEnd are in hours (0-30 scale).
 */
function hoursInBand(shiftStart: number, shiftEnd: number, bandStart: number, bandEnd: number): number {
  const overlapStart = Math.max(shiftStart, bandStart);
  const overlapEnd = Math.min(shiftEnd, bandEnd);
  return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Distribute shift hours across time bands.
 * Returns hours per band key.
 */
function distributeShiftHours(
  horaInicio: string, // "HH:MM"
  horaFin: string,    // "HH:MM"
): Record<string, number> {
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);
  let start = hi + mi / 60;
  let end = hf + mf / 60;

  // If shift crosses midnight (e.g., 22:00 - 06:00), extend to next-day scale
  if (end <= start) end += 24;

  const result: Record<string, number> = {};

  for (const franja of FRANJAS) {
    let hours = hoursInBand(start, end, franja.inicio, franja.fin);
    // Also check the band shifted by +24 (for shifts crossing midnight)
    if (end > 24) {
      hours += hoursInBand(start, end, franja.inicio + 24, franja.fin + 24);
    }
    // And check the band shifted by -24 (start in previous day's nocturno range)
    if (start < 6) {
      hours += hoursInBand(start, end, franja.inicio - 24, franja.fin - 24);
    }
    if (hours > 0) result[franja.key] = (result[franja.key] || 0) + hours;
  }

  return result;
}

/**
 * Format date as YYYY-MM-DD for comparison with festivos lists.
 */
function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculate surcharges for an offer based on schedule and config.
 */
async function calculateRecargos(params: {
  fechaInicio: Date;
  fechaFin: Date;
  horaInicioJornada: string;
  horaFinJornada: string;
  diasTrabajo: string; // "1,2,3,4,5"
  totalHoras: number;
  tarifaHoraTrabajo: number;
}): Promise<DesgloseRecargo> {
  const config = await loadRecargosConfig();
  const { fechaInicio, fechaFin, horaInicioJornada, horaFinJornada, diasTrabajo, totalHoras, tarifaHoraTrabajo } = params;

  const workDays = new Set(diasTrabajo.split(',').map(Number)); // 1=Lun..7=Dom
  const festivosSet = new Set(config.festivos);
  const especialesSet = new Set(config.festivos_especiales);

  // Calculate hours per shift using time band distribution
  const shiftBands = distributeShiftHours(horaInicioJornada, horaFinJornada);
  const horasJornada = Object.values(shiftBands).reduce((a, b) => a + b, 0);

  if (horasJornada <= 0) {
    return {
      diasTotales: 0, horasJornada: 0, diasNormales: 0, diasDomFestivos: 0, diasEspeciales: 0,
      resumen: [], totalHorasTrabajo: totalHoras, totalRecargo: 0, tarifaBase: tarifaHoraTrabajo,
    };
  }

  // Classify each working day
  let diasNormales = 0;
  let diasDomFestivos = 0;
  let diasEspeciales = 0;

  const current = new Date(fechaInicio);
  current.setHours(0, 0, 0, 0);
  const end = new Date(fechaFin);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    // JS getDay(): 0=Sun,1=Mon..6=Sat → convert to 1=Lun..7=Dom
    const jsDay = current.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    const dateStr = formatDateStr(current);

    if (workDays.has(isoDay)) {
      if (especialesSet.has(dateStr)) {
        diasEspeciales++;
      } else if (isoDay === 7 || festivosSet.has(dateStr)) {
        diasDomFestivos++;
      } else {
        diasNormales++;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  const diasTotales = diasNormales + diasDomFestivos + diasEspeciales;
  if (diasTotales <= 0) {
    return {
      diasTotales: 0, horasJornada, diasNormales: 0, diasDomFestivos: 0, diasEspeciales: 0,
      resumen: [], totalHorasTrabajo: totalHoras, totalRecargo: 0, tarifaBase: tarifaHoraTrabajo,
    };
  }

  // Build surcharge breakdown
  // For each combination of (day type) × (time band), calculate proportional hours
  const resumen: { tipo: string; horas: number; recargoPct: number; importe: number }[] = [];

  const franjaNames: Record<string, string> = {
    recargo_diurno_pct: 'Diurno (8-18h)',
    recargo_tarde_pct: 'Tarde (18-22h)',
    recargo_nocturno_pct: 'Nocturno (22-6h)',
    recargo_madrugada_pct: 'Madrugada (6-8h)',
  };

  // Proportion of totalHoras per calendar day
  // totalHoras is the work needed; diasTotales × horasJornada is the calendar capacity
  // We distribute totalHoras proportionally across the schedule
  const horasCalendarioTotal = diasTotales * horasJornada;
  const ratio = totalHoras / horasCalendarioTotal; // usually <= 1

  for (const [bandKey, bandHoursPerDay] of Object.entries(shiftBands)) {
    const bandName = franjaNames[bandKey] || bandKey;
    const bandRecargo = (config as any)[bandKey] as number || 0;

    // Normal days
    if (diasNormales > 0) {
      const horas = +(diasNormales * bandHoursPerDay * ratio).toFixed(2);
      const recargoPct = bandRecargo;
      const importe = +(horas * (recargoPct / 100) * tarifaHoraTrabajo).toFixed(2);
      if (horas > 0) {
        resumen.push({ tipo: bandName, horas, recargoPct, importe });
      }
    }

    // Sundays + holidays (day surcharge + band surcharge, additive)
    if (diasDomFestivos > 0) {
      const horas = +(diasDomFestivos * bandHoursPerDay * ratio).toFixed(2);
      const recargoPct = config.recargo_domingo_festivo_pct + bandRecargo;
      const importe = +(horas * (recargoPct / 100) * tarifaHoraTrabajo).toFixed(2);
      if (horas > 0) {
        resumen.push({
          tipo: `Dom/Festivo + ${bandName}`,
          horas, recargoPct, importe,
        });
      }
    }

    // Special days (Christmas/NY) (day surcharge + band surcharge, additive)
    if (diasEspeciales > 0) {
      const horas = +(diasEspeciales * bandHoursPerDay * ratio).toFixed(2);
      const recargoPct = config.recargo_navidad_pct + bandRecargo;
      const importe = +(horas * (recargoPct / 100) * tarifaHoraTrabajo).toFixed(2);
      if (horas > 0) {
        resumen.push({
          tipo: `Navidad/AñoNuevo + ${bandName}`,
          horas, recargoPct, importe,
        });
      }
    }
  }

  const totalRecargo = +resumen.reduce((sum, r) => sum + r.importe, 0).toFixed(2);

  return {
    diasTotales,
    horasJornada: +horasJornada.toFixed(2),
    diasNormales,
    diasDomFestivos,
    diasEspeciales,
    resumen,
    totalHorasTrabajo: totalHoras,
    totalRecargo,
    tarifaBase: tarifaHoraTrabajo,
  };
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

  // Collect all consumible IDs needed for price lookup (mix de v2 + legacy)
  const aceiteIds = new Set<number>();
  const consumibleIds = new Set<number>();
  const catalogoIds = new Set<number>();

  for (const { sistemaId, nivel } of sistemas) {
    const sistema = sistemaMap.get(sistemaId);
    if (!sistema) continue;

    for (const comp of sistema.componentes) {
      const cn = comp.modeloComponente.consumiblesNivel.find((c) => c.nivel === nivel);
      if (!cn?.consumibles) continue;
      const items = cn.consumibles as unknown as ConsumibleItem[];
      for (const item of items) {
        if (item.consumibleId && item.consumibleId > 0) {
          catalogoIds.add(item.consumibleId);
        } else if (item.id && item.id > 0) {
          if (item.tipo === 'aceite') aceiteIds.add(item.id);
          else consumibleIds.add(item.id);
        }
      }
    }
  }

  // Load prices: catalogo unificado (v2) + legacy (con fallback al catalogo via FK)
  const catalogoMap = new Map<number, { coste: number | null; precio: number | null }>();
  const aceiteMap = new Map<number, { coste: number | null; precio: number | null }>();
  const consumibleMap = new Map<number, { coste: number | null; precio: number | null }>();

  if (catalogoIds.size > 0) {
    const items = await prisma.consumibleCatalogo.findMany({
      where: { id: { in: Array.from(catalogoIds) } },
    });
    for (const it of items) catalogoMap.set(it.id, { coste: dec(it.coste), precio: dec(it.precio) });
  }
  if (aceiteIds.size > 0) {
    const aceites = await prisma.aceite.findMany({
      where: { id: { in: Array.from(aceiteIds) } },
      include: { consumible: true },
    });
    for (const a of aceites) aceiteMap.set(a.id, {
      coste: dec(a.consumible?.coste ?? a.coste),
      precio: dec(a.consumible?.precio ?? a.precio),
    });
  }
  if (consumibleIds.size > 0) {
    const consumibles = await prisma.consumible.findMany({
      where: { id: { in: Array.from(consumibleIds) } },
      include: { consumible: true },
    });
    for (const c of consumibles) consumibleMap.set(c.id, {
      coste: dec(c.consumible?.coste ?? c.coste),
      precio: dec(c.consumible?.precio ?? c.precio),
    });
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

      // Add consumibles costs (soporta v2 + legacy)
      if (cn.consumibles) {
        const items = cn.consumibles as unknown as ConsumibleItem[];
        for (const item of items) {
          let priceInfo: { coste: number | null; precio: number | null } | undefined;
          if (item.consumibleId && item.consumibleId > 0) {
            priceInfo = catalogoMap.get(item.consumibleId);
          } else if (item.id && item.id > 0) {
            priceInfo = item.tipo === 'aceite' ? aceiteMap.get(item.id) : consumibleMap.get(item.id);
          }
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

    // Calculate surcharges if schedule is provided
    let desgloseRecargo: any = null;
    let totalRecargo: number | null = null;
    if (data.fechaInicio && data.fechaFin && data.horaInicioJornada && data.horaFinJornada && data.diasTrabajo) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: data.clienteId },
        select: { tarifaHoraTrabajo: true },
      });
      const tarifa = Number(cliente?.tarifaHoraTrabajo) || 0;
      if (tarifa > 0 && totalHoras > 0) {
        const desglose = await calculateRecargos({
          fechaInicio: new Date(data.fechaInicio),
          fechaFin: new Date(data.fechaFin),
          horaInicioJornada: data.horaInicioJornada,
          horaFinJornada: data.horaFinJornada,
          diasTrabajo: data.diasTrabajo,
          totalHoras,
          tarifaHoraTrabajo: tarifa,
        });
        desgloseRecargo = desglose;
        totalRecargo = desglose.totalRecargo;
      }
    }

    const oferta = await prisma.oferta.create({
      data: {
        clienteId: data.clienteId,
        titulo: data.titulo,
        referencia: data.referencia ?? null,
        tipo: data.tipo,
        tipoOferta: data.tipoOferta,
        validezDias: data.validezDias,
        notas: data.notas ?? null,
        totalHoras: totalHoras || null,
        totalCoste: totalCoste || null,
        totalPrecio: totalPrecio || null,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        horaInicioJornada: data.horaInicioJornada ?? null,
        horaFinJornada: data.horaFinJornada ?? null,
        diasTrabajo: data.diasTrabajo ?? null,
        desgloseRecargo: desgloseRecargo,
        totalRecargo: totalRecargo,
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
    if (data.tipoOferta !== undefined) updateData.tipoOferta = data.tipoOferta;
    if (data.validezDias !== undefined) updateData.validezDias = data.validezDias;
    if (data.notas !== undefined) updateData.notas = data.notas;
    // Schedule fields
    if (data.fechaInicio !== undefined) updateData.fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : null;
    if (data.fechaFin !== undefined) updateData.fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
    if (data.horaInicioJornada !== undefined) updateData.horaInicioJornada = data.horaInicioJornada;
    if (data.horaFinJornada !== undefined) updateData.horaFinJornada = data.horaFinJornada;
    if (data.diasTrabajo !== undefined) updateData.diasTrabajo = data.diasTrabajo;

    if (data.sistemas) {
      // Recalculate totals
      const { sistemaTotals, totalHoras, totalCoste, totalPrecio } =
        await calculateOfertaTotals(data.sistemas);

      updateData.totalHoras = totalHoras || null;
      updateData.totalCoste = totalCoste || null;
      updateData.totalPrecio = totalPrecio || null;

      // Recalculate surcharges using updated or existing schedule data
      const mergedSchedule = {
        fechaInicio: updateData.fechaInicio ?? existing.fechaInicio,
        fechaFin: updateData.fechaFin ?? existing.fechaFin,
        horaInicioJornada: updateData.horaInicioJornada ?? existing.horaInicioJornada,
        horaFinJornada: updateData.horaFinJornada ?? existing.horaFinJornada,
        diasTrabajo: updateData.diasTrabajo ?? existing.diasTrabajo,
      };
      if (mergedSchedule.fechaInicio && mergedSchedule.fechaFin && mergedSchedule.horaInicioJornada && mergedSchedule.horaFinJornada && mergedSchedule.diasTrabajo) {
        const cliente = await prisma.cliente.findUnique({
          where: { id: existing.clienteId },
          select: { tarifaHoraTrabajo: true },
        });
        const tarifa = Number(cliente?.tarifaHoraTrabajo) || 0;
        if (tarifa > 0 && totalHoras > 0) {
          const desglose = await calculateRecargos({
            fechaInicio: new Date(mergedSchedule.fechaInicio),
            fechaFin: new Date(mergedSchedule.fechaFin),
            horaInicioJornada: mergedSchedule.horaInicioJornada,
            horaFinJornada: mergedSchedule.horaFinJornada,
            diasTrabajo: mergedSchedule.diasTrabajo,
            totalHoras,
            tarifaHoraTrabajo: tarifa,
          });
          updateData.desgloseRecargo = desglose;
          updateData.totalRecargo = desglose.totalRecargo;
        }
      }

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
      // If only schedule changed (no systems change), recalculate surcharges
      const mergedSchedule = {
        fechaInicio: updateData.fechaInicio ?? existing.fechaInicio,
        fechaFin: updateData.fechaFin ?? existing.fechaFin,
        horaInicioJornada: updateData.horaInicioJornada ?? existing.horaInicioJornada,
        horaFinJornada: updateData.horaFinJornada ?? existing.horaFinJornada,
        diasTrabajo: updateData.diasTrabajo ?? existing.diasTrabajo,
      };
      if (mergedSchedule.fechaInicio && mergedSchedule.fechaFin && mergedSchedule.horaInicioJornada && mergedSchedule.horaFinJornada && mergedSchedule.diasTrabajo) {
        const totalHoras = Number(existing.totalHoras) || 0;
        if (totalHoras > 0) {
          const cliente = await prisma.cliente.findUnique({
            where: { id: existing.clienteId },
            select: { tarifaHoraTrabajo: true },
          });
          const tarifa = Number(cliente?.tarifaHoraTrabajo) || 0;
          if (tarifa > 0) {
            const desglose = await calculateRecargos({
              fechaInicio: new Date(mergedSchedule.fechaInicio),
              fechaFin: new Date(mergedSchedule.fechaFin),
              horaInicioJornada: mergedSchedule.horaInicioJornada,
              horaFinJornada: mergedSchedule.horaFinJornada,
              diasTrabajo: mergedSchedule.diasTrabajo,
              totalHoras,
              tarifaHoraTrabajo: tarifa,
            });
            updateData.desgloseRecargo = desglose;
            updateData.totalRecargo = desglose.totalRecargo;
          }
        }
      }
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

    // Recalculate surcharges if schedule exists
    let desgloseRecargo: any = null;
    let totalRecargo: number | null = null;
    if (oferta.fechaInicio && oferta.fechaFin && oferta.horaInicioJornada && oferta.horaFinJornada && oferta.diasTrabajo) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: oferta.clienteId },
        select: { tarifaHoraTrabajo: true },
      });
      const tarifa = Number(cliente?.tarifaHoraTrabajo) || 0;
      if (tarifa > 0 && totalHoras > 0) {
        const desglose = await calculateRecargos({
          fechaInicio: new Date(oferta.fechaInicio),
          fechaFin: new Date(oferta.fechaFin),
          horaInicioJornada: oferta.horaInicioJornada,
          horaFinJornada: oferta.horaFinJornada,
          diasTrabajo: oferta.diasTrabajo,
          totalHoras,
          tarifaHoraTrabajo: tarifa,
        });
        desgloseRecargo = desglose;
        totalRecargo = desglose.totalRecargo;
      }
    }

    // Update oferta totals
    await prisma.oferta.update({
      where: { id },
      data: {
        totalHoras: totalHoras || null,
        totalCoste: totalCoste || null,
        totalPrecio: totalPrecio || null,
        desgloseRecargo: desgloseRecargo,
        totalRecargo: totalRecargo,
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

// GET /api/v1/ofertas/:id/componentes-disponibles
// Devuelve todos los componentes de los sistemas en la oferta, con sus niveles
// aplicables y la seleccion actual (si existe oferta_componente).
router.get('/:id/componentes-disponibles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ofertaId = Number(req.params.id);
    const oferta = await prisma.oferta.findUnique({
      where: { id: ofertaId },
      include: {
        sistemas: {
          include: {
            sistema: {
              select: {
                id: true,
                nombre: true,
                componentes: {
                  orderBy: { orden: 'asc' },
                  select: {
                    id: true,
                    tipo: true,
                    etiqueta: true,
                    numeroSerie: true,
                    numEjes: true,
                    componentePadreId: true,
                    modeloComponente: { select: { id: true, nombre: true, tipo: true, tipoBateriaMedida: true } },
                  },
                },
              },
            },
          },
        },
        componentes: true,
      },
    });
    if (!oferta) {
      res.status(404).json({ error: 'Oferta no encontrada' });
      return;
    }

    // Index oferta_componente por componenteSistemaId para lookup rapido
    const seleccionMap = new Map(oferta.componentes.map((c) => [c.componenteSistemaId, c]));

    // Recolectar todos los componentes de todos los sistemas
    const items: any[] = [];
    for (const os of oferta.sistemas) {
      const sistema = os.sistema;
      for (const comp of sistema.componentes) {
        const niveles = await getNivelesAplicablesModelo(comp.modeloComponente.id);
        const sel = seleccionMap.get(comp.id);
        items.push({
          componenteSistemaId: comp.id,
          sistemaId: sistema.id,
          sistemaNombre: sistema.nombre,
          tipo: comp.tipo,
          etiqueta: comp.etiqueta,
          numeroSerie: comp.numeroSerie,
          numEjes: comp.numEjes,
          componentePadreId: comp.componentePadreId,
          modeloId: comp.modeloComponente.id,
          modeloNombre: comp.modeloComponente.nombre,
          tipoBateriaMedida: comp.modeloComponente.tipoBateriaMedida,
          nivelesAplicables: niveles,
          seleccion: sel ? {
            nivel: sel.nivel,
            conBaterias: sel.conBaterias,
            conAceite: sel.conAceite,
            horas: dec(sel.horas),
            costeConsumibles: dec(sel.costeConsumibles),
            precioConsumibles: dec(sel.precioConsumibles),
            costeLimpieza: dec(sel.costeLimpieza),
            notas: sel.notas,
          } : null,
        });
      }
    }

    res.json({
      ofertaId,
      tipoOferta: oferta.tipoOferta,
      componentes: items,
    });
  } catch (err) { next(err); }
});

// PUT /api/v1/ofertas/:id/componente/:cmpId (admin)
// Upsert de oferta_componente con calculo automatico de horas + costes.
router.put('/:id/componente/:cmpId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ofertaId = Number(req.params.id);
    const componenteSistemaId = Number(req.params.cmpId);
    const data = upsertOfertaComponenteSchema.parse(req.body);

    const oferta = await prisma.oferta.findUnique({
      where: { id: ofertaId },
      select: { tipoOferta: true, estado: true },
    });
    if (!oferta) {
      res.status(404).json({ error: 'Oferta no encontrada' });
      return;
    }
    if (oferta.estado !== 'borrador') {
      res.status(400).json({ error: 'Solo se pueden editar ofertas en estado borrador' });
      return;
    }

    const comp = await prisma.componenteSistema.findUnique({
      where: { id: componenteSistemaId },
      select: { modeloComponenteId: true },
    });
    if (!comp) {
      res.status(404).json({ error: 'Componente no encontrado' });
      return;
    }

    // Defaults: con baterias y con aceite TRUE si no se especifica
    const conBaterias = data.conBaterias ?? true;
    const conAceite = data.conAceite ?? true;
    const nivel = data.nivel ?? null;

    // Calcular horas + costes solo si hay nivel definido
    let calc = { horas: 0, costeConsumibles: 0, precioConsumibles: 0, costeLimpieza: 0 };
    if (nivel) {
      calc = await calcularComponenteOferta(comp.modeloComponenteId, nivel, {
        tipoOferta: oferta.tipoOferta,
        conBaterias,
        conAceite,
      });
    }

    const upserted = await prisma.ofertaComponente.upsert({
      where: { ofertaId_componenteSistemaId: { ofertaId, componenteSistemaId } },
      create: {
        ofertaId,
        componenteSistemaId,
        nivel,
        conBaterias,
        conAceite,
        horas: calc.horas || null,
        costeConsumibles: calc.costeConsumibles || null,
        precioConsumibles: calc.precioConsumibles || null,
        costeLimpieza: calc.costeLimpieza || null,
        notas: data.notas ?? null,
      },
      update: {
        nivel,
        conBaterias,
        conAceite,
        horas: calc.horas || null,
        costeConsumibles: calc.costeConsumibles || null,
        precioConsumibles: calc.precioConsumibles || null,
        costeLimpieza: calc.costeLimpieza || null,
        notas: data.notas ?? null,
      },
    });

    res.json({
      ...upserted,
      horas: dec(upserted.horas),
      costeConsumibles: dec(upserted.costeConsumibles),
      precioConsumibles: dec(upserted.precioConsumibles),
      costeLimpieza: dec(upserted.costeLimpieza),
    });
  } catch (err) { next(err); }
});

// DELETE /api/v1/ofertas/:id/componente/:cmpId (admin)
router.delete('/:id/componente/:cmpId', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ofertaId = Number(req.params.id);
    const componenteSistemaId = Number(req.params.cmpId);
    await prisma.ofertaComponente.deleteMany({
      where: { ofertaId, componenteSistemaId },
    });
    res.json({ message: 'Componente eliminado de la oferta' });
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
