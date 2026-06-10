"use strict";
// Plan de mantenimiento v2.9 — helpers compartidos.
//
// Modelo de datos (BD v2.9, guia 2026-05-14):
//   - lubricacion: filas por (modelo, eje) con consumible_id, lifetime,
//     nivel_id (nivel que cubre el cambio) y cohortes JSON
//     (montajes/protecciones/controladores _aplicables; NULL = todos).
//   - actividad_preventiva: actividades no-lubricacion con modelos_aplicables
//     (JSON de IDs de modelo, filtro principal), nivel_id, obligatoria y cohortes.
//   - mantenimiento_horas_modelo: horas por (modelo, nivel). El controlador
//     tiene sus propias filas (nivel N_CTRL); el total del sistema se obtiene
//     SUMANDO manipulador + controlador (D-073).
Object.defineProperty(exports, "__esModule", { value: true });
exports.nivelesCubiertos = nivelesCubiertos;
exports.parseIdArray = parseIdArray;
exports.cohorteMatch = cohorteMatch;
exports.matchCohorte = matchCohorte;
exports.getLubricacionPlan = getLubricacionPlan;
exports.getLubricacionModelo = getLubricacionModelo;
exports.actividadAplicaAModelo = actividadAplicaAModelo;
exports.getActividadesPlan = getActividadesPlan;
exports.getHorasModeloNivel = getHorasModeloNivel;
exports.getHorasModelo = getHorasModelo;
exports.nivelEfectivoParaTipo = nivelEfectivoParaTipo;
exports.convertirCantidadAUnidadConsumible = convertirCantidadAUnidadConsumible;
exports.getConsumiblesPlan = getConsumiblesPlan;
const database_1 = require("../config/database");
/**
 * Niveles cuyo contenido queda cubierto al ejecutar el nivel pedido.
 * N2_INF/N2_SUP incluyen N1; N3 = N1 + N2_INF + N2_SUP (servicio completo).
 */
const COBERTURA_NIVEL = {
    N1: ['N1'],
    N2_INF: ['N1', 'N2_INF'],
    N2_SUP: ['N1', 'N2_SUP'],
    N3: ['N1', 'N2_INF', 'N2_SUP', 'N3'],
    N_CTRL: ['N_CTRL'],
    N_DU: ['N_DU'],
    N0_EJE: ['N0_EJE'],
    N1_EJE: ['N1_EJE'],
    N2_EJE: ['N1_EJE', 'N2_EJE'],
};
function nivelesCubiertos(nivelCodigo) {
    return COBERTURA_NIVEL[nivelCodigo] ?? [nivelCodigo];
}
/** Parsea un campo JSON-array de IDs (longtext en BD). NULL/invalid → null. */
function parseIdArray(value) {
    if (value == null)
        return null;
    let arr = value;
    if (typeof value === 'string') {
        try {
            arr = JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    if (!Array.isArray(arr))
        return null;
    return arr.map((v) => Number(v)).filter((n) => !isNaN(n));
}
/**
 * Regla de cohorte: el campo NULL aplica a todos; si hay array, el id
 * seleccionado debe estar incluido. Si el usuario no ha seleccionado valor
 * (id null/undefined), la fila se acepta (cohorte sin restringir).
 */
function cohorteMatch(aplicables, seleccionadoId) {
    const ids = parseIdArray(aplicables);
    if (ids == null || ids.length === 0)
        return true;
    if (seleccionadoId == null)
        return true;
    return ids.includes(Number(seleccionadoId));
}
function matchCohorte(row, cohorte) {
    if (!cohorte)
        return true;
    return cohorteMatch(row.montajesAplicables, cohorte.montajeId)
        && cohorteMatch(row.proteccionesAplicables, cohorte.proteccionId)
        && cohorteMatch(row.controladoresAplicables, cohorte.controladorId);
}
async function loadLubricacionModelo(modeloId) {
    return database_1.prisma.lubricacion.findMany({
        where: { modeloComponenteId: modeloId },
        include: {
            consumible: {
                select: {
                    id: true, codigoInterno: true, nombre: true, tipo: true, subtipo: true,
                    fabricante: true, unidad: true, coste: true, precio: true,
                },
            },
            nivel: { select: { id: true, codigo: true, nombre: true } },
        },
        orderBy: [{ eje: 'asc' }, { id: 'asc' }],
    });
}
/**
 * Filas de lubricacion del plan: lifetime=0, nivel cubierto por el nivel
 * pedido, cohortes compatibles. nivelCodigo null = todas (sin filtrar nivel).
 */
async function getLubricacionPlan(modeloId, nivelCodigo, cohorte) {
    const rows = await loadLubricacionModelo(modeloId);
    const cubiertos = nivelCodigo ? new Set(nivelesCubiertos(nivelCodigo)) : null;
    return rows.filter((r) => {
        if (r.lifetime)
            return false;
        if (cubiertos) {
            if (!r.nivel?.codigo)
                return false;
            if (!cubiertos.has(r.nivel.codigo))
                return false;
        }
        return matchCohorte(r, cohorte);
    });
}
/** Todas las filas de lubricacion del modelo (incluye lifetime), con cohortes filtradas. */
async function getLubricacionModelo(modeloId, cohorte) {
    const rows = await loadLubricacionModelo(modeloId);
    return cohorte ? rows.filter((r) => matchCohorte(r, cohorte)) : rows;
}
// ===== ACTIVIDADES PREVENTIVAS =====
async function loadActividades() {
    return database_1.prisma.actividadPreventiva.findMany({
        include: {
            tipoActividad: { select: { id: true, codigo: true, nombre: true, categoria: true } },
            nivel: { select: { id: true, codigo: true, nombre: true } },
            consumibles: {
                include: {
                    consumible: {
                        select: {
                            id: true, codigoInterno: true, nombre: true, tipo: true, subtipo: true,
                            unidad: true, coste: true, precio: true,
                        },
                    },
                },
            },
        },
        orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    });
}
function actividadAplicaAModelo(act, modeloId) {
    const ids = parseIdArray(act.modelosAplicables);
    if (ids == null)
        return false; // sin modelos_aplicables no aplica a ningun modelo concreto
    return ids.includes(modeloId);
}
/**
 * Actividades preventivas aplicables a un modelo, opcionalmente filtradas por
 * nivel (cobertura) y cohorte. La tabla tiene ~60 filas: se filtra en JS para
 * evitar quirks de JSON_CONTAINS en MariaDB.
 */
async function getActividadesPlan(modeloId, nivelCodigo, cohorte, opts) {
    const all = await loadActividades();
    const cubiertos = nivelCodigo ? new Set(nivelesCubiertos(nivelCodigo)) : null;
    return all.filter((a) => {
        if (!actividadAplicaAModelo(a, modeloId))
            return false;
        if (cubiertos) {
            if (!a.nivel?.codigo)
                return false;
            if (!cubiertos.has(a.nivel.codigo))
                return false;
        }
        if (opts?.soloObligatorias && !a.obligatoria)
            return false;
        return matchCohorte(a, cohorte);
    });
}
// ===== HORAS =====
/** Horas de trabajo para (modelo, nivelId). 0 si no hay fila (D-073). */
async function getHorasModeloNivel(modeloId, nivelId) {
    const row = await database_1.prisma.mantenimientoHorasModelo.findFirst({
        where: { modeloComponenteId: modeloId, nivelId },
    });
    return row?.horas != null ? Number(row.horas) : 0;
}
/** Mapa nivelCodigo → horas para un modelo. */
async function getHorasModelo(modeloId) {
    const rows = await database_1.prisma.mantenimientoHorasModelo.findMany({
        where: { modeloComponenteId: modeloId },
        include: { nivel: { select: { codigo: true } } },
    });
    const map = new Map();
    for (const r of rows)
        map.set(r.nivel.codigo, Number(r.horas));
    return map;
}
/**
 * Nivel efectivo para un componente segun su tipo (D-073): el nivel
 * seleccionado por el usuario aplica al manipulador; controladores y drives
 * tienen su nivel propio fijo.
 */
function nivelEfectivoParaTipo(tipo, nivelSeleccionado) {
    switch (tipo) {
        case 'controller': return 'N_CTRL';
        case 'drive_unit': return 'N_DU';
        case 'external_axis':
            // El nivel global del sistema no mapea 1:1 a niveles de eje; usar N1_EJE
            // como nivel por defecto hasta que se carguen datos de ejes externos.
            return nivelSeleccionado ? 'N1_EJE' : null;
        default: return nivelSeleccionado;
    }
}
// ===== UNIDADES =====
/**
 * Convierte una cantidad a la unidad del consumible del catalogo, donde
 * coste/precio son por unidad base (€/L, €/kg, €/ud). La lubricacion guarda
 * cantidades en ml/g; el catalogo usa L/kg.
 */
function convertirCantidadAUnidadConsumible(cantidad, unidadOrigen, unidadConsumible) {
    const from = (unidadOrigen ?? '').toLowerCase().trim();
    const to = (unidadConsumible ?? '').toLowerCase().trim();
    if (!from || !to || from === to)
        return cantidad;
    if (from === 'ml' && to === 'l')
        return cantidad / 1000;
    if (from === 'l' && to === 'ml')
        return cantidad * 1000;
    if (from === 'g' && to === 'kg')
        return cantidad / 1000;
    if (from === 'kg' && to === 'g')
        return cantidad * 1000;
    // ml→kg / g→L: aproximar densidad 1 (aceites ≈0.9; margen aceptable en oferta)
    if (from === 'ml' && to === 'kg')
        return cantidad / 1000;
    if (from === 'g' && to === 'l')
        return cantidad / 1000;
    if ((from === 'pcs' || from === 'ud') && (to === 'pcs' || to === 'ud'))
        return cantidad;
    return cantidad;
}
/**
 * Lista agregada de consumibles del plan (lubricacion + actividades) para un
 * (modelo, nivel, cohorte). Guia v2.9 §5.3.
 */
async function getConsumiblesPlan(modeloId, nivelCodigo, cohorte) {
    const items = [];
    // Las cantidades se convierten a la unidad del catalogo (coste/precio son
    // por unidad base: €/L, €/kg, €/ud).
    const lubRows = await getLubricacionPlan(modeloId, nivelCodigo, cohorte);
    for (const row of lubRows) {
        if (!row.consumible)
            continue;
        const cantidad = convertirCantidadAUnidadConsumible(Number(row.cantidadValor ?? 0), row.cantidadUnidad, row.consumible.unidad);
        items.push({
            consumibleId: row.consumible.id,
            codigoInterno: row.consumible.codigoInterno,
            nombre: row.consumible.nombre,
            tipo: row.consumible.tipo,
            unidad: row.consumible.unidad ?? row.cantidadUnidad,
            cantidad,
            coste: row.consumible.coste != null ? Number(row.consumible.coste) : null,
            precio: row.consumible.precio != null ? Number(row.consumible.precio) : null,
            origen: 'lubricacion',
            detalle: `Eje ${row.eje}`,
            obligatoria: true,
        });
    }
    const actividades = await getActividadesPlan(modeloId, nivelCodigo, cohorte);
    for (const act of actividades) {
        for (const ac of act.consumibles) {
            const cantidad = convertirCantidadAUnidadConsumible(Number(ac.cantidad ?? 0), ac.unidad, ac.consumible.unidad);
            items.push({
                consumibleId: ac.consumible.id,
                codigoInterno: ac.consumible.codigoInterno,
                nombre: ac.consumible.nombre,
                tipo: ac.consumible.tipo,
                unidad: ac.consumible.unidad ?? ac.unidad,
                cantidad,
                coste: ac.consumible.coste != null ? Number(ac.consumible.coste) : null,
                precio: ac.consumible.precio != null ? Number(ac.consumible.precio) : null,
                origen: 'actividad',
                detalle: act.componente,
                obligatoria: act.obligatoria,
            });
        }
    }
    return items;
}
//# sourceMappingURL=planMantenimiento.js.map