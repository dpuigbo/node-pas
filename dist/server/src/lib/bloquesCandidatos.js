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
    // Cargar actividades por familia (para todos los componentes de una vez)
    const familiaIds = Array.from(new Set(oferta.componentes
        .map((oc) => oc.componenteSistema.modeloComponente.familiaId)
        .filter((id) => id != null)));
    const actividadesPorFamilia = new Map();
    if (familiaIds.length > 0) {
        const acts = await database_1.prisma.actividadPreventiva.findMany({
            where: { familiaId: { in: familiaIds } },
            select: {
                familiaId: true,
                niveles: true,
                tipoActividad: { select: { nombre: true } },
                componente: true,
            },
        });
        for (const a of acts) {
            const list = actividadesPorFamilia.get(a.familiaId) ?? [];
            // Etiqueta humana: "Cambio aceite — Eje 1"
            list.push({
                nombre: `${a.tipoActividad.nombre}${a.componente ? ` — ${a.componente}` : ''}`,
                niveles: a.niveles,
            });
            actividadesPorFamilia.set(a.familiaId, list);
        }
    }
    function actividadesParaNivel(familiaId, nivel) {
        if (familiaId == null)
            return [];
        const lista = actividadesPorFamilia.get(familiaId) ?? [];
        return lista
            .filter((a) => {
            if (!a.niveles || a.niveles.trim() === '')
                return true;
            return a.niveles.split(',').map((s) => s.trim()).includes(nivel);
        })
            .map((a) => a.nombre);
    }
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
    // Componentes con nivel asignado (mostramos incluso si horas=0 para visibilidad)
    for (const oc of oferta.componentes) {
        if (!oc.nivel)
            continue; // sin nivel no es candidato
        const horasTotal = dec(oc.horas);
        const sinHoras = horasTotal <= 0;
        const colocadas = horasPorComponente.get(oc.id) ?? 0;
        const pendientes = Math.max(0, horasTotal - colocadas);
        const familiaId = oc.componenteSistema.modeloComponente.familiaId;
        candidatos.push({
            id: `comp-${oc.id}`,
            tipo: 'trabajo',
            origenTipo: 'componente',
            ofertaComponenteId: oc.id,
            label: `${oc.componenteSistema.modeloComponente.nombre} · ${oc.componenteSistema.etiqueta}`,
            horasTotal: +horasTotal.toFixed(2),
            horasColocadas: +colocadas.toFixed(2),
            horasPendientes: +pendientes.toFixed(2),
            sinHoras,
            actividades: actividadesParaNivel(familiaId, oc.nivel),
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
            sinHoras: false,
            actividades: [],
            meta: {},
        });
    }
    return candidatos;
}
//# sourceMappingURL=bloquesCandidatos.js.map