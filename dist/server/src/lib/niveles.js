"use strict";
// Backend: utilidades de niveles de mantenimiento.
//
// Despues del refactor v2 (SQL 28), los niveles canonicos son los codigos
// de la tabla lu_nivel_mantenimiento. El API publico sigue trabajando con
// codigos string (N1, N2_INF, ...); el backend traduce a nivel_id (FK)
// cuando guarda en BD.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNivelesPermitidos = getNivelesPermitidos;
exports.getNivelDefault = getNivelDefault;
exports.normalizarCodigoNivel = normalizarCodigoNivel;
exports.getNivelesFijos = getNivelesFijos;
exports.ensureNivelesFijos = ensureNivelesFijos;
exports.invalidateNivelesCache = invalidateNivelesCache;
exports.nivelIdFromCodigo = nivelIdFromCodigo;
exports.nivelCodigoFromId = nivelCodigoFromId;
exports.nivelInfoFromId = nivelInfoFromId;
const database_1 = require("../config/database");
/** Codigos canonicos por tipo de componente (lu_familia.tipo) */
const NIVELES_PERMITIDOS = {
    controller: ['N_CTRL'],
    drive_unit: ['N_DU'],
    external_axis: ['N0_EJE', 'N1_EJE', 'N2_EJE'],
    mechanical_unit: ['N1', 'N2_INF', 'N2_SUP', 'N3'],
};
/** Codigo "fijo" por defecto para cada tipo (el primero permitido) */
const NIVEL_DEFAULT = {
    controller: 'N_CTRL',
    drive_unit: 'N_DU',
    external_axis: 'N1_EJE',
    mechanical_unit: 'N1',
};
/** Mapping de codigos legacy (pre-SQL 28) a canonicos */
const LEGACY_MAP = {
    '1': 'N1',
    '2_inferior': 'N2_INF',
    '2_superior': 'N2_SUP',
    '3': 'N3',
    '2': 'N2_EJE', // eje externo nivel 2 antiguo
};
/** Niveles permitidos para un tipo de componente (codigos canonicos) */
function getNivelesPermitidos(tipo) {
    return NIVELES_PERMITIDOS[tipo] ?? NIVELES_PERMITIDOS.mechanical_unit;
}
/** Codigo por defecto para un tipo de componente */
function getNivelDefault(tipo) {
    return NIVEL_DEFAULT[tipo] ?? NIVEL_DEFAULT.mechanical_unit;
}
/** Normaliza un codigo legacy a canonico (idempotente para codigos ya nuevos) */
function normalizarCodigoNivel(codigo) {
    if (!codigo)
        return null;
    return LEGACY_MAP[codigo] ?? codigo;
}
/** Compatibilidad: niveles fijos de un tipo (devuelve array con uno: el default) */
function getNivelesFijos(tipo) {
    return [getNivelDefault(tipo)];
}
/**
 * Ensures a niveles CSV string includes the default level for the given type
 * and only contains permitted levels. Returns the cleaned CSV.
 */
function ensureNivelesFijos(tipo, nivelesCSV) {
    const def = getNivelDefault(tipo);
    const permitidos = getNivelesPermitidos(tipo);
    if (!nivelesCSV)
        return def;
    const current = nivelesCSV.split(',').map((s) => normalizarCodigoNivel(s.trim()) ?? '').filter(Boolean);
    const merged = [...new Set([def, ...current])];
    const valid = merged.filter((n) => permitidos.includes(n));
    return valid.join(',');
}
// ===== Cache de codigo<->id de lu_nivel_mantenimiento =====
let codigoToId = null;
let idToInfo = null;
async function loadCache() {
    if (codigoToId && idToInfo)
        return;
    const niveles = await database_1.prisma.luNivelMantenimiento.findMany({
        select: { id: true, codigo: true, nombre: true, ambito: true, orden: true },
    });
    codigoToId = new Map();
    idToInfo = new Map();
    for (const n of niveles) {
        codigoToId.set(n.codigo, n.id);
        idToInfo.set(n.id, { codigo: n.codigo, nombre: n.nombre, ambito: n.ambito, orden: n.orden });
    }
}
/** Invalida la cache (util tras cambios al seed de niveles) */
function invalidateNivelesCache() {
    codigoToId = null;
    idToInfo = null;
}
/** Codigo canonico -> id en BD. null si codigo es null o no existe */
async function nivelIdFromCodigo(codigo) {
    if (!codigo)
        return null;
    const norm = normalizarCodigoNivel(codigo);
    if (!norm)
        return null;
    await loadCache();
    return codigoToId.get(norm) ?? null;
}
/** id -> codigo. null si id no existe */
async function nivelCodigoFromId(id) {
    if (id == null)
        return null;
    await loadCache();
    return idToInfo.get(id)?.codigo ?? null;
}
/** id -> info completa */
async function nivelInfoFromId(id) {
    if (id == null)
        return null;
    await loadCache();
    return idToInfo.get(id) ?? null;
}
//# sourceMappingURL=niveles.js.map