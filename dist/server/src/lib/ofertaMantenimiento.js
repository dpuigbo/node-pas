"use strict";
// Logica de calculo para ofertas de mantenimiento por componente.
//
// Reglas:
// - tipo_oferta='mantenimiento': incluye consumibles regulares (aceites, baterias, filtros, etc) +
//   consumibles de limpieza por nivel + 15% extra de aceite para limpieza/merma.
// - tipo_oferta='solo_limpieza': solo consumibles de limpieza por nivel + 15% extra de aceite.
//
// El nivel determina la cantidad de aceite/baterias del consumibles_nivel:
// - mech_unit: '1' (sin aceite), '2_inferior' (ejes 1-4), '2_superior' (ejes 5-6), '3' (todos)
// - controller / drive_unit: '1' (cambio pilas)
// - external_axis: '1' (aceite reductor)
//
// Las opciones conBaterias y conAceite permiten al operario excluir esos costes.
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
/**
 * Calcula horas + costes para un componente concreto en un nivel dado.
 *
 * Lee:
 * - mantenimiento_horas_modelo (modelo, nivel) → horas + coste_limpieza
 * - consumibles_nivel (modelo, nivel) → consumibles regulares + precioOtros
 * - consumible_catalogo / aceite / consumible (legacy) → coste/precio unitario
 *
 * Aplica:
 * - LIMPIEZA_OIL_FACTOR (1.15) sobre cantidad de aceite (siempre, ambos tipos de oferta)
 * - Excluye baterias si conBaterias=false
 * - Excluye aceite si conAceite=false
 * - Si tipoOferta='solo_limpieza': solo cuenta el aceite × 0.15 (la merma) + costeLimpieza, no consumibles regulares
 */
async function calcularComponenteOferta(modeloId, nivel, opts) {
    const { tipoOferta, conBaterias, conAceite } = opts;
    // 1. Horas + coste limpieza desde mantenimiento_horas_modelo
    const horasRow = await database_1.prisma.mantenimientoHorasModelo.findUnique({
        where: { modeloComponenteId_nivel: { modeloComponenteId: modeloId, nivel } },
    });
    const costeLimpieza = dec(horasRow?.costeLimpieza) ?? 0;
    // 2. Consumibles regulares desde consumibles_nivel
    const cn = await database_1.prisma.consumibleNivel.findUnique({
        where: { modeloId_nivel: { modeloId, nivel } },
    });
    // Horas: prioridad mantenimiento_horas_modelo, fallback a consumibles_nivel.horas
    const horas = dec(horasRow?.horas) ?? dec(cn?.horas) ?? 0;
    let costeConsumibles = 0;
    let precioConsumibles = 0;
    if (cn?.consumibles) {
        const items = cn.consumibles;
        // Recolectar IDs de catalogo, aceites y consumibles legacy
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
        // Cargar precios + tipo
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
            // Filtros segun opciones
            if (tipoConsumible === 'bateria' && !conBaterias)
                continue;
            if (tipoConsumible === 'aceite' && !conAceite)
                continue;
            const coste = priceInfo.coste ?? 0;
            const precio = priceInfo.precio ?? 0;
            if (tipoOferta === 'solo_limpieza') {
                // Solo contamos la merma del aceite (15%); ignorar resto de consumibles regulares
                if (tipoConsumible === 'aceite') {
                    const cantidadMerma = it.cantidad * (LIMPIEZA_OIL_FACTOR - 1); // 0.15
                    costeConsumibles += coste * cantidadMerma;
                    precioConsumibles += precio * cantidadMerma;
                }
                // resto: skip
            }
            else {
                // mantenimiento: cantidad total con factor para aceite
                const cantidadFinal = tipoConsumible === 'aceite'
                    ? it.cantidad * LIMPIEZA_OIL_FACTOR
                    : it.cantidad;
                costeConsumibles += coste * cantidadFinal;
                precioConsumibles += precio * cantidadFinal;
            }
        }
        // precioOtros: solo aplica a tipo_oferta='mantenimiento'
        if (tipoOferta === 'mantenimiento') {
            const otros = dec(cn.precioOtros) ?? 0;
            costeConsumibles += otros;
            precioConsumibles += otros;
        }
    }
    return {
        horas,
        costeConsumibles: +costeConsumibles.toFixed(2),
        precioConsumibles: +precioConsumibles.toFixed(2),
        costeLimpieza: +costeLimpieza.toFixed(2),
    };
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
            nivelesAplicables: {
                include: { nivel: true },
                orderBy: { nivel: { orden: 'asc' } },
            },
            mantenimientoHoras: true,
            consumiblesNivel: { select: { nivel: true, consumibles: true } },
        },
    });
    if (!modelo)
        return [];
    const horasMap = new Map(modelo.mantenimientoHoras.map((h) => [h.nivel, h]));
    const consumiblesSet = new Set(modelo.consumiblesNivel
        .filter((c) => c.consumibles && Array.isArray(c.consumibles) && c.consumibles.length > 0)
        .map((c) => c.nivel));
    // Si hay datos explicitos en nivelesAplicables, usar esos
    if (modelo.nivelesAplicables.length > 0) {
        return modelo.nivelesAplicables.map((na) => ({
            codigo: na.nivel.codigo,
            nombre: na.nivel.nombre,
            orden: na.nivel.orden,
            horas: dec(horasMap.get(na.nivel.codigo)?.horas),
            costeLimpieza: dec(horasMap.get(na.nivel.codigo)?.costeLimpieza),
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
            horas: dec(horasMap.get(cod)?.horas),
            costeLimpieza: dec(horasMap.get(cod)?.costeLimpieza),
            tieneConsumibles: consumiblesSet.has(cod),
        };
    })
        .sort((a, b) => a.orden - b.orden);
}
//# sourceMappingURL=ofertaMantenimiento.js.map