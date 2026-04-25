"use strict";
/**
 * Validador de compatibilidad eje externo ↔ robot+controlador.
 *
 * Modelo tri-via (script 03_seed_catalogo.sql):
 *
 *   1. compatibilidad_eje_permitida — whitelist de familias robot
 *      "Este eje funciona SOLO con estas familias"
 *      Ej: IRBT 4004 → solo IRB 4400, 4450S, 4600
 *
 *   2. compatibilidad_eje_excluye — blacklist de familias robot
 *      "Este eje funciona con TODOS EXCEPTO estas familias"
 *      Ej: IRBP A/B/C/D/K/L/R → excluyen IRB 120 (motivo: pequeño)
 *
 *   3. compatibilidad_eje_controlador — whitelist de controladores
 *      "Este eje requiere uno de estos controladores especificos"
 *      Ej: IRP A/B/... → V250XT o V400XT
 *
 * Las tres reglas se aplican en paralelo. Tabla vacia = no aplica.
 *
 * Orden de evaluacion:
 *   whitelist familias → blacklist familias → whitelist controladores
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluarRobotControlador = evaluarRobotControlador;
exports.validarRobotControlador = validarRobotControlador;
exports.evaluarReglas = evaluarReglas;
exports.validarCompatibilidadEje = validarCompatibilidadEje;
exports.filtrarEjesCompatibles = filtrarEjesCompatibles;
const database_1 = require("../config/database");
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
 * Wrapper async que carga los controladores compatibles de la familia desde BD.
 */
async function validarRobotControlador(robotFamiliaId, controladorModeloId) {
    const familia = await database_1.prisma.luFamilia.findUnique({
        where: { id: robotFamiliaId },
        select: { codigo: true },
    });
    const compatibles = await database_1.prisma.compatibilidadRobotControlador.findMany({
        where: { robotFamiliaId },
        include: { controlador: { select: { nombre: true } } },
    });
    return evaluarRobotControlador(controladorModeloId, compatibles.map(c => ({ id: c.controladorModeloId, nombre: c.controlador.nombre })), familia?.codigo);
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
 * Carga las reglas tri-via para un eje desde BD y aplica el validador.
 */
async function validarCompatibilidadEje(input) {
    const { ejeId, robotFamiliaId, controladorModeloId } = input;
    const [permitidas, excluidas, ctrlReq] = await Promise.all([
        database_1.prisma.compatibilidadEjePermitida.findMany({
            where: { ejeModeloId: ejeId },
            include: { familia: { select: { codigo: true } } },
        }),
        database_1.prisma.compatibilidadEjeExcluye.findMany({
            where: { ejeModeloId: ejeId },
            include: { familia: { select: { codigo: true } } },
        }),
        database_1.prisma.compatibilidadEjeControlador.findMany({
            where: { ejeModeloId: ejeId },
            include: { controlador: { select: { nombre: true } } },
        }),
    ]);
    return evaluarReglas({
        permitidas: permitidas.map(p => ({ familiaId: p.familiaId, codigo: p.familia.codigo })),
        excluidas: excluidas.map(e => ({ familiaId: e.familiaId, codigo: e.familia.codigo, motivo: e.motivo })),
        controladoresRequeridos: ctrlReq.map(c => ({ id: c.controladorModeloId, nombre: c.controlador.nombre })),
    }, robotFamiliaId ?? null, controladorModeloId);
}
/**
 * Filtra una lista de candidatos (ejes externos) aplicando el validador
 * a cada uno. Devuelve solo los que pasan las 3 reglas.
 *
 * Asume que cada candidato ya viene con las relaciones tri-via incluidas:
 *   compatEjePermitida, compatEjeExcluye, compatEjeControladorEje
 */
function filtrarEjesCompatibles(candidatos, robotFamiliaId, controladorModeloId) {
    return candidatos.filter(eje => {
        const result = evaluarReglas({
            permitidas: eje.compatEjePermitida.map(p => ({ familiaId: p.familiaId })),
            excluidas: eje.compatEjeExcluye.map(e => ({ familiaId: e.familiaId, motivo: e.motivo })),
            controladoresRequeridos: eje.compatEjeControladorEje.map(c => ({ id: c.controladorModeloId })),
        }, robotFamiliaId, controladorModeloId);
        return result.ok;
    });
}
//# sourceMappingURL=validarCompatibilidadEje.js.map