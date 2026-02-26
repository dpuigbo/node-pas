"use strict";
// Backend version of maintenance level rules per component type
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNivelesFijos = getNivelesFijos;
exports.getNivelesPermitidos = getNivelesPermitidos;
exports.ensureNivelesFijos = ensureNivelesFijos;
/** Fixed (mandatory) levels for each component type */
const NIVELES_FIJOS = {
    controller: ['1'],
    drive_unit: ['1'],
    external_axis: ['1'],
    mechanical_unit: ['1'],
};
/** All possible levels per component type */
const NIVELES_PERMITIDOS = {
    controller: ['1'],
    drive_unit: ['1'],
    external_axis: ['1', '2'],
    mechanical_unit: ['1', '2_inferior', '2_superior', '3'],
};
/** Returns the fixed (mandatory) levels for a component type */
function getNivelesFijos(tipo) {
    return NIVELES_FIJOS[tipo] ?? NIVELES_FIJOS.mechanical_unit;
}
/** Returns all permitted levels for a component type */
function getNivelesPermitidos(tipo) {
    return NIVELES_PERMITIDOS[tipo] ?? NIVELES_PERMITIDOS.mechanical_unit;
}
/**
 * Ensures a niveles CSV string includes all fixed levels for the given type
 * and only contains permitted levels. Returns the cleaned CSV.
 */
function ensureNivelesFijos(tipo, nivelesCSV) {
    const fijos = getNivelesFijos(tipo);
    const permitidos = getNivelesPermitidos(tipo);
    if (!nivelesCSV)
        return fijos.join(',');
    const current = nivelesCSV.split(',').map((s) => s.trim()).filter(Boolean);
    // Add any missing fijos
    const merged = [...new Set([...fijos, ...current])];
    // Filter to only permitted levels for this tipo
    const valid = merged.filter((n) => permitidos.includes(n));
    return valid.join(',');
}
//# sourceMappingURL=niveles.js.map