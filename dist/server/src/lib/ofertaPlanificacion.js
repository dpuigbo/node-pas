"use strict";
// Calculo de planificacion de ofertas a partir de bloques de calendario.
//
// Bloques: trabajo / desplazamiento / comida (cada uno con fecha + hora_inicio + hora_fin)
// Las dietas y hotel NO son bloques: se cuentan automaticamente.
//
// Calculo final:
//   precio = horas_trabajo × tarifa_trabajo + horas_viaje × tarifa_viaje
//          + recargos_horario (por bloque trabajo/desplazamiento)
//          + dietas × dias_ocupados
//          + precio_hotel × noches_fuera
//          + precio_consumibles (de oferta_componente)
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularPlanificacion = calcularPlanificacion;
const database_1 = require("../config/database");
const FRANJAS = [
    { key: 'recargo_madrugada_pct', inicio: 6, fin: 8 },
    { key: 'recargo_diurno_pct', inicio: 8, fin: 18 },
    { key: 'recargo_tarde_pct', inicio: 18, fin: 22 },
    { key: 'recargo_nocturno_pct', inicio: 22, fin: 30 }, // 22-06 next day
];
const FRANJA_NAMES = {
    recargo_madrugada_pct: 'Madrugada (6-8h)',
    recargo_diurno_pct: 'Diurno (8-18h)',
    recargo_tarde_pct: 'Tarde (18-22h)',
    recargo_nocturno_pct: 'Nocturno (22-6h)',
};
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
    const num = (k, d) => {
        const v = parseFloat(cfg[k] ?? '');
        return isNaN(v) ? d : v;
    };
    const arr = (k) => {
        try {
            return JSON.parse(cfg[k] || '[]');
        }
        catch {
            return [];
        }
    };
    return {
        recargo_diurno_pct: 0,
        recargo_tarde_pct: num('recargo_tarde_pct', 25),
        recargo_nocturno_pct: num('recargo_nocturno_pct', 100),
        recargo_madrugada_pct: num('recargo_madrugada_pct', 25),
        recargo_domingo_festivo_pct: num('recargo_domingo_festivo_pct', 100),
        recargo_navidad_pct: num('recargo_navidad_pct', 200),
        festivos: arr('festivos'),
        festivos_especiales: arr('festivos_especiales'),
    };
}
function parseHora(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) + (m ?? 0) / 60;
}
function hoursOverlap(aStart, aEnd, bStart, bEnd) {
    return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}
function formatDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function isoDay(d) {
    // 1=Lun..7=Dom
    const js = d.getDay();
    return js === 0 ? 7 : js;
}
function clasificarDia(fecha, config) {
    const dateStr = formatDateStr(fecha);
    if (config.festivos_especiales.includes(dateStr))
        return 'especial';
    if (isoDay(fecha) === 7 || config.festivos.includes(dateStr))
        return 'dom_festivo';
    return 'normal';
}
function calcularRecargoBloque(bloque, tarifaBase, config) {
    if (bloque.tipo !== 'trabajo' && bloque.tipo !== 'desplazamiento')
        return null;
    const start = parseHora(bloque.horaInicio);
    let end = parseHora(bloque.horaFin);
    if (end <= start)
        end += 24; // cruza medianoche
    const horas = end - start;
    if (horas <= 0)
        return null;
    const diaTipo = clasificarDia(bloque.fecha, config);
    const recargoDia = diaTipo === 'especial' ? config.recargo_navidad_pct
        : diaTipo === 'dom_festivo' ? config.recargo_domingo_festivo_pct
            : 0;
    const franjas = [];
    for (const f of FRANJAS) {
        let h = hoursOverlap(start, end, f.inicio, f.fin);
        if (end > 24)
            h += hoursOverlap(start, end, f.inicio + 24, f.fin + 24);
        if (start < 6)
            h += hoursOverlap(start, end, f.inicio - 24, f.fin - 24);
        if (h <= 0)
            continue;
        const recargoBanda = config[f.key] || 0;
        const recargoPct = recargoDia + recargoBanda;
        const importe = +(h * (recargoPct / 100) * tarifaBase).toFixed(2);
        if (h > 0) {
            franjas.push({
                nombre: FRANJA_NAMES[f.key] ?? f.key,
                horas: +h.toFixed(2),
                recargoPct,
                importe,
            });
        }
    }
    const importeBase = +(horas * tarifaBase).toFixed(2);
    const importeRecargo = +franjas.reduce((s, x) => s + x.importe, 0).toFixed(2);
    return {
        bloqueId: bloque.id,
        fecha: formatDateStr(bloque.fecha),
        tipo: bloque.tipo,
        horas: +horas.toFixed(2),
        diaTipo,
        franjas,
        importeBase,
        importeRecargo,
    };
}
async function calcularPlanificacion(ofertaId) {
    const oferta = await database_1.prisma.oferta.findUnique({
        where: { id: ofertaId },
        select: {
            clienteId: true,
            bloques: {
                select: { id: true, fecha: true, horaInicio: true, horaFin: true, tipo: true },
                orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
            },
        },
    });
    const cliente = oferta
        ? await database_1.prisma.cliente.findUnique({
            where: { id: oferta.clienteId },
            select: { tarifaHoraTrabajo: true, tarifaHoraViaje: true, dietas: true, precioHotel: true },
        })
        : null;
    const tarifas = {
        tarifaHoraTrabajo: Number(cliente?.tarifaHoraTrabajo ?? 0),
        tarifaHoraViaje: Number(cliente?.tarifaHoraViaje ?? 0),
        dietas: Number(cliente?.dietas ?? 0),
        precioHotel: Number(cliente?.precioHotel ?? 0),
    };
    const config = await loadRecargosConfig();
    const bloques = (oferta?.bloques ?? []).map((b) => ({
        ...b,
        fecha: new Date(b.fecha),
    }));
    let horasTrabajo = 0;
    let horasDesplazamiento = 0;
    let horasComida = 0;
    let precioRecargos = 0;
    const bloquesDesglose = [];
    const diasSet = new Set();
    const diasNormalesSet = new Set();
    const diasDomFestSet = new Set();
    const diasEspecialesSet = new Set();
    for (const b of bloques) {
        const start = parseHora(b.horaInicio);
        let end = parseHora(b.horaFin);
        if (end <= start)
            end += 24;
        const horas = end - start;
        if (horas <= 0)
            continue;
        if (b.tipo === 'trabajo')
            horasTrabajo += horas;
        else if (b.tipo === 'desplazamiento')
            horasDesplazamiento += horas;
        else if (b.tipo === 'comida')
            horasComida += horas;
        if (b.tipo === 'trabajo' || b.tipo === 'desplazamiento') {
            const dateStr = formatDateStr(b.fecha);
            diasSet.add(dateStr);
            const tipoDia = clasificarDia(b.fecha, config);
            if (tipoDia === 'especial')
                diasEspecialesSet.add(dateStr);
            else if (tipoDia === 'dom_festivo')
                diasDomFestSet.add(dateStr);
            else
                diasNormalesSet.add(dateStr);
            const tarifaBase = b.tipo === 'trabajo' ? tarifas.tarifaHoraTrabajo : tarifas.tarifaHoraViaje;
            const desglose = calcularRecargoBloque(b, tarifaBase, config);
            if (desglose) {
                bloquesDesglose.push(desglose);
                precioRecargos += desglose.importeRecargo;
            }
        }
    }
    const precioTrabajo = +(horasTrabajo * tarifas.tarifaHoraTrabajo).toFixed(2);
    const precioDesplazamiento = +(horasDesplazamiento * tarifas.tarifaHoraViaje).toFixed(2);
    precioRecargos = +precioRecargos.toFixed(2);
    const diasOcupados = diasSet.size;
    const nochesFuera = Math.max(0, diasOcupados - 1);
    const precioDietas = +(diasOcupados * tarifas.dietas).toFixed(2);
    const precioHotel = +(nochesFuera * tarifas.precioHotel).toFixed(2);
    const totalPlanificacion = +(precioTrabajo + precioDesplazamiento + precioRecargos + precioDietas + precioHotel).toFixed(2);
    return {
        horasTrabajo: +horasTrabajo.toFixed(2),
        horasDesplazamiento: +horasDesplazamiento.toFixed(2),
        horasComida: +horasComida.toFixed(2),
        precioTrabajo,
        precioDesplazamiento,
        precioRecargos,
        diasOcupados,
        diasNormales: diasNormalesSet.size,
        diasDomFestivos: diasDomFestSet.size,
        diasEspeciales: diasEspecialesSet.size,
        nochesFuera,
        precioDietas,
        precioHotel,
        bloquesDesglose,
        totalPlanificacion,
    };
}
//# sourceMappingURL=ofertaPlanificacion.js.map