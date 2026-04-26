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
            cliente: { select: { horasTrayecto: true } },
            componentes: {
                include: {
                    componenteSistema: {
                        include: {
                            sistema: { select: { id: true, nombre: true } },
                            modeloComponente: { select: { nombre: true } },
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
    // Index horas colocadas por componente
    const horasPorComponente = new Map();
    let horasDesplazamientoColocadas = 0;
    for (const b of oferta.bloques) {
        const h = bloqueHoras(b);
        if (b.tipo === 'trabajo' && b.ofertaComponenteId) {
            horasPorComponente.set(b.ofertaComponenteId, (horasPorComponente.get(b.ofertaComponenteId) ?? 0) + h);
        }
        else if (b.tipo === 'desplazamiento') {
            horasDesplazamientoColocadas += h;
        }
    }
    const candidatos = [];
    // Componentes con horas asignadas
    for (const oc of oferta.componentes) {
        const horasTotal = dec(oc.horas);
        if (horasTotal <= 0)
            continue;
        const colocadas = horasPorComponente.get(oc.id) ?? 0;
        const pendientes = Math.max(0, horasTotal - colocadas);
        candidatos.push({
            id: `comp-${oc.id}`,
            tipo: 'trabajo',
            origenTipo: 'componente',
            ofertaComponenteId: oc.id,
            label: `${oc.componenteSistema.modeloComponente.nombre} · ${oc.componenteSistema.etiqueta}`,
            horasTotal,
            horasColocadas: +colocadas.toFixed(2),
            horasPendientes: +pendientes.toFixed(2),
            meta: {
                sistemaNombre: oc.componenteSistema.sistema.nombre,
                componenteEtiqueta: oc.componenteSistema.etiqueta,
                componenteTipo: oc.componenteSistema.tipo,
                nivel: oc.nivel ?? undefined,
            },
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
            label: `Trayecto cliente (ida ${horasTrayectoUna}h + vuelta ${horasTrayectoUna}h)`,
            horasTotal: horasTotalIdaVuelta,
            horasColocadas: +colocadas.toFixed(2),
            horasPendientes: +pendientes.toFixed(2),
            meta: {},
        });
    }
    return candidatos;
}
//# sourceMappingURL=bloquesCandidatos.js.map