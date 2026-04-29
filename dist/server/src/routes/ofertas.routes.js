"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const ofertas_validation_1 = require("../validation/ofertas.validation");
const ofertaMantenimiento_1 = require("../lib/ofertaMantenimiento");
const ofertaPlanificacion_1 = require("../lib/ofertaPlanificacion");
const bloquesCandidatos_1 = require("../lib/bloquesCandidatos");
const niveles_1 = require("../lib/niveles");
/** Resolver codigos canonicos a IDs en batch. Lanza si algun codigo no existe.
 * Acepta null/undefined entries y los ignora. */
async function resolveNivelCodigos(codigos) {
    const out = new Map();
    for (const c of codigos) {
        if (!c)
            continue;
        const norm = (0, niveles_1.normalizarCodigoNivel)(c) ?? c;
        if (out.has(norm))
            continue;
        const id = await (0, niveles_1.nivelIdFromCodigo)(norm);
        if (id == null)
            throw new Error(`Nivel desconocido: ${c}`);
        out.set(norm, id);
        if (norm !== c)
            out.set(c, id); // alias para codigos legacy
    }
    return out;
}
const router = (0, express_1.Router)();
/** Helper: convert Decimal | null to number | null */
function dec(v) {
    if (v == null)
        return null;
    return Number(v);
}
// ===== SURCHARGE TIME BANDS (fixed hours) =====
const FRANJAS = [
    { nombre: 'Madrugada (6-8h)', inicio: 6, fin: 8, key: 'recargo_madrugada_pct' },
    { nombre: 'Diurno (8-18h)', inicio: 8, fin: 18, key: 'recargo_diurno_pct' },
    { nombre: 'Tarde (18-22h)', inicio: 18, fin: 22, key: 'recargo_tarde_pct' },
    { nombre: 'Nocturno (22-6h)', inicio: 22, fin: 30, key: 'recargo_nocturno_pct' }, // 30 = 6 next day
];
/** Load surcharge config from ConfiguracionApp table */
async function loadRecargosConfig() {
    const rows = await database_1.prisma.configuracionApp.findMany({
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
    const cfg = {};
    for (const r of rows)
        cfg[r.clave] = r.valor;
    const parseNum = (key, def) => {
        const v = parseFloat(cfg[key] ?? '');
        return isNaN(v) ? def : v;
    };
    const parseJsonArray = (key) => {
        try {
            return JSON.parse(cfg[key] || '[]');
        }
        catch {
            return [];
        }
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
function hoursInBand(shiftStart, shiftEnd, bandStart, bandEnd) {
    const overlapStart = Math.max(shiftStart, bandStart);
    const overlapEnd = Math.min(shiftEnd, bandEnd);
    return Math.max(0, overlapEnd - overlapStart);
}
/**
 * Distribute shift hours across time bands.
 * Returns hours per band key.
 */
function distributeShiftHours(horaInicio, // "HH:MM"
horaFin) {
    const [hi, mi] = horaInicio.split(':').map(Number);
    const [hf, mf] = horaFin.split(':').map(Number);
    let start = hi + mi / 60;
    let end = hf + mf / 60;
    // If shift crosses midnight (e.g., 22:00 - 06:00), extend to next-day scale
    if (end <= start)
        end += 24;
    const result = {};
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
        if (hours > 0)
            result[franja.key] = (result[franja.key] || 0) + hours;
    }
    return result;
}
/**
 * Format date as YYYY-MM-DD for comparison with festivos lists.
 */
function formatDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
/**
 * Calculate surcharges for an offer based on schedule and config.
 */
async function calculateRecargos(params) {
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
            }
            else if (isoDay === 7 || festivosSet.has(dateStr)) {
                diasDomFestivos++;
            }
            else {
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
    const resumen = [];
    const franjaNames = {
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
        const bandRecargo = config[bandKey] || 0;
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
async function calculateOfertaTotals(sistemas) {
    const sistemaTotals = new Map();
    let totalHoras = 0;
    let totalCoste = 0;
    let totalPrecio = 0;
    // Batch load all systems with their components and consumibles-nivel
    const sistemaIds = sistemas.map((s) => s.sistemaId);
    const sistemasDb = await database_1.prisma.sistema.findMany({
        where: { id: { in: sistemaIds } },
        include: {
            componentes: {
                include: {
                    modeloComponente: {
                        include: {
                            consumiblesNivel: {
                                include: { nivel: { select: { codigo: true } } },
                            },
                        },
                    },
                },
            },
        },
    });
    const sistemaMap = new Map(sistemasDb.map((s) => [s.id, s]));
    // Collect all consumible IDs needed for price lookup (mix de v2 + legacy)
    const aceiteIds = new Set();
    const consumibleIds = new Set();
    const catalogoIds = new Set();
    for (const { sistemaId, nivel } of sistemas) {
        if (!nivel)
            continue; // sin nivel global, no contribuye al total
        const sistema = sistemaMap.get(sistemaId);
        if (!sistema)
            continue;
        for (const comp of sistema.componentes) {
            const cn = comp.modeloComponente.consumiblesNivel.find((c) => c.nivel.codigo === nivel);
            if (!cn?.consumibles)
                continue;
            const items = cn.consumibles;
            for (const item of items) {
                if (item.consumibleId && item.consumibleId > 0) {
                    catalogoIds.add(item.consumibleId);
                }
                else if (item.id && item.id > 0) {
                    if (item.tipo === 'aceite')
                        aceiteIds.add(item.id);
                    else
                        consumibleIds.add(item.id);
                }
            }
        }
    }
    // Load prices: catalogo unificado (v2) + legacy (con fallback al catalogo via FK)
    const catalogoMap = new Map();
    const aceiteMap = new Map();
    const consumibleMap = new Map();
    if (catalogoIds.size > 0) {
        const items = await database_1.prisma.consumibleCatalogo.findMany({
            where: { id: { in: Array.from(catalogoIds) } },
        });
        for (const it of items)
            catalogoMap.set(it.id, { coste: dec(it.coste), precio: dec(it.precio) });
    }
    if (aceiteIds.size > 0) {
        const aceites = await database_1.prisma.aceite.findMany({
            where: { id: { in: Array.from(aceiteIds) } },
            include: { consumible: true },
        });
        for (const a of aceites)
            aceiteMap.set(a.id, {
                coste: dec(a.consumible?.coste ?? a.coste),
                precio: dec(a.consumible?.precio ?? a.precio),
            });
    }
    if (consumibleIds.size > 0) {
        // Legacy 'consumible' items: best-effort lookup contra consumible_catalogo
        // (tabla legacy droppeada 2026-04, ver journal P-005).
        const consumibles = await database_1.prisma.consumibleCatalogo.findMany({
            where: { id: { in: Array.from(consumibleIds) } },
        });
        for (const c of consumibles)
            consumibleMap.set(c.id, {
                coste: dec(c.coste),
                precio: dec(c.precio),
            });
    }
    // Calculate per system
    for (const { sistemaId, nivel } of sistemas) {
        if (!nivel)
            continue;
        const sistema = sistemaMap.get(sistemaId);
        if (!sistema)
            continue;
        let sysHoras = 0;
        let sysCoste = 0;
        let sysPrecio = 0;
        for (const comp of sistema.componentes) {
            const cn = comp.modeloComponente.consumiblesNivel.find((c) => c.nivel.codigo === nivel);
            if (!cn)
                continue;
            // Add hours
            sysHoras += dec(cn.horas) ?? 0;
            // Add precioOtros
            sysCoste += dec(cn.precioOtros) ?? 0;
            sysPrecio += dec(cn.precioOtros) ?? 0;
            // Add consumibles costs (soporta v2 + legacy)
            if (cn.consumibles) {
                const items = cn.consumibles;
                for (const item of items) {
                    let priceInfo;
                    if (item.consumibleId && item.consumibleId > 0) {
                        priceInfo = catalogoMap.get(item.consumibleId);
                    }
                    else if (item.id && item.id > 0) {
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
router.get('/', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.clienteId)
            where.clienteId = Number(req.query.clienteId);
        if (req.query.estado)
            where.estado = req.query.estado;
        const ofertas = await database_1.prisma.oferta.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                cliente: { select: { id: true, nombre: true } },
                sistemas: {
                    include: {
                        sistema: { select: { id: true, nombre: true } },
                        nivel: { select: { codigo: true, nombre: true } },
                    },
                },
            },
        });
        // Serializar nivel objeto -> codigo string para mantener compat con frontend
        res.json(ofertas.map((o) => ({
            ...o,
            sistemas: o.sistemas.map((s) => ({ ...s, nivel: s.nivel?.codigo ?? null, nivelNombre: s.nivel?.nombre ?? null })),
        })));
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/ofertas/:id
router.get('/:id', async (req, res, next) => {
    try {
        const oferta = await database_1.prisma.oferta.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                cliente: { select: { id: true, nombre: true, sede: true, tarifaHoraTrabajo: true } },
                sistemas: {
                    include: {
                        nivel: { select: { codigo: true, nombre: true } },
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
        res.json({
            ...oferta,
            sistemas: oferta.sistemas.map((s) => ({ ...s, nivel: s.nivel?.codigo ?? null, nivelNombre: s.nivel?.nombre ?? null })),
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/ofertas (admin)
router.post('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = ofertas_validation_1.createOfertaSchema.parse(req.body);
        // Calculate totals
        const { sistemaTotals, totalHoras, totalCoste, totalPrecio } = await calculateOfertaTotals(data.sistemas);
        // Calculate surcharges if schedule is provided
        let desgloseRecargo = null;
        let totalRecargo = null;
        if (data.fechaInicio && data.fechaFin && data.horaInicioJornada && data.horaFinJornada && data.diasTrabajo) {
            const cliente = await database_1.prisma.cliente.findUnique({
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
        const sistemaNivelMap = await resolveNivelCodigos(data.sistemas.map((s) => s.nivel));
        const oferta = await database_1.prisma.oferta.create({
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
                            nivelId: s.nivel ? (sistemaNivelMap.get(s.nivel) ?? null) : null,
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
                        nivel: { select: { codigo: true, nombre: true } },
                    },
                },
            },
        });
        res.status(201).json(oferta);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/ofertas/:id (admin)
router.put('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = ofertas_validation_1.updateOfertaSchema.parse(req.body);
        // Check oferta exists and is in borrador
        const existing = await database_1.prisma.oferta.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Oferta no encontrada' });
            return;
        }
        if (existing.estado !== 'borrador') {
            res.status(400).json({ error: 'Solo se pueden editar ofertas en estado borrador' });
            return;
        }
        const updateData = {};
        if (data.titulo !== undefined)
            updateData.titulo = data.titulo;
        if (data.referencia !== undefined)
            updateData.referencia = data.referencia;
        if (data.tipo !== undefined)
            updateData.tipo = data.tipo;
        if (data.tipoOferta !== undefined)
            updateData.tipoOferta = data.tipoOferta;
        if (data.validezDias !== undefined)
            updateData.validezDias = data.validezDias;
        if (data.notas !== undefined)
            updateData.notas = data.notas;
        // Schedule fields
        if (data.fechaInicio !== undefined)
            updateData.fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : null;
        if (data.fechaFin !== undefined)
            updateData.fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
        if (data.horaInicioJornada !== undefined)
            updateData.horaInicioJornada = data.horaInicioJornada;
        if (data.horaFinJornada !== undefined)
            updateData.horaFinJornada = data.horaFinJornada;
        if (data.diasTrabajo !== undefined)
            updateData.diasTrabajo = data.diasTrabajo;
        if (data.sistemas) {
            // Recalculate totals
            const { sistemaTotals, totalHoras, totalCoste, totalPrecio } = await calculateOfertaTotals(data.sistemas);
            const sistemaNivelMapPut = await resolveNivelCodigos(data.sistemas.map((s) => s.nivel));
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
                const cliente = await database_1.prisma.cliente.findUnique({
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
            await database_1.prisma.$transaction([
                database_1.prisma.ofertaSistema.deleteMany({ where: { ofertaId: id } }),
                database_1.prisma.oferta.update({
                    where: { id },
                    data: {
                        ...updateData,
                        sistemas: {
                            create: data.sistemas.map((s) => {
                                const totals = sistemaTotals.get(s.sistemaId);
                                return {
                                    sistemaId: s.sistemaId,
                                    nivelId: s.nivel ? (sistemaNivelMapPut.get(s.nivel) ?? null) : null,
                                    horas: totals?.horas ?? null,
                                    costeConsumibles: totals?.coste ?? null,
                                    precioConsumibles: totals?.precio ?? null,
                                };
                            }),
                        },
                    },
                }),
            ]);
        }
        else {
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
                    const cliente = await database_1.prisma.cliente.findUnique({
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
            await database_1.prisma.oferta.update({ where: { id }, data: updateData });
        }
        const oferta = await database_1.prisma.oferta.findUnique({
            where: { id },
            include: {
                cliente: { select: { id: true, nombre: true } },
                sistemas: {
                    include: {
                        sistema: { select: { id: true, nombre: true } },
                        nivel: { select: { codigo: true, nombre: true } },
                    },
                },
            },
        });
        res.json(oferta);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/v1/ofertas/:id/estado (admin)
router.patch('/:id/estado', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { estado } = ofertas_validation_1.updateEstadoOfertaSchema.parse(req.body);
        const oferta = await database_1.prisma.oferta.update({
            where: { id: Number(req.params.id) },
            data: { estado },
        });
        res.json(oferta);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/ofertas/:id/generar-intervencion (admin)
// Generates an intervention from an approved oferta with specified dates
router.post('/:id/generar-intervencion', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const ofertaId = Number(req.params.id);
        const { fechaInicio, fechaFin } = ofertas_validation_1.generarIntervencionSchema.parse(req.body);
        const oferta = await database_1.prisma.oferta.findUnique({
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
        // Create intervencion with sistemas from oferta (heredan nivelId)
        const intervencion = await database_1.prisma.intervencion.create({
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
                    createMany: {
                        data: oferta.sistemas.map((s) => ({
                            sistemaId: s.sistemaId,
                            nivelId: s.nivelId,
                        })),
                    },
                },
            },
            include: {
                cliente: { select: { id: true, nombre: true } },
                sistemas: {
                    include: {
                        sistema: { select: { id: true, nombre: true } },
                        nivel: { select: { codigo: true, nombre: true } },
                    },
                },
            },
        });
        res.status(201).json(intervencion);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/ofertas/:id/recalcular (admin)
// Recalculates totals based on current ConsumibleNivel data
router.post('/:id/recalcular', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const oferta = await database_1.prisma.oferta.findUnique({
            where: { id },
            include: { sistemas: { include: { nivel: { select: { codigo: true } } } } },
        });
        if (!oferta) {
            res.status(404).json({ error: 'Oferta no encontrada' });
            return;
        }
        const sistemas = oferta.sistemas.map((s) => ({ sistemaId: s.sistemaId, nivel: s.nivel?.codigo ?? null }));
        const { sistemaTotals, totalHoras, totalCoste, totalPrecio } = await calculateOfertaTotals(sistemas);
        // Recalculate surcharges if schedule exists
        let desgloseRecargo = null;
        let totalRecargo = null;
        if (oferta.fechaInicio && oferta.fechaFin && oferta.horaInicioJornada && oferta.horaFinJornada && oferta.diasTrabajo) {
            const cliente = await database_1.prisma.cliente.findUnique({
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
        await database_1.prisma.oferta.update({
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
            await database_1.prisma.ofertaSistema.update({
                where: { ofertaId_sistemaId: { ofertaId: id, sistemaId } },
                data: {
                    horas: totals.horas || null,
                    costeConsumibles: totals.coste || null,
                    precioConsumibles: totals.precio || null,
                },
            });
        }
        const updated = await database_1.prisma.oferta.findUnique({
            where: { id },
            include: {
                cliente: { select: { id: true, nombre: true } },
                sistemas: {
                    include: {
                        sistema: { select: { id: true, nombre: true } },
                        nivel: { select: { codigo: true, nombre: true } },
                    },
                },
            },
        });
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/ofertas/:id/componentes-disponibles
// Devuelve todos los componentes de los sistemas en la oferta, con sus niveles
// aplicables y la seleccion actual (si existe oferta_componente).
router.get('/:id/componentes-disponibles', async (req, res, next) => {
    try {
        const ofertaId = Number(req.params.id);
        const oferta = await database_1.prisma.oferta.findUnique({
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
                componentes: { include: { nivel: { select: { codigo: true } } } },
            },
        });
        if (!oferta) {
            res.status(404).json({ error: 'Oferta no encontrada' });
            return;
        }
        // Index oferta_componente por componenteSistemaId para lookup rapido
        const seleccionMap = new Map(oferta.componentes.map((c) => [c.componenteSistemaId, c]));
        // Recolectar todos los componentes de todos los sistemas
        const items = [];
        for (const os of oferta.sistemas) {
            const sistema = os.sistema;
            for (const comp of sistema.componentes) {
                const niveles = await (0, ofertaMantenimiento_1.getNivelesAplicablesModelo)(comp.modeloComponente.id);
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
                        nivel: sel.nivel?.codigo ?? null,
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
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/ofertas/:id/componente/:cmpId (admin)
// Upsert de oferta_componente con calculo automatico de horas + costes.
router.put('/:id/componente/:cmpId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const ofertaId = Number(req.params.id);
        const componenteSistemaId = Number(req.params.cmpId);
        const data = ofertas_validation_1.upsertOfertaComponenteSchema.parse(req.body);
        const oferta = await database_1.prisma.oferta.findUnique({
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
        const comp = await database_1.prisma.componenteSistema.findUnique({
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
        const nivelCodigo = data.nivel ?? null;
        const nivelId = nivelCodigo ? await (0, niveles_1.nivelIdFromCodigo)(nivelCodigo) : null;
        // Calcular horas + costes solo si hay nivel definido
        let calc = { horas: 0, costeConsumibles: 0, precioConsumibles: 0, costeLimpieza: 0 };
        if (nivelCodigo) {
            calc = await (0, ofertaMantenimiento_1.calcularComponenteOferta)(comp.modeloComponenteId, nivelCodigo, {
                tipoOferta: oferta.tipoOferta,
                conBaterias,
                conAceite,
            });
        }
        const upserted = await database_1.prisma.ofertaComponente.upsert({
            where: { ofertaId_componenteSistemaId: { ofertaId, componenteSistemaId } },
            create: {
                ofertaId,
                componenteSistemaId,
                nivelId,
                conBaterias,
                conAceite,
                horas: calc.horas || null,
                costeConsumibles: calc.costeConsumibles || null,
                precioConsumibles: calc.precioConsumibles || null,
                costeLimpieza: calc.costeLimpieza || null,
                notas: data.notas ?? null,
            },
            update: {
                nivelId,
                conBaterias,
                conAceite,
                horas: calc.horas || null,
                costeConsumibles: calc.costeConsumibles || null,
                precioConsumibles: calc.precioConsumibles || null,
                costeLimpieza: calc.costeLimpieza || null,
                notas: data.notas ?? null,
            },
            include: { nivel: { select: { codigo: true } } },
        });
        res.json({
            ...upserted,
            nivel: upserted.nivel?.codigo ?? null,
            horas: dec(upserted.horas),
            costeConsumibles: dec(upserted.costeConsumibles),
            precioConsumibles: dec(upserted.precioConsumibles),
            costeLimpieza: dec(upserted.costeLimpieza),
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/ofertas/:id/componente/:cmpId (admin)
router.delete('/:id/componente/:cmpId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const ofertaId = Number(req.params.id);
        const componenteSistemaId = Number(req.params.cmpId);
        await database_1.prisma.ofertaComponente.deleteMany({
            where: { ofertaId, componenteSistemaId },
        });
        res.json({ message: 'Componente eliminado de la oferta' });
    }
    catch (err) {
        next(err);
    }
});
// ===== PLANIFICACION (bloques calendario + totales auto) =====
// GET /api/v1/ofertas/:id/planificacion
// Devuelve bloques + totales calculados (horas trabajo/viaje/comida, dias ocupados,
// noches fuera, dietas, hotel, recargos por bloque, total)
router.get('/:id/planificacion', async (req, res, next) => {
    try {
        const ofertaId = Number(req.params.id);
        const oferta = await database_1.prisma.oferta.findUnique({
            where: { id: ofertaId },
            select: { id: true },
        });
        if (!oferta) {
            res.status(404).json({ error: 'Oferta no encontrada' });
            return;
        }
        const bloques = await database_1.prisma.ofertaBloqueCalendario.findMany({
            where: { ofertaId },
            orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
            include: {
                ofertaComponente: {
                    include: {
                        nivel: { select: { codigo: true, nombre: true } },
                        componenteSistema: {
                            select: {
                                etiqueta: true,
                                tipo: true,
                                sistema: { select: { id: true, nombre: true } },
                                modeloComponente: { select: { nombre: true } },
                            },
                        },
                    },
                },
            },
        });
        const totales = await (0, ofertaPlanificacion_1.calcularPlanificacion)(ofertaId);
        res.json({
            ofertaId,
            bloques: bloques.map((b) => ({
                id: b.id,
                fecha: b.fecha.toISOString().slice(0, 10),
                horaInicio: b.horaInicio,
                horaFin: b.horaFin,
                tipo: b.tipo,
                ofertaComponenteId: b.ofertaComponenteId,
                origenTipo: b.origenTipo,
                notas: b.notas,
                // Info derivada para UI (sin requerir lookup contra candidatos)
                sistemaId: b.ofertaComponente?.componenteSistema.sistema.id ?? null,
                sistemaNombre: b.ofertaComponente?.componenteSistema.sistema.nombre ?? null,
                componenteEtiqueta: b.ofertaComponente?.componenteSistema.etiqueta ?? null,
                componenteTipo: b.ofertaComponente?.componenteSistema.tipo ?? null,
                modeloNombre: b.ofertaComponente?.componenteSistema.modeloComponente.nombre ?? null,
                nivelCodigo: b.ofertaComponente?.nivel?.codigo ?? null,
                nivelNombre: b.ofertaComponente?.nivel?.nombre ?? null,
            })),
            totales,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/ofertas/:id/bloques-candidatos
// Devuelve los bloques pendientes de colocar (componentes con horas + viaje cliente)
router.get('/:id/bloques-candidatos', async (req, res, next) => {
    try {
        const ofertaId = Number(req.params.id);
        const candidatos = await (0, bloquesCandidatos_1.getBloquesCandidatos)(ofertaId);
        res.json({ ofertaId, candidatos });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/ofertas/:id/bloques (admin) — crear bloque
router.post('/:id/bloques', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const ofertaId = Number(req.params.id);
        const data = ofertas_validation_1.createBloqueSchema.parse(req.body);
        const bloque = await database_1.prisma.ofertaBloqueCalendario.create({
            data: {
                ofertaId,
                fecha: new Date(data.fecha + 'T00:00:00Z'),
                horaInicio: data.horaInicio,
                horaFin: data.horaFin,
                tipo: data.tipo,
                ofertaComponenteId: data.ofertaComponenteId ?? null,
                origenTipo: data.origenTipo ?? 'manual',
                notas: data.notas ?? null,
            },
        });
        res.status(201).json({
            ...bloque,
            fecha: bloque.fecha.toISOString().slice(0, 10),
        });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/ofertas/:id/bloques/:bloqueId (admin)
router.put('/:id/bloques/:bloqueId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const id = Number(req.params.bloqueId);
        const data = ofertas_validation_1.updateBloqueSchema.parse(req.body);
        const updateData = {};
        if (data.fecha !== undefined)
            updateData.fecha = new Date(data.fecha + 'T00:00:00Z');
        if (data.horaInicio !== undefined)
            updateData.horaInicio = data.horaInicio;
        if (data.horaFin !== undefined)
            updateData.horaFin = data.horaFin;
        if (data.tipo !== undefined)
            updateData.tipo = data.tipo;
        if (data.notas !== undefined)
            updateData.notas = data.notas;
        const bloque = await database_1.prisma.ofertaBloqueCalendario.update({
            where: { id },
            data: updateData,
        });
        res.json({
            ...bloque,
            fecha: bloque.fecha.toISOString().slice(0, 10),
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/ofertas/:id/bloques/:bloqueId (admin)
router.delete('/:id/bloques/:bloqueId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const id = Number(req.params.bloqueId);
        await database_1.prisma.ofertaBloqueCalendario.delete({ where: { id } });
        res.json({ message: 'Bloque eliminado' });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/ofertas/:id/bloques (admin) — reemplazo total
router.put('/:id/bloques', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const ofertaId = Number(req.params.id);
        const { bloques } = ofertas_validation_1.bulkBloquesSchema.parse(req.body);
        await database_1.prisma.$transaction([
            database_1.prisma.ofertaBloqueCalendario.deleteMany({ where: { ofertaId } }),
            database_1.prisma.ofertaBloqueCalendario.createMany({
                data: bloques.map((b) => ({
                    ofertaId,
                    fecha: new Date(b.fecha + 'T00:00:00Z'),
                    horaInicio: b.horaInicio,
                    horaFin: b.horaFin,
                    tipo: b.tipo,
                    notas: b.notas ?? null,
                })),
            }),
        ]);
        res.json({ message: 'Bloques actualizados', count: bloques.length });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/ofertas/:id (admin)
router.delete('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.oferta.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'Oferta eliminada' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=ofertas.routes.js.map