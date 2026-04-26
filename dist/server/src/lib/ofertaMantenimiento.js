"use strict";
// Logica de calculo para ofertas de mantenimiento por componente.
//
// Reglas:
// - tipo_oferta='mantenimiento': aceites/grasas/baterias extraidos de
//   actividad_preventiva (filtrados por nivel) + consumibles de limpieza
//   por modelo + 15% extra de aceite para limpieza/merma.
// - tipo_oferta='solo_limpieza': solo 15% extra de aceite (merma) +
//   consumibles de limpieza.
//
// Horas:
// - mantenimiento_horas_familia: por (familia, modelo opcional, nivel).
//   Para mech_unit/eje/drive se busca con modelo=NULL (toda la familia).
//   Para controlador se busca por modelo concreto (variante).
// - Fallback legacy: mantenimiento_horas_modelo y consumibles_nivel.horas
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularComponenteOferta = calcularComponenteOferta;
exports.getNivelesAplicablesModelo = getNivelesAplicablesModelo;
const database_1 = require("../config/database");
const niveles_1 = require("./niveles");
const LIMPIEZA_OIL_FACTOR = 1.15; // 15% extra para limpieza y merma
function dec(v) {
    if (v == null)
        return null;
    return Number(v);
}
function nivelMatches(actividadNiveles, nivelActual) {
    // Vacio = aplica siempre
    if (!actividadNiveles || actividadNiveles.trim() === '')
        return true;
    const niveles = actividadNiveles.split(',').map((s) => s.trim()).filter(Boolean);
    return niveles.length === 0 || niveles.includes(nivelActual);
}
/** Lookup horas en cascada: familia+modelo > familia > legacy modelo > legacy nivel */
async function lookupHoras(modeloId, familiaId, nivel) {
    // Por variante (controlador): familia + modelo concreto
    if (familiaId != null) {
        const variante = await database_1.prisma.mantenimientoHorasFamilia.findFirst({
            where: { familiaId, modeloComponenteId: modeloId, nivel },
        });
        if (variante?.horas != null)
            return Number(variante.horas);
        // Por familia (mech_unit/eje/drive)
        const familia = await database_1.prisma.mantenimientoHorasFamilia.findFirst({
            where: { familiaId, modeloComponenteId: null, nivel },
        });
        if (familia?.horas != null)
            return Number(familia.horas);
    }
    // Legacy: mantenimiento_horas_modelo
    const legacy = await database_1.prisma.mantenimientoHorasModelo.findUnique({
        where: { modeloComponenteId_nivel: { modeloComponenteId: modeloId, nivel } },
    });
    if (legacy?.horas != null)
        return Number(legacy.horas);
    // Legacy ultimo: consumibles_nivel.horas
    const cn = await database_1.prisma.consumibleNivel.findUnique({
        where: { modeloId_nivel: { modeloId, nivel } },
    });
    if (cn?.horas != null)
        return Number(cn.horas);
    return 0;
}
/** Suma coste/precio de los consumibles de limpieza del modelo */
async function calcLimpieza(modeloId, tipoOferta) {
    // Path nuevo: consumibles_limpieza_modelo
    const items = await database_1.prisma.consumibleLimpiezaModelo.findMany({
        where: { modeloComponenteId: modeloId },
        include: { consumible: true },
    });
    if (items.length > 0) {
        let coste = 0;
        let precio = 0;
        for (const it of items) {
            const cant = Number(it.cantidad);
            coste += (Number(it.consumible.coste ?? 0)) * cant;
            precio += (Number(it.consumible.precio ?? 0)) * cant;
        }
        return { coste: +coste.toFixed(2), precio: +precio.toFixed(2) };
    }
    // Fallback legacy: mantenimiento_horas_modelo.coste_limpieza
    const legacy = await database_1.prisma.mantenimientoHorasModelo.findFirst({
        where: { modeloComponenteId: modeloId },
        select: { costeLimpieza: true },
    });
    const costeLegacy = dec(legacy?.costeLimpieza) ?? 0;
    // Sin precio_venta separado en legacy: usar el mismo
    return tipoOferta === 'mantenimiento'
        ? { coste: costeLegacy, precio: costeLegacy }
        : { coste: costeLegacy, precio: costeLegacy };
}
/**
 * Suma consumibles (aceites/grasas/baterias/etc) extraidos de actividad_preventiva
 * de la familia del modelo, filtrados por nivel.
 */
async function calcConsumiblesActividad(familiaId, nivel, conBaterias, conAceite, tipoOferta) {
    const actividades = await database_1.prisma.actividadPreventiva.findMany({
        where: { familiaId },
        select: {
            niveles: true,
            consumibles: {
                include: { consumible: true },
            },
        },
    });
    let coste = 0;
    let precio = 0;
    for (const act of actividades) {
        if (!nivelMatches(act.niveles, nivel))
            continue;
        for (const ac of act.consumibles) {
            const tipo = ac.consumible.tipo;
            if (tipo === 'bateria' && !conBaterias)
                continue;
            if (tipo === 'aceite' && !conAceite)
                continue;
            const cantBase = Number(ac.cantidad ?? 0);
            const costeUnit = Number(ac.consumible.coste ?? 0);
            const precioUnit = Number(ac.consumible.precio ?? 0);
            if (tipoOferta === 'solo_limpieza') {
                // Solo contamos la merma del aceite (15%)
                if (tipo === 'aceite') {
                    const cant = cantBase * (LIMPIEZA_OIL_FACTOR - 1);
                    coste += costeUnit * cant;
                    precio += precioUnit * cant;
                }
            }
            else {
                const cant = tipo === 'aceite' ? cantBase * LIMPIEZA_OIL_FACTOR : cantBase;
                coste += costeUnit * cant;
                precio += precioUnit * cant;
            }
        }
    }
    return { coste: +coste.toFixed(2), precio: +precio.toFixed(2) };
}
/**
 * Calcula horas + costes para un componente concreto en un nivel dado.
 */
async function calcularComponenteOferta(modeloId, nivel, opts) {
    const { tipoOferta, conBaterias, conAceite } = opts;
    const modelo = await database_1.prisma.modeloComponente.findUnique({
        where: { id: modeloId },
        select: { familiaId: true },
    });
    const familiaId = modelo?.familiaId ?? null;
    // 1. Horas con cascada de fallbacks
    const horas = await lookupHoras(modeloId, familiaId, nivel);
    // 2. Consumibles de limpieza
    const limpieza = await calcLimpieza(modeloId, tipoOferta);
    const costeLimpieza = limpieza.coste;
    // 3. Consumibles aceite/grasa/baterias desde actividad_preventiva (familia)
    let costeConsumibles = 0;
    let precioConsumibles = 0;
    if (familiaId != null) {
        const desdeActividad = await calcConsumiblesActividad(familiaId, nivel, conBaterias, conAceite, tipoOferta);
        costeConsumibles += desdeActividad.coste;
        precioConsumibles += desdeActividad.precio;
    }
    // 4. Si no hubo actividades con niveles definidos, fallback a consumibles_nivel.consumibles
    if (costeConsumibles === 0 && precioConsumibles === 0) {
        const fallback = await calcConsumiblesNivelLegacy(modeloId, nivel, opts);
        costeConsumibles += fallback.coste;
        precioConsumibles += fallback.precio;
    }
    return {
        horas: +horas.toFixed(2),
        costeConsumibles: +costeConsumibles.toFixed(2),
        precioConsumibles: +precioConsumibles.toFixed(2),
        costeLimpieza: +costeLimpieza.toFixed(2),
    };
}
/**
 * Fallback legacy: leer consumibles_nivel.consumibles (formato JSON con
 * referencias a aceites/consumibles legacy o consumible_catalogo)
 */
async function calcConsumiblesNivelLegacy(modeloId, nivel, opts) {
    const { tipoOferta, conBaterias, conAceite } = opts;
    const cn = await database_1.prisma.consumibleNivel.findUnique({
        where: { modeloId_nivel: { modeloId, nivel } },
    });
    if (!cn?.consumibles)
        return { coste: 0, precio: 0 };
    const items = cn.consumibles;
    const catalogoIds = new Set();
    const aceiteIds = new Set();
    const consumibleIds = new Set();
    for (const it of items) {
        if (it.consumibleId && it.consumibleId > 0)
            catalogoIds.add(it.consumibleId);
        else if (it.id && it.id > 0) {
            if (it.tipo === 'aceite')
                aceiteIds.add(it.id);
            else
                consumibleIds.add(it.id);
        }
    }
    const catalogoMap = new Map();
    const aceiteMap = new Map();
    const consumibleMap = new Map();
    if (catalogoIds.size > 0) {
        const rows = await database_1.prisma.consumibleCatalogo.findMany({
            where: { id: { in: Array.from(catalogoIds) } },
        });
        for (const r of rows)
            catalogoMap.set(r.id, { coste: dec(r.coste), precio: dec(r.precio), tipo: r.tipo });
    }
    if (aceiteIds.size > 0) {
        const rows = await database_1.prisma.aceite.findMany({
            where: { id: { in: Array.from(aceiteIds) } },
            include: { consumible: true },
        });
        for (const r of rows)
            aceiteMap.set(r.id, {
                coste: dec(r.consumible?.coste ?? r.coste),
                precio: dec(r.consumible?.precio ?? r.precio),
            });
    }
    if (consumibleIds.size > 0) {
        const rows = await database_1.prisma.consumible.findMany({
            where: { id: { in: Array.from(consumibleIds) } },
            include: { consumible: true },
        });
        for (const r of rows)
            consumibleMap.set(r.id, {
                coste: dec(r.consumible?.coste ?? r.coste),
                precio: dec(r.consumible?.precio ?? r.precio),
                tipo: r.tipo,
            });
    }
    let coste = 0;
    let precio = 0;
    for (const it of items) {
        let priceInfo;
        let tipoConsumible = 'otro';
        if (it.consumibleId && it.consumibleId > 0) {
            const c = catalogoMap.get(it.consumibleId);
            if (c) {
                priceInfo = c;
                tipoConsumible = c.tipo;
            }
        }
        else if (it.id && it.id > 0) {
            if (it.tipo === 'aceite') {
                priceInfo = aceiteMap.get(it.id);
                tipoConsumible = 'aceite';
            }
            else {
                const c = consumibleMap.get(it.id);
                if (c) {
                    priceInfo = c;
                    tipoConsumible = c.tipo;
                }
            }
        }
        if (!priceInfo)
            continue;
        if (tipoConsumible === 'bateria' && !conBaterias)
            continue;
        if (tipoConsumible === 'aceite' && !conAceite)
            continue;
        const costeUnit = priceInfo.coste ?? 0;
        const precioUnit = priceInfo.precio ?? 0;
        if (tipoOferta === 'solo_limpieza') {
            if (tipoConsumible === 'aceite') {
                const cant = it.cantidad * (LIMPIEZA_OIL_FACTOR - 1);
                coste += costeUnit * cant;
                precio += precioUnit * cant;
            }
        }
        else {
            const cant = tipoConsumible === 'aceite' ? it.cantidad * LIMPIEZA_OIL_FACTOR : it.cantidad;
            coste += costeUnit * cant;
            precio += precioUnit * cant;
        }
    }
    // precioOtros (legacy): solo en mantenimiento
    if (tipoOferta === 'mantenimiento') {
        const otros = dec(cn.precioOtros) ?? 0;
        coste += otros;
        precio += otros;
    }
    return { coste, precio };
}
/**
 * Devuelve los niveles aplicables para un modelo (ordenados por orden).
 *
 * Prioridad:
 * 1. modelo_nivel_aplicable (v2 catalog explicit)
 * 2. Fallback al CSV legacy `niveles` del modelo
 * 3. Fallback ultimo: niveles permitidos para el tipo
 */
async function getNivelesAplicablesModelo(modeloId) {
    const modelo = await database_1.prisma.modeloComponente.findUnique({
        where: { id: modeloId },
        select: {
            tipo: true,
            niveles: true,
            familiaId: true,
            nivelesAplicables: {
                include: { nivel: true },
                orderBy: { nivel: { orden: 'asc' } },
            },
            mantenimientoHoras: true,
            mantenimientoHorasFamilia: true,
            consumiblesNivel: { select: { nivel: true, consumibles: true } },
        },
    });
    if (!modelo)
        return [];
    // Mapa de horas: prioridad modelo (legacy) > familia (modelo concreto) > familia (general)
    const horasMap = new Map();
    // Legacy modelo
    for (const h of modelo.mantenimientoHoras) {
        horasMap.set(h.nivel, dec(h.horas));
    }
    // Familia con modelo concreto (variante de controlador)
    for (const h of modelo.mantenimientoHorasFamilia) {
        if (h.modeloComponenteId === modeloId) {
            const cur = horasMap.get(h.nivel);
            if (cur == null)
                horasMap.set(h.nivel, dec(h.horas));
        }
    }
    // Si tiene familia, traer tambien las horas de la familia genericas (modelo=null)
    if (modelo.familiaId) {
        const generales = await database_1.prisma.mantenimientoHorasFamilia.findMany({
            where: { familiaId: modelo.familiaId, modeloComponenteId: null },
        });
        for (const h of generales) {
            if (!horasMap.has(h.nivel))
                horasMap.set(h.nivel, dec(h.horas));
        }
    }
    const consumiblesSet = new Set(modelo.consumiblesNivel
        .filter((c) => c.consumibles && Array.isArray(c.consumibles) && c.consumibles.length > 0)
        .map((c) => c.nivel));
    // Si hay datos explicitos en nivelesAplicables, usar esos
    if (modelo.nivelesAplicables.length > 0) {
        return modelo.nivelesAplicables.map((na) => ({
            codigo: na.nivel.codigo,
            nombre: na.nivel.nombre,
            orden: na.nivel.orden,
            horas: horasMap.get(na.nivel.codigo) ?? null,
            costeLimpieza: null,
            tieneConsumibles: consumiblesSet.has(na.nivel.codigo),
        }));
    }
    // Fallback: parsear CSV legacy + buscar metadatos en lu_nivel_mantenimiento
    let codigos = (modelo.niveles ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    // Ultimo fallback: niveles permitidos por tipo de componente
    if (codigos.length === 0) {
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
        return {
            codigo: cod,
            nombre: n?.nombre ?? `Nivel ${cod}`,
            orden: n?.orden ?? idx,
            horas: horasMap.get(cod) ?? null,
            costeLimpieza: null,
            tieneConsumibles: consumiblesSet.has(cod),
        };
    })
        .sort((a, b) => a.orden - b.orden);
}
//# sourceMappingURL=ofertaMantenimiento.js.map