"use strict";
/**
 * Validador de compatibilidad eje externo ↔ robot+controlador.
 *
 * v2.9: las tablas tri-via (compatibilidad_eje_permitida / _excluye /
 * _eje_controlador) y compatibilidad_robot_controlador fueron eliminadas.
 * La compatibilidad vive ahora en modelos_componente.controladores_compatibles
 * (array JSON de IDs de controladores).
 *
 * Se conservan las funciones puras evaluarReglas / evaluarRobotControlador
 * (con sus tests); los cargadores de BD construyen las reglas desde el JSON:
 *   - whitelist de controladores del eje = controladores_compatibles del eje
 *   - whitelist/blacklist de familias: sin datos en v2.9 (vacias = no aplican)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluarRobotControlador = evaluarRobotControlador;
exports.getControladoresCompatiblesFamilia = getControladoresCompatiblesFamilia;
exports.validarRobotControlador = validarRobotControlador;
exports.evaluarReglas = evaluarReglas;
exports.validarCompatibilidadEje = validarCompatibilidadEje;
exports.filtrarEjesCompatibles = filtrarEjesCompatibles;
const database_1 = require("../config/database");
const planMantenimiento_1 = require("./planMantenimiento");
/**
 * Funcion pura: dado un robot+controlador y la lista de controladores
 * compatibles para esa familia, decide si la combinacion es valida.
 */
function evaluarRobotControlador(controladorId, controladoresCompatibles, familiaCodigo) {
    if (controladoresCompatibles.length === 0) {
        return {
            ok: false,
            motivo: `La familia robot ${familiaCodigo ?? ''} no tiene controladores documentados como compatibles`.trim(),
            controladoresCompatibles: [],
        };
    }
    const ok = controladoresCompatibles.some(c => c.id === controladorId);
    if (!ok) {
        return {
            ok: false,
            motivo: `El robot ${familiaCodigo ?? ''} no es compatible con este cabinet. Compatibilidad documentada: ${controladoresCompatibles.map(c => c.nombre ?? c.id).join(', ')}`,
            controladoresCompatibles: controladoresCompatibles.map(c => ({ id: c.id, nombre: c.nombre ?? '' })),
        };
    }
    return { ok: true };
}
/**
 * Carga los controladores compatibles de una familia robot: union de los
 * arrays JSON controladores_compatibles de sus modelos activos.
 */
async function getControladoresCompatiblesFamilia(robotFamiliaId) {
    const modelos = await database_1.prisma.modeloComponente.findMany({
        where: { familiaId: robotFamiliaId, activa: true },
        select: { controladoresCompatibles: true },
    });
    const ids = new Set();
    for (const m of modelos) {
        for (const id of (0, planMantenimiento_1.parseIdArray)(m.controladoresCompatibles) ?? [])
            ids.add(id);
    }
    if (ids.size === 0)
        return [];
    const controladores = await database_1.prisma.modeloComponente.findMany({
        where: { id: { in: Array.from(ids) } },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
    });
    return controladores;
}
/**
 * Wrapper async que carga los controladores compatibles de la familia desde BD.
 */
async function validarRobotControlador(robotFamiliaId, controladorModeloId) {
    const familia = await database_1.prisma.luFamilia.findUnique({
        where: { id: robotFamiliaId },
        select: { codigo: true },
    });
    const compatibles = await getControladoresCompatiblesFamilia(robotFamiliaId);
    return evaluarRobotControlador(controladorModeloId, compatibles, familia?.codigo);
}
/**
 * Aplica las 3 reglas en orden estricto. Funcion pura: no lee BD.
 *
 * @param reglas las 3 listas para el eje (vacias = no aplica)
 * @param robotFamiliaId familia del robot al que se va a asociar el eje
 * @param controladorModeloId controlador del sistema
 */
function evaluarReglas(reglas, robotFamiliaId, controladorModeloId) {
    // Regla 1: whitelist de familias
    if (reglas.permitidas.length > 0) {
        if (robotFamiliaId == null) {
            return {
                ok: false,
                motivo: `Este eje requiere familia robot conocida; tiene whitelist activa: ${reglas.permitidas.map(p => p.codigo ?? p.familiaId).join(', ')}`,
                reglasAplicadas: {
                    permitidas: reglas.permitidas.map(p => ({ familiaId: p.familiaId, codigo: p.codigo ?? '' })),
                },
            };
        }
        const ok = reglas.permitidas.some(p => p.familiaId === robotFamiliaId);
        if (!ok) {
            return {
                ok: false,
                motivo: `Este eje solo es compatible con: ${reglas.permitidas.map(p => p.codigo ?? p.familiaId).join(', ')}`,
                reglasAplicadas: {
                    permitidas: reglas.permitidas.map(p => ({ familiaId: p.familiaId, codigo: p.codigo ?? '' })),
                },
            };
        }
    }
    // Regla 2: blacklist de familias
    if (robotFamiliaId != null && reglas.excluidas.length > 0) {
        const excl = reglas.excluidas.find(e => e.familiaId === robotFamiliaId);
        if (excl) {
            const motivoSuf = excl.motivo ? `: ${excl.motivo}` : '';
            return {
                ok: false,
                motivo: `Este eje no es compatible con la familia ${excl.codigo ?? excl.familiaId}${motivoSuf}`,
                reglasAplicadas: {
                    excluidas: [{ familiaId: excl.familiaId, codigo: excl.codigo ?? '', motivo: excl.motivo ?? null }],
                },
            };
        }
    }
    // Regla 3: whitelist de controladores
    if (reglas.controladoresRequeridos.length > 0) {
        const ok = reglas.controladoresRequeridos.some(c => c.id === controladorModeloId);
        if (!ok) {
            return {
                ok: false,
                motivo: `Este eje requiere uno de los siguientes controladores: ${reglas.controladoresRequeridos.map(c => c.nombre ?? c.id).join(', ')}`,
                reglasAplicadas: {
                    controladoresRequeridos: reglas.controladoresRequeridos.map(c => ({ id: c.id, nombre: c.nombre ?? '' })),
                },
            };
        }
    }
    return { ok: true };
}
/**
 * Carga las reglas para un eje desde BD (v2.9: solo whitelist de
 * controladores via JSON) y aplica el validador.
 */
async function validarCompatibilidadEje(input) {
    const { ejeId, robotFamiliaId, controladorModeloId } = input;
    const eje = await database_1.prisma.modeloComponente.findUnique({
        where: { id: ejeId },
        select: { controladoresCompatibles: true },
    });
    const ctrlIds = (0, planMantenimiento_1.parseIdArray)(eje?.controladoresCompatibles) ?? [];
    const controladores = ctrlIds.length > 0
        ? await database_1.prisma.modeloComponente.findMany({
            where: { id: { in: ctrlIds } },
            select: { id: true, nombre: true },
        })
        : [];
    return evaluarReglas({
        permitidas: [],
        excluidas: [],
        controladoresRequeridos: controladores,
    }, robotFamiliaId ?? null, controladorModeloId);
}
/**
 * Filtra una lista de candidatos (ejes externos) aplicando el validador a
 * cada uno. Los candidatos llevan el JSON controladoresCompatibles cargado.
 */
function filtrarEjesCompatibles(candidatos, robotFamiliaId, controladorModeloId) {
    return candidatos.filter(eje => {
        const ctrlIds = (0, planMantenimiento_1.parseIdArray)(eje.controladoresCompatibles) ?? [];
        const result = evaluarReglas({
            permitidas: [],
            excluidas: [],
            controladoresRequeridos: ctrlIds.map(id => ({ id })),
        }, robotFamiliaId, controladorModeloId);
        return result.ok;
    });
}
//# sourceMappingURL=validarCompatibilidadEje.js.map