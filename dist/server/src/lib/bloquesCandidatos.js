"use strict";
// Calcula los bloques candidatos pendientes de colocar en el calendario
// para una oferta concreta:
//
// - Por cada oferta_componente con nivel + horas → 1 candidato 'componente'
//   con horas pendientes = horas_total - SUM(horas bloques con
//   oferta_componente_id = ese componente)
//
// - Por cada cliente con horasTrayecto → 2 candidatos 'desplazamiento'
//   (ida + vuelta), con horas pendientes = horasTrayecto - SUM(horas bloques
//   tipo desplazamiento ya colocados / 2)
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBloquesCandidatos = getBloquesCandidatos;
const database_1 = require("../config/database");
const planMantenimiento_1 = require("./planMantenimiento");
function dec(v) {
    if (v == null)
        return 0;
    return Number(v);
}
function parseHoraToMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}
function bloqueHoras(b) {
    const start = parseHoraToMinutes(b.horaInicio);
    let end = parseHoraToMinutes(b.horaFin);
    if (end <= start)
        end += 24 * 60;
    return Math.max(0, (end - start) / 60);
}
async function getBloquesCandidatos(ofertaId) {
    const oferta = await database_1.prisma.oferta.findUnique({
        where: { id: ofertaId },
        select: {
            clienteId: true,
            tipo: true,
            operacionesCorrectivas: { select: { horasEstimadas: true } },
            cliente: { select: { horasTrayecto: true } },
            componentes: {
                include: {
                    nivel: { select: { codigo: true } },
                    componenteSistema: {
                        include: {
                            sistema: { select: { id: true, nombre: true } },
                            modeloComponente: { select: { nombre: true, familiaId: true } },
                        },
                    },
                },
            },
            bloques: {
                select: {
                    id: true,
                    tipo: true,
                    horaInicio: true,
                    horaFin: true,
                    ofertaComponenteId: true,
                    origenTipo: true,
                },
            },
        },
    });
    if (!oferta)
        return [];
    // Actividades v2.9: el filtro principal es modelos_aplicables (JSON de IDs).
    // La tabla es pequeña (~60 filas): se carga una vez y se filtra en JS.
    const todasActividades = await database_1.prisma.actividadPreventiva.findMany({
        select: {
            componente: true,
            modelosAplicables: true,
            nivel: { select: { codigo: true } },
            tipoActividad: { select: { nombre: true } },
        },
        orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    });
    function actividadesParaNivel(modeloId, nivelCodigo) {
        const cubiertos = new Set((0, planMantenimiento_1.nivelesCubiertos)(nivelCodigo));
        return todasActividades
            .filter((a) => (0, planMantenimiento_1.actividadAplicaAModelo)(a, modeloId)
            && a.nivel?.codigo != null
            && cubiertos.has(a.nivel.codigo))
            .map((a) => `${a.tipoActividad.nombre}${a.componente ? ` — ${a.componente}` : ''}`);
    }
    // Index horas colocadas por componente
    const horasPorComponente = new Map();
    let horasDesplazamientoColocadas = 0;
    let horasTrabajoColocadas = 0;
    for (const b of oferta.bloques) {
        const h = bloqueHoras(b);
        if (b.tipo === 'trabajo') {
            horasTrabajoColocadas += h;
            if (b.ofertaComponenteId) {
                horasPorComponente.set(b.ofertaComponenteId, (horasPorComponente.get(b.ofertaComponenteId) ?? 0) + h);
            }
        }
        else if (b.tipo === 'desplazamiento') {
            horasDesplazamientoColocadas += h;
        }
    }
    const candidatos = [];
    const porSistema = new Map();
    for (const oc of oferta.componentes) {
        const nivelCodigo = oc.nivel?.codigo ?? null;
        if (!nivelCodigo)
            continue;
        const sId = oc.componenteSistema.sistema.id;
        let bucket = porSistema.get(sId);
        if (!bucket) {
            bucket = { sistemaNombre: oc.componenteSistema.sistema.nombre, componentes: [] };
            porSistema.set(sId, bucket);
        }
        bucket.componentes.push(oc);
    }
    for (const [sistemaId, { sistemaNombre, componentes }] of porSistema.entries()) {
        if (componentes.length === 0)
            continue;
        let horasTotal = 0;
        let colocadas = 0;
        const desglosePartes = [];
        const actividadesUnion = new Set();
        let primerOcId = null;
        const componenteIds = [];
        const niveles = new Set();
        for (const oc of componentes) {
            const ht = dec(oc.horas);
            horasTotal += ht;
            colocadas += horasPorComponente.get(oc.id) ?? 0;
            const nivelCodigo = oc.nivel.codigo;
            niveles.add(nivelCodigo);
            for (const a of actividadesParaNivel(oc.componenteSistema.modeloComponenteId, nivelCodigo))
                actividadesUnion.add(a);
            desglosePartes.push(`${oc.componenteSistema.modeloComponente.nombre} · ${oc.componenteSistema.etiqueta} (${nivelCodigo}, ${ht.toFixed(1)}h)`);
            if (primerOcId == null)
                primerOcId = oc.id;
            componenteIds.push(oc.id);
        }
        const pendientes = Math.max(0, horasTotal - colocadas);
        candidatos.push({
            id: `sis-${sistemaId}`,
            tipo: 'trabajo',
            origenTipo: 'componente',
            ofertaComponenteId: primerOcId,
            componenteIds,
            label: `${sistemaNombre}`,
            horasTotal: +horasTotal.toFixed(2),
            horasColocadas: +colocadas.toFixed(2),
            horasPendientes: +pendientes.toFixed(2),
            sinHoras: horasTotal <= 0,
            actividades: Array.from(actividadesUnion),
            meta: {
                sistemaNombre,
                componenteEtiqueta: desglosePartes.join(' + '),
                componenteTipo: 'sistema',
                nivel: Array.from(niveles).join('+'),
            },
        });
    }
    // Operaciones correctivas: un unico candidato de trabajo con el total de horas
    // estimadas. En ofertas correctivas todos los bloques de trabajo son la reparacion
    // (no hay componentes vinculados), asi que colocadas = horas de todos los bloques
    // de trabajo.
    if (oferta.tipo === 'correctiva' && oferta.operacionesCorrectivas.length > 0) {
        const horasTotalOps = oferta.operacionesCorrectivas.reduce((s, op) => s + dec(op.horasEstimadas), 0);
        const pendientesOps = Math.max(0, horasTotalOps - horasTrabajoColocadas);
        candidatos.push({
            id: 'correctiva-total',
            tipo: 'trabajo',
            origenTipo: 'manual',
            ofertaComponenteId: null,
            componenteIds: [],
            label: 'Operaciones de reparacion',
            horasTotal: +horasTotalOps.toFixed(2),
            horasColocadas: +horasTrabajoColocadas.toFixed(2),
            horasPendientes: +pendientesOps.toFixed(2),
            sinHoras: horasTotalOps <= 0,
            actividades: [],
            meta: {},
        });
    }
    // Desplazamiento del cliente (ida + vuelta)
    const horasTrayectoUna = dec(oferta.cliente?.horasTrayecto);
    if (horasTrayectoUna > 0) {
        const horasTotalIdaVuelta = horasTrayectoUna * 2;
        const colocadas = horasDesplazamientoColocadas;
        const pendientes = Math.max(0, horasTotalIdaVuelta - colocadas);
        // Un candidato global "desplazamiento" con el total ida+vuelta
        candidatos.push({
            id: 'viaje-total',
            tipo: 'desplazamiento',
            origenTipo: 'desplazamiento',
            ofertaComponenteId: null,
            componenteIds: [],
            label: `Trayecto cliente (ida ${horasTrayectoUna}h + vuelta ${horasTrayectoUna}h)`,
            horasTotal: horasTotalIdaVuelta,
            horasColocadas: +colocadas.toFixed(2),
            horasPendientes: +pendientes.toFixed(2),
            sinHoras: false,
            actividades: [],
            meta: {},
        });
    }
    return candidatos;
}
//# sourceMappingURL=bloquesCandidatos.js.map