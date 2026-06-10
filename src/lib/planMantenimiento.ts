// Plan de mantenimiento v2.9 — helpers compartidos.
//
// Modelo de datos (BD v2.9, guia 2026-05-14):
//   - lubricacion: filas por (modelo, eje) con consumible_id, lifetime,
//     nivel_id (nivel que cubre el cambio) y cohortes JSON
//     (montajes/protecciones/controladores _aplicables; NULL = todos).
//   - actividad_preventiva: actividades no-lubricacion con modelos_aplicables
//     (JSON de IDs de modelo, filtro principal), nivel_id, obligatoria y cohortes.
//   - mantenimiento_horas_modelo: horas por (modelo, nivel). El controlador
//     tiene sus propias filas (nivel N_CTRL); el total del sistema se obtiene
//     SUMANDO manipulador + controlador (D-073).

import { prisma } from '../config/database';

/** Cohorte seleccionada por el usuario al configurar el sistema/plan. */
export interface Cohorte {
  montajeId?: number | null;
  proteccionId?: number | null;
  controladorId?: number | null;
}

/**
 * Niveles cuyo contenido queda cubierto al ejecutar el nivel pedido.
 * N2_INF/N2_SUP incluyen N1; N3 = N1 + N2_INF + N2_SUP (servicio completo).
 */
const COBERTURA_NIVEL: Record<string, string[]> = {
  N1:      ['N1'],
  N2_INF:  ['N1', 'N2_INF'],
  N2_SUP:  ['N1', 'N2_SUP'],
  N3:      ['N1', 'N2_INF', 'N2_SUP', 'N3'],
  N_CTRL:  ['N_CTRL'],
  N_DU:    ['N_DU'],
  N0_EJE:  ['N0_EJE'],
  N1_EJE:  ['N1_EJE'],
  N2_EJE:  ['N1_EJE', 'N2_EJE'],
};

export function nivelesCubiertos(nivelCodigo: string): string[] {
  return COBERTURA_NIVEL[nivelCodigo] ?? [nivelCodigo];
}

/** Parsea un campo JSON-array de IDs (longtext en BD). NULL/invalid → null. */
export function parseIdArray(value: unknown): number[] | null {
  if (value == null) return null;
  let arr: unknown = value;
  if (typeof value === 'string') {
    try { arr = JSON.parse(value); } catch { return null; }
  }
  if (!Array.isArray(arr)) return null;
  return arr.map((v) => Number(v)).filter((n) => !isNaN(n));
}

/**
 * Regla de cohorte: el campo NULL aplica a todos; si hay array, el id
 * seleccionado debe estar incluido. Si el usuario no ha seleccionado valor
 * (id null/undefined), la fila se acepta (cohorte sin restringir).
 */
export function cohorteMatch(aplicables: unknown, seleccionadoId: number | null | undefined): boolean {
  const ids = parseIdArray(aplicables);
  if (ids == null || ids.length === 0) return true;
  if (seleccionadoId == null) return true;
  return ids.includes(Number(seleccionadoId));
}

export function matchCohorte(
  row: { montajesAplicables?: unknown; proteccionesAplicables?: unknown; controladoresAplicables?: unknown },
  cohorte: Cohorte | undefined,
): boolean {
  if (!cohorte) return true;
  return cohorteMatch(row.montajesAplicables, cohorte.montajeId)
    && cohorteMatch(row.proteccionesAplicables, cohorte.proteccionId)
    && cohorteMatch(row.controladoresAplicables, cohorte.controladorId);
}

// ===== LUBRICACION =====

export type LubricacionRow = Awaited<ReturnType<typeof loadLubricacionModelo>>[number];

async function loadLubricacionModelo(modeloId: number) {
  return prisma.lubricacion.findMany({
    where: { modeloComponenteId: modeloId },
    include: {
      consumible: {
        select: {
          id: true, codigoInterno: true, nombre: true, tipo: true, subtipo: true,
          fabricante: true, unidad: true, coste: true, precio: true,
        },
      },
      nivel: { select: { id: true, codigo: true, nombre: true } },
    },
    orderBy: [{ eje: 'asc' }, { id: 'asc' }],
  });
}

/**
 * Filas de lubricacion del plan: lifetime=0, nivel cubierto por el nivel
 * pedido, cohortes compatibles. nivelCodigo null = todas (sin filtrar nivel).
 */
export async function getLubricacionPlan(
  modeloId: number,
  nivelCodigo: string | null,
  cohorte?: Cohorte,
) {
  const rows = await loadLubricacionModelo(modeloId);
  const cubiertos = nivelCodigo ? new Set(nivelesCubiertos(nivelCodigo)) : null;
  return rows.filter((r) => {
    if (r.lifetime) return false;
    if (cubiertos) {
      if (!r.nivel?.codigo) return false;
      if (!cubiertos.has(r.nivel.codigo)) return false;
    }
    return matchCohorte(r, cohorte);
  });
}

/** Todas las filas de lubricacion del modelo (incluye lifetime), con cohortes filtradas. */
export async function getLubricacionModelo(modeloId: number, cohorte?: Cohorte) {
  const rows = await loadLubricacionModelo(modeloId);
  return cohorte ? rows.filter((r) => matchCohorte(r, cohorte)) : rows;
}

// ===== ACTIVIDADES PREVENTIVAS =====

async function loadActividades() {
  return prisma.actividadPreventiva.findMany({
    include: {
      tipoActividad: { select: { id: true, codigo: true, nombre: true, categoria: true } },
      nivel: { select: { id: true, codigo: true, nombre: true } },
      consumibles: {
        include: {
          consumible: {
            select: {
              id: true, codigoInterno: true, nombre: true, tipo: true, subtipo: true,
              unidad: true, coste: true, precio: true,
            },
          },
        },
      },
    },
    orderBy: [{ orden: 'asc' }, { id: 'asc' }],
  });
}

export type ActividadRow = Awaited<ReturnType<typeof loadActividades>>[number];

export function actividadAplicaAModelo(act: { modelosAplicables?: unknown }, modeloId: number): boolean {
  const ids = parseIdArray(act.modelosAplicables);
  if (ids == null) return false; // sin modelos_aplicables no aplica a ningun modelo concreto
  return ids.includes(modeloId);
}

/**
 * Actividades preventivas aplicables a un modelo, opcionalmente filtradas por
 * nivel (cobertura) y cohorte. La tabla tiene ~60 filas: se filtra en JS para
 * evitar quirks de JSON_CONTAINS en MariaDB.
 */
export async function getActividadesPlan(
  modeloId: number,
  nivelCodigo: string | null,
  cohorte?: Cohorte,
  opts?: { soloObligatorias?: boolean },
) {
  const all = await loadActividades();
  const cubiertos = nivelCodigo ? new Set(nivelesCubiertos(nivelCodigo)) : null;
  return all.filter((a) => {
    if (!actividadAplicaAModelo(a, modeloId)) return false;
    if (cubiertos) {
      if (!a.nivel?.codigo) return false;
      if (!cubiertos.has(a.nivel.codigo)) return false;
    }
    if (opts?.soloObligatorias && !a.obligatoria) return false;
    return matchCohorte(a, cohorte);
  });
}

// ===== HORAS =====

/** Horas de trabajo para (modelo, nivelId). 0 si no hay fila (D-073). */
export async function getHorasModeloNivel(modeloId: number, nivelId: number): Promise<number> {
  const row = await prisma.mantenimientoHorasModelo.findFirst({
    where: { modeloComponenteId: modeloId, nivelId },
  });
  return row?.horas != null ? Number(row.horas) : 0;
}

/** Mapa nivelCodigo → horas para un modelo. */
export async function getHorasModelo(modeloId: number): Promise<Map<string, number>> {
  const rows = await prisma.mantenimientoHorasModelo.findMany({
    where: { modeloComponenteId: modeloId },
    include: { nivel: { select: { codigo: true } } },
  });
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.nivel.codigo, Number(r.horas));
  return map;
}

/**
 * Nivel efectivo para un componente segun su tipo (D-073): el nivel
 * seleccionado por el usuario aplica al manipulador; controladores y drives
 * tienen su nivel propio fijo.
 */
export function nivelEfectivoParaTipo(tipo: string, nivelSeleccionado: string | null): string | null {
  switch (tipo) {
    case 'controller':  return 'N_CTRL';
    case 'drive_unit':  return 'N_DU';
    case 'external_axis':
      // El nivel global del sistema no mapea 1:1 a niveles de eje; usar N1_EJE
      // como nivel por defecto hasta que se carguen datos de ejes externos.
      return nivelSeleccionado ? 'N1_EJE' : null;
    default:            return nivelSeleccionado;
  }
}

// ===== CONSUMIBLES DEL PLAN =====

export interface ConsumiblePlanItem {
  consumibleId: number;
  codigoInterno: string | null;
  nombre: string;
  tipo: string;
  unidad: string | null;
  cantidad: number;
  coste: number | null;
  precio: number | null;
  origen: 'lubricacion' | 'actividad';
  detalle: string;          // eje o nombre de la actividad
  obligatoria: boolean;
}

/**
 * Lista agregada de consumibles del plan (lubricacion + actividades) para un
 * (modelo, nivel, cohorte). Guia v2.9 §5.3.
 */
export async function getConsumiblesPlan(
  modeloId: number,
  nivelCodigo: string,
  cohorte?: Cohorte,
): Promise<ConsumiblePlanItem[]> {
  const items: ConsumiblePlanItem[] = [];

  const lubRows = await getLubricacionPlan(modeloId, nivelCodigo, cohorte);
  for (const row of lubRows) {
    if (!row.consumible) continue;
    items.push({
      consumibleId: row.consumible.id,
      codigoInterno: row.consumible.codigoInterno,
      nombre: row.consumible.nombre,
      tipo: row.consumible.tipo,
      unidad: row.cantidadUnidad ?? row.consumible.unidad,
      cantidad: Number(row.cantidadValor ?? 0),
      coste: row.consumible.coste != null ? Number(row.consumible.coste) : null,
      precio: row.consumible.precio != null ? Number(row.consumible.precio) : null,
      origen: 'lubricacion',
      detalle: `Eje ${row.eje}`,
      obligatoria: true,
    });
  }

  const actividades = await getActividadesPlan(modeloId, nivelCodigo, cohorte);
  for (const act of actividades) {
    for (const ac of act.consumibles) {
      items.push({
        consumibleId: ac.consumible.id,
        codigoInterno: ac.consumible.codigoInterno,
        nombre: ac.consumible.nombre,
        tipo: ac.consumible.tipo,
        unidad: ac.unidad ?? ac.consumible.unidad,
        cantidad: Number(ac.cantidad ?? 0),
        coste: ac.consumible.coste != null ? Number(ac.consumible.coste) : null,
        precio: ac.consumible.precio != null ? Number(ac.consumible.precio) : null,
        origen: 'actividad',
        detalle: act.componente,
        obligatoria: act.obligatoria,
      });
    }
  }

  return items;
}
