// Logica de calculo para ofertas de mantenimiento por componente (BD v2.9).
//
// El frontend trabaja con codigos canonicos de nivel (N1, N2_INF, N2_SUP, N3,
// N_CTRL, N_DU, N0_EJE, N1_EJE, N2_EJE). Internamente se traduce a nivel_id.
//
// Reglas v2.9:
// - Horas: mantenimiento_horas_modelo (1 fila = modelo + nivel, D-073). El
//   total del sistema se obtiene sumando manipulador + controlador.
// - Consumibles del plan = lubricacion (lifetime=0, nivel cubierto) +
//   consumibles de actividad_preventiva (modelos_aplicables, nivel cubierto).
// - tipo_oferta='solo_limpieza': solo 15% extra de aceite (merma) +
//   consumibles de tipo limpieza.
// - Los consumibles de tipo 'limpieza' se acumulan en costeLimpieza (no en
//   costeConsumibles) para mantener el desglose de la UI.

import { prisma } from '../config/database';
import { getNivelesPermitidos, nivelIdFromCodigo, normalizarCodigoNivel } from './niveles';
import {
  Cohorte,
  convertirCantidadAUnidadConsumible,
  getActividadesPlan,
  getLubricacionPlan,
  getHorasModelo,
  getHorasModeloNivel,
} from './planMantenimiento';

const LIMPIEZA_OIL_FACTOR = 1.15;

export interface CalcOptions {
  tipoOferta: 'mantenimiento' | 'solo_limpieza';
  conBaterias: boolean;
  conAceite: boolean;
  cohorte?: Cohorte;
}

export interface ComponenteCalcResult {
  horas: number;
  costeConsumibles: number;
  precioConsumibles: number;
  costeLimpieza: number;
}

function dec(v: any): number | null {
  if (v == null) return null;
  return Number(v);
}

interface Acumulador {
  coste: number;
  precio: number;
  costeLimpieza: number;
  precioLimpieza: number;
}

function acumularConsumible(
  acc: Acumulador,
  consumible: { tipo: string; coste: any; precio: any; unidad?: string | null },
  cantidadOrigen: number,
  unidadOrigen: string | null | undefined,
  opts: CalcOptions,
) {
  const { tipoOferta, conBaterias, conAceite } = opts;
  const tipo = consumible.tipo;
  // coste/precio del catalogo son por unidad base (€/L, €/kg, €/ud)
  const cantidadBase = convertirCantidadAUnidadConsumible(cantidadOrigen, unidadOrigen, consumible.unidad);
  const esLubricante = tipo === 'aceite' || tipo === 'grasa';

  if (tipo === 'bateria' && !conBaterias) return;
  if (esLubricante && !conAceite) return;

  const costeUnit = Number(consumible.coste ?? 0);
  const precioUnit = Number(consumible.precio ?? 0);

  if (tipoOferta === 'solo_limpieza') {
    if (esLubricante) {
      // Solo la merma del 15% sobre el aceite
      const cant = cantidadBase * (LIMPIEZA_OIL_FACTOR - 1);
      acc.coste += costeUnit * cant;
      acc.precio += precioUnit * cant;
    } else if (tipo === 'limpieza') {
      acc.costeLimpieza += costeUnit * cantidadBase;
      acc.precioLimpieza += precioUnit * cantidadBase;
    }
    return;
  }

  const cant = esLubricante ? cantidadBase * LIMPIEZA_OIL_FACTOR : cantidadBase;
  if (tipo === 'limpieza') {
    acc.costeLimpieza += costeUnit * cant;
    acc.precioLimpieza += precioUnit * cant;
  } else {
    acc.coste += costeUnit * cant;
    acc.precio += precioUnit * cant;
  }
}

/**
 * Calcula horas + costes para un componente concreto en un nivel dado.
 * @param nivelCodigo codigo canonico del nivel (N1, N3, N_CTRL, etc.)
 */
export async function calcularComponenteOferta(
  modeloId: number,
  nivelCodigo: string,
  opts: CalcOptions,
  controladorModeloId?: number | null,
): Promise<ComponenteCalcResult> {
  const nivelId = await nivelIdFromCodigo(nivelCodigo);
  if (nivelId == null) {
    return { horas: 0, costeConsumibles: 0, precioConsumibles: 0, costeLimpieza: 0 };
  }

  const cohorte: Cohorte = { ...(opts.cohorte ?? {}) };
  if (cohorte.controladorId == null && controladorModeloId != null) {
    cohorte.controladorId = controladorModeloId;
  }

  const horas = await getHorasModeloNivel(modeloId, nivelId);

  const acc: Acumulador = { coste: 0, precio: 0, costeLimpieza: 0, precioLimpieza: 0 };

  // 1) Lubricacion del plan (cambios de aceite/grasa por eje)
  const lubRows = await getLubricacionPlan(modeloId, nivelCodigo, cohorte);
  for (const row of lubRows) {
    if (!row.consumible) continue;
    acumularConsumible(acc, row.consumible, Number(row.cantidadValor ?? 0), row.cantidadUnidad, opts);
  }

  // 2) Consumibles de las actividades preventivas aplicables
  const actividades = await getActividadesPlan(modeloId, nivelCodigo, cohorte);
  for (const act of actividades) {
    const cat = act.tipoActividad.categoria as string;
    // Actividades opcionales: respetar toggles por categoria
    if (!act.obligatoria) {
      if (cat === 'bateria' && !opts.conBaterias) continue;
      if (cat === 'lubricacion' && !opts.conAceite) continue;
    }
    for (const ac of act.consumibles) {
      acumularConsumible(acc, ac.consumible, Number(ac.cantidad ?? 0), ac.unidad, opts);
    }
  }

  return {
    horas: +horas.toFixed(2),
    costeConsumibles: +acc.coste.toFixed(2),
    precioConsumibles: +acc.precio.toFixed(2),
    costeLimpieza: +acc.costeLimpieza.toFixed(2),
  };
}

/**
 * Devuelve los niveles aplicables para un modelo (codigos canonicos + horas).
 *
 * Fuente de verdad (D-075): flags nivel_n1/n2_inf/n2_sup/n3 en
 * modelos_componente para manipuladores; para controller/drive_unit/
 * external_axis se usa el fallback por tipo (N_CTRL, N_DU, N*_EJE).
 */
export async function getNivelesAplicablesModelo(modeloId: number): Promise<{
  codigo: string;
  nombre: string;
  orden: number;
  horas: number | null;
  costeLimpieza: number | null;
  tieneConsumibles: boolean;
}[]> {
  const modelo = await prisma.modeloComponente.findUnique({
    where: { id: modeloId },
    select: {
      tipo: true,
      nivelN1: true,
      nivelN2Inf: true,
      nivelN2Sup: true,
      nivelN3: true,
    },
  });
  if (!modelo) return [];

  const horasMap = await getHorasModelo(modeloId);

  // Niveles con consumibles: lubricacion no-lifetime o actividades con consumibles
  const lubPlan = await getLubricacionPlan(modeloId, null);
  const actividades = await getActividadesPlan(modeloId, null);
  const nivelesConConsumibles = new Set<string>();
  for (const l of lubPlan) {
    if (l.nivel?.codigo) nivelesConConsumibles.add(l.nivel.codigo);
  }
  for (const a of actividades) {
    if (a.nivel?.codigo && a.consumibles.length > 0) nivelesConConsumibles.add(a.nivel.codigo);
  }

  let codigos: string[];
  if (modelo.tipo === 'mechanical_unit') {
    codigos = [];
    if (modelo.nivelN1)    codigos.push('N1');
    if (modelo.nivelN2Inf) codigos.push('N2_INF');
    if (modelo.nivelN2Sup) codigos.push('N2_SUP');
    if (modelo.nivelN3)    codigos.push('N3');
    if (codigos.length === 0) codigos = getNivelesPermitidos(modelo.tipo);
  } else {
    codigos = getNivelesPermitidos(modelo.tipo);
  }
  if (codigos.length === 0) return [];

  const niveles = await prisma.luNivelMantenimiento.findMany({
    where: { codigo: { in: codigos } },
    orderBy: { orden: 'asc' },
  });
  const nivelMap = new Map(niveles.map((n) => [n.codigo, n]));

  return codigos
    .map((cod, idx) => {
      const n = nivelMap.get(cod);
      // Un nivel "tiene consumibles" si alguno de los niveles que cubre los tiene
      const cubiertos = new Set([cod]);
      if (cod === 'N2_INF' || cod === 'N2_SUP') cubiertos.add('N1');
      if (cod === 'N3') { cubiertos.add('N1'); cubiertos.add('N2_INF'); cubiertos.add('N2_SUP'); }
      const tiene = [...cubiertos].some((c) => nivelesConConsumibles.has(c));
      return {
        codigo: cod,
        nombre: n?.nombre ?? `Nivel ${cod}`,
        orden: n?.orden ?? idx,
        horas: horasMap.get(cod) ?? null,
        costeLimpieza: null,
        tieneConsumibles: tiene,
      };
    })
    .sort((a, b) => a.orden - b.orden);
}

/** Reexport para compat; otros modulos lo usan sin saber del refactor */
export { normalizarCodigoNivel };
export { dec as decToNumber };
