"use strict";
// Logica de calculo para ofertas de mantenimiento por componente (BD v2.9).
//
// El frontend trabaja con codigos canonicos de nivel (N1, N2_INF, N2_SUP, N3,
// N_CTRL, N_DU, N0_EJE, N1_EJE, N2_EJE). Internamente se traduce a nivel_id.
//
// Reglas v2.9:
// - Horas: mantenimiento_horas_modelo (1 fila = modelo + nivel, D-073). El
//   total del sistema se obtiene sumando manipulador + controlador.
// - Consumibles del plan = lubricacion (lifetime=0, nivel cubierto) +
//   consumibles de actividad_preventiva (modelos_aplicables, nivel cubierto).
// - tipo_oferta='solo_limpieza': solo 15% extra de aceite (merma) +
//   consumibles de tipo limpieza.
// - Los consumibles de tipo 'limpieza' se acumulan en costeLimpieza (no en
//   costeConsumibles) para mantener el desglose de la UI.
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarCodigoNivel = void 0;
exports.calcularComponenteOferta = calcularComponenteOferta;
exports.getNivelesAplicablesModelo = getNivelesAplicablesModelo;
exports.decToNumber = dec;
const database_1 = require("../config/database");
const niveles_1 = require("./niveles");
Object.defineProperty(exports, "normalizarCodigoNivel", { enumerable: true, get: function () { return niveles_1.normalizarCodigoNivel; } });
const planMantenimiento_1 = require("./planMantenimiento");
const LIMPIEZA_OIL_FACTOR = 1.15;
function dec(v) {
    if (v == null)
        return null;
    return Number(v);
}
function acumularConsumible(acc, consumible, cantidadOrigen, unidadOrigen, opts) {
    const { tipoOferta, conBaterias, conAceite } = opts;
    const tipo = consumible.tipo;
    // coste/precio del catalogo son por unidad base (€/L, €/kg, €/ud)
    const cantidadBase = (0, planMantenimiento_1.convertirCantidadAUnidadConsumible)(cantidadOrigen, unidadOrigen, consumible.unidad);
    const esLubricante = tipo === 'aceite' || tipo === 'grasa';
    if (tipo === 'bateria' && !conBaterias)
        return;
    if (esLubricante && !conAceite)
        return;
    const costeUnit = Number(consumible.coste ?? 0);
    const precioUnit = Number(consumible.precio ?? 0);
    if (tipoOferta === 'solo_limpieza') {
        if (esLubricante) {
            // Solo la merma del 15% sobre el aceite
            const cant = cantidadBase * (LIMPIEZA_OIL_FACTOR - 1);
            acc.coste += costeUnit * cant;
            acc.precio += precioUnit * cant;
        }
        else if (tipo === 'limpieza') {
            acc.costeLimpieza += costeUnit * cantidadBase;
            acc.precioLimpieza += precioUnit * cantidadBase;
        }
        return;
    }
    const cant = esLubricante ? cantidadBase * LIMPIEZA_OIL_FACTOR : cantidadBase;
    if (tipo === 'limpieza') {
        acc.costeLimpieza += costeUnit * cant;
        acc.precioLimpieza += precioUnit * cant;
    }
    else {
        acc.coste += costeUnit * cant;
        acc.precio += precioUnit * cant;
    }
}
/**
 * Calcula horas + costes para un componente concreto en un nivel dado.
 * @param nivelCodigo codigo canonico del nivel (N1, N3, N_CTRL, etc.)
 */
async function calcularComponenteOferta(modeloId, nivelCodigo, opts, controladorModeloId) {
    const nivelId = await (0, niveles_1.nivelIdFromCodigo)(nivelCodigo);
    if (nivelId == null) {
        return { horas: 0, costeConsumibles: 0, precioConsumibles: 0, costeLimpieza: 0 };
    }
    const cohorte = { ...(opts.cohorte ?? {}) };
    if (cohorte.controladorId == null && controladorModeloId != null) {
        cohorte.controladorId = controladorModeloId;
    }
    const horas = await (0, planMantenimiento_1.getHorasModeloNivel)(modeloId, nivelId);
    const acc = { coste: 0, precio: 0, costeLimpieza: 0, precioLimpieza: 0 };
    // 1) Lubricacion del plan (cambios de aceite/grasa por eje)
    const lubRows = await (0, planMantenimiento_1.getLubricacionPlan)(modeloId, nivelCodigo, cohorte);
    for (const row of lubRows) {
        if (!row.consumible)
            continue;
        acumularConsumible(acc, row.consumible, Number(row.cantidadValor ?? 0), row.cantidadUnidad, opts);
    }
    // 2) Consumibles de las actividades preventivas aplicables
    const actividades = await (0, planMantenimiento_1.getActividadesPlan)(modeloId, nivelCodigo, cohorte);
    for (const act of actividades) {
        const cat = act.tipoActividad.categoria;
        // Actividades opcionales: respetar toggles por categoria
        if (!act.obligatoria) {
            if (cat === 'bateria' && !opts.conBaterias)
                continue;
            if (cat === 'lubricacion' && !opts.conAceite)
                continue;
        }
        for (const ac of act.consumibles) {
            acumularConsumible(acc, ac.consumible, Number(ac.cantidad ?? 0), ac.unidad, opts);
        }
    }
    return {
        horas: +horas.toFixed(2),
        costeConsumibles: +acc.coste.toFixed(2),
        precioConsumibles: +acc.precio.toFixed(2),
        costeLimpieza: +acc.costeLimpieza.toFixed(2),
    };
}
/**
 * Devuelve los niveles aplicables para un modelo (codigos canonicos + horas).
 *
 * Fuente de verdad (D-075): flags nivel_n1/n2_inf/n2_sup/n3 en
 * modelos_componente para manipuladores; para controller/drive_unit/
 * external_axis se usa el fallback por tipo (N_CTRL, N_DU, N*_EJE).
 */
async function getNivelesAplicablesModelo(modeloId) {
    const modelo = await database_1.prisma.modeloComponente.findUnique({
        where: { id: modeloId },
        select: {
            tipo: true,
            nivelN1: true,
            nivelN2Inf: true,
            nivelN2Sup: true,
            nivelN3: true,
        },
    });
    if (!modelo)
        return [];
    const horasMap = await (0, planMantenimiento_1.getHorasModelo)(modeloId);
    // Niveles con consumibles: lubricacion no-lifetime o actividades con consumibles
    const lubPlan = await (0, planMantenimiento_1.getLubricacionPlan)(modeloId, null);
    const actividades = await (0, planMantenimiento_1.getActividadesPlan)(modeloId, null);
    const nivelesConConsumibles = new Set();
    for (const l of lubPlan) {
        if (l.nivel?.codigo)
            nivelesConConsumibles.add(l.nivel.codigo);
    }
    for (const a of actividades) {
        if (a.nivel?.codigo && a.consumibles.length > 0)
            nivelesConConsumibles.add(a.nivel.codigo);
    }
    let codigos;
    if (modelo.tipo === 'mechanical_unit') {
        codigos = [];
        if (modelo.nivelN1)
            codigos.push('N1');
        if (modelo.nivelN2Inf)
            codigos.push('N2_INF');
        if (modelo.nivelN2Sup)
            codigos.push('N2_SUP');
        if (modelo.nivelN3)
            codigos.push('N3');
        if (codigos.length === 0)
            codigos = (0, niveles_1.getNivelesPermitidos)(modelo.tipo);
    }
    else {
        codigos = (0, niveles_1.getNivelesPermitidos)(modelo.tipo);
    }
    if (codigos.length === 0)
        return [];
    const niveles = await database_1.prisma.luNivelMantenimiento.findMany({
        where: { codigo: { in: codigos } },
        orderBy: { orden: 'asc' },
    });
    const nivelMap = new Map(niveles.map((n) => [n.codigo, n]));
    return codigos
        .map((cod, idx) => {
        const n = nivelMap.get(cod);
        // Un nivel "tiene consumibles" si alguno de los niveles que cubre los tiene
        const cubiertos = new Set([cod]);
        if (cod === 'N2_INF' || cod === 'N2_SUP')
            cubiertos.add('N1');
        if (cod === 'N3') {
            cubiertos.add('N1');
            cubiertos.add('N2_INF');
            cubiertos.add('N2_SUP');
        }
        const tiene = [...cubiertos].some((c) => nivelesConConsumibles.has(c));
        return {
            codigo: cod,
            nombre: n?.nombre ?? `Nivel ${cod}`,
            orden: n?.orden ?? idx,
            horas: horasMap.get(cod) ?? null,
            costeLimpieza: null,
            tieneConsumibles: tiene,
        };
    })
        .sort((a, b) => a.orden - b.orden);
}
//# sourceMappingURL=ofertaMantenimiento.js.map