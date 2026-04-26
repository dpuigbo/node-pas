// Logica de calculo para ofertas de mantenimiento por componente.
//
// El frontend trabaja con codigos canonicos de nivel (N1, N2_INF, N3, N_CTRL,
// N_DU, N1_EJE, N2_EJE). Internamente buscamos por nivel_id (FK) en BD.
//
// Reglas:
// - tipo_oferta='mantenimiento': aceites/grasas/baterias extraidos de
//   actividad_preventiva.consumibles, filtrados por actividad_nivel(nivel actual)
//   con respeto del flag obligatoria + opciones conBaterias/conAceite.
// - tipo_oferta='solo_limpieza': solo 15% extra de aceite (merma) +
//   consumibles de limpieza del modelo.
//
// Horas en cascada: familia+modelo+controlador > familia+modelo > familia >
//                   legacy modelo > legacy consumibles_nivel.horas

import { prisma } from '../config/database';
import { getNivelesPermitidos, nivelIdFromCodigo, normalizarCodigoNivel } from './niveles';

const LIMPIEZA_OIL_FACTOR = 1.15;

interface ConsumibleItem {
  tipo?: 'aceite' | 'bateria' | 'consumible';
  id?: number;
  consumibleId?: number;
  cantidad: number;
}

export interface CalcOptions {
  tipoOferta: 'mantenimiento' | 'solo_limpieza';
  conBaterias: boolean;
  conAceite: boolean;
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

/** Lookup horas en cascada con nivelId */
async function lookupHoras(
  modeloId: number,
  familiaId: number | null,
  nivelId: number,
  controladorModeloId?: number | null,
): Promise<number> {
  if (familiaId != null) {
    // (familia, modelo, controlador) - mas especifica
    if (controladorModeloId != null) {
      const v = await prisma.mantenimientoHorasFamilia.findFirst({
        where: { familiaId, modeloComponenteId: modeloId, controladorModeloId, nivelId },
      });
      if (v?.horas != null) return Number(v.horas);
    }
    // (familia, modelo) - variante de controlador
    const variante = await prisma.mantenimientoHorasFamilia.findFirst({
      where: { familiaId, modeloComponenteId: modeloId, controladorModeloId: null, nivelId },
    });
    if (variante?.horas != null) return Number(variante.horas);
    // (familia, controlador) - manipulador con cabinet sin variante propia
    if (controladorModeloId != null) {
      const fc = await prisma.mantenimientoHorasFamilia.findFirst({
        where: { familiaId, modeloComponenteId: null, controladorModeloId, nivelId },
      });
      if (fc?.horas != null) return Number(fc.horas);
    }
    // (familia) - generica
    const familia = await prisma.mantenimientoHorasFamilia.findFirst({
      where: { familiaId, modeloComponenteId: null, controladorModeloId: null, nivelId },
    });
    if (familia?.horas != null) return Number(familia.horas);
  }

  // Legacy
  const legacy = await prisma.mantenimientoHorasModelo.findUnique({
    where: { modeloComponenteId_nivelId: { modeloComponenteId: modeloId, nivelId } },
  });
  if (legacy?.horas != null) return Number(legacy.horas);

  const cn = await prisma.consumibleNivel.findUnique({
    where: { modeloId_nivelId: { modeloId, nivelId } },
  });
  if (cn?.horas != null) return Number(cn.horas);

  return 0;
}

/** Coste/precio de los consumibles de limpieza del modelo */
async function calcLimpieza(
  modeloId: number,
  tipoOferta: 'mantenimiento' | 'solo_limpieza'
): Promise<{ coste: number; precio: number }> {
  const items = await prisma.consumibleLimpiezaModelo.findMany({
    where: { modeloComponenteId: modeloId },
    include: { consumible: true },
  });
  if (items.length > 0) {
    let coste = 0;
    let precio = 0;
    for (const it of items) {
      const cant = Number(it.cantidad);
      coste += Number(it.consumible.coste ?? 0) * cant;
      precio += Number(it.consumible.precio ?? 0) * cant;
    }
    return { coste: +coste.toFixed(2), precio: +precio.toFixed(2) };
  }
  // Fallback legacy
  const legacy = await prisma.mantenimientoHorasModelo.findFirst({
    where: { modeloComponenteId: modeloId },
    select: { costeLimpieza: true },
  });
  void tipoOferta;
  const costeLegacy = dec(legacy?.costeLimpieza) ?? 0;
  return { coste: costeLegacy, precio: costeLegacy };
}

/**
 * Suma consumibles (aceites/grasas/baterias) de actividades preventivas de la
 * familia, filtradas por actividad_nivel(nivel actual) y respetando opciones.
 *
 * Las actividades opcionales (obligatoria=false) se incluyen solo si su
 * categoria coincide con la opcion activa (conBaterias para tipo bateria, etc).
 */
async function calcConsumiblesActividad(
  familiaId: number,
  nivelId: number,
  conBaterias: boolean,
  conAceite: boolean,
  tipoOferta: 'mantenimiento' | 'solo_limpieza',
): Promise<{ coste: number; precio: number }> {
  // Cargar actividades de la familia con su flag obligatoria + tipoActividad + consumibles
  const links = await prisma.actividadNivel.findMany({
    where: {
      nivelId,
      actividad: { familiaId },
    },
    include: {
      actividad: {
        include: {
          tipoActividad: { select: { categoria: true } },
          consumibles: { include: { consumible: true } },
        },
      },
    },
  });

  let coste = 0;
  let precio = 0;
  for (const link of links) {
    const act = link.actividad;
    const cat = act.tipoActividad.categoria as string;

    // Filtrar opcionales segun toggles. Si no es obligatoria y la opcion del
    // toggle de su categoria esta off, saltar.
    if (!link.obligatoria) {
      if (cat === 'bateria' && !conBaterias) continue;
      if (cat === 'lubricacion' && !conAceite) continue;
      // Otras categorias opcionales: por defecto se incluyen como extras
      // (correa, filtro, desiccant, reemplazo, overhaul, otro). Ajustar si
      // anadimos toggles especificos en el futuro.
    }

    for (const ac of act.consumibles) {
      const tipo = ac.consumible.tipo as string;
      // Para actividades obligatorias, los toggles tambien aplican (excluir
      // baterias/aceite si el operario lo quita)
      if (tipo === 'bateria' && !conBaterias) continue;
      if (tipo === 'aceite' && !conAceite) continue;

      const cantBase = Number(ac.cantidad ?? 0);
      const costeUnit = Number(ac.consumible.coste ?? 0);
      const precioUnit = Number(ac.consumible.precio ?? 0);

      if (tipoOferta === 'solo_limpieza') {
        if (tipo === 'aceite') {
          const cant = cantBase * (LIMPIEZA_OIL_FACTOR - 1);
          coste += costeUnit * cant;
          precio += precioUnit * cant;
        }
      } else {
        const cant = tipo === 'aceite' ? cantBase * LIMPIEZA_OIL_FACTOR : cantBase;
        coste += costeUnit * cant;
        precio += precioUnit * cant;
      }
    }
  }
  return { coste: +coste.toFixed(2), precio: +precio.toFixed(2) };
}

/**
 * Calcula horas + costes para un componente concreto en un nivel dado.
 * @param nivelCodigo codigo canonico del nivel (N1, N3, etc.)
 */
export async function calcularComponenteOferta(
  modeloId: number,
  nivelCodigo: string,
  opts: CalcOptions,
  controladorModeloId?: number | null,
): Promise<ComponenteCalcResult> {
  const { tipoOferta, conBaterias, conAceite } = opts;
  const nivelId = await nivelIdFromCodigo(nivelCodigo);
  if (nivelId == null) {
    return { horas: 0, costeConsumibles: 0, precioConsumibles: 0, costeLimpieza: 0 };
  }

  const modelo = await prisma.modeloComponente.findUnique({
    where: { id: modeloId },
    select: { familiaId: true },
  });
  const familiaId = modelo?.familiaId ?? null;

  const horas = await lookupHoras(modeloId, familiaId, nivelId, controladorModeloId);
  const limpieza = await calcLimpieza(modeloId, tipoOferta);

  let costeConsumibles = 0;
  let precioConsumibles = 0;
  if (familiaId != null) {
    const desdeActividad = await calcConsumiblesActividad(
      familiaId, nivelId, conBaterias, conAceite, tipoOferta
    );
    costeConsumibles += desdeActividad.coste;
    precioConsumibles += desdeActividad.precio;
  }

  // Fallback legacy si no hubo actividades
  if (costeConsumibles === 0 && precioConsumibles === 0) {
    const fallback = await calcConsumiblesNivelLegacy(modeloId, nivelId, opts);
    costeConsumibles += fallback.coste;
    precioConsumibles += fallback.precio;
  }

  return {
    horas: +horas.toFixed(2),
    costeConsumibles: +costeConsumibles.toFixed(2),
    precioConsumibles: +precioConsumibles.toFixed(2),
    costeLimpieza: +limpieza.coste.toFixed(2),
  };
}

async function calcConsumiblesNivelLegacy(
  modeloId: number,
  nivelId: number,
  opts: CalcOptions
): Promise<{ coste: number; precio: number }> {
  const { tipoOferta, conBaterias, conAceite } = opts;

  const cn = await prisma.consumibleNivel.findUnique({
    where: { modeloId_nivelId: { modeloId, nivelId } },
  });
  if (!cn?.consumibles) return { coste: 0, precio: 0 };

  const items = cn.consumibles as unknown as ConsumibleItem[];
  const catalogoIds = new Set<number>();
  const aceiteIds = new Set<number>();
  const consumibleIds = new Set<number>();
  for (const it of items) {
    if (it.consumibleId && it.consumibleId > 0) catalogoIds.add(it.consumibleId);
    else if (it.id && it.id > 0) {
      if (it.tipo === 'aceite') aceiteIds.add(it.id);
      else consumibleIds.add(it.id);
    }
  }

  const catalogoMap = new Map<number, { coste: number | null; precio: number | null; tipo: string }>();
  const aceiteMap = new Map<number, { coste: number | null; precio: number | null }>();
  const consumibleMap = new Map<number, { coste: number | null; precio: number | null; tipo: string }>();

  if (catalogoIds.size > 0) {
    const rows = await prisma.consumibleCatalogo.findMany({
      where: { id: { in: Array.from(catalogoIds) } },
    });
    for (const r of rows) catalogoMap.set(r.id, { coste: dec(r.coste), precio: dec(r.precio), tipo: r.tipo });
  }
  if (aceiteIds.size > 0) {
    const rows = await prisma.aceite.findMany({
      where: { id: { in: Array.from(aceiteIds) } },
      include: { consumible: true },
    });
    for (const r of rows) aceiteMap.set(r.id, {
      coste: dec(r.consumible?.coste ?? r.coste),
      precio: dec(r.consumible?.precio ?? r.precio),
    });
  }
  if (consumibleIds.size > 0) {
    const rows = await prisma.consumible.findMany({
      where: { id: { in: Array.from(consumibleIds) } },
      include: { consumible: true },
    });
    for (const r of rows) consumibleMap.set(r.id, {
      coste: dec(r.consumible?.coste ?? r.coste),
      precio: dec(r.consumible?.precio ?? r.precio),
      tipo: r.tipo as string,
    });
  }

  let coste = 0;
  let precio = 0;
  for (const it of items) {
    let priceInfo: { coste: number | null; precio: number | null } | undefined;
    let tipoConsumible = 'otro';
    if (it.consumibleId && it.consumibleId > 0) {
      const c = catalogoMap.get(it.consumibleId);
      if (c) { priceInfo = c; tipoConsumible = c.tipo; }
    } else if (it.id && it.id > 0) {
      if (it.tipo === 'aceite') {
        priceInfo = aceiteMap.get(it.id);
        tipoConsumible = 'aceite';
      } else {
        const c = consumibleMap.get(it.id);
        if (c) { priceInfo = c; tipoConsumible = c.tipo; }
      }
    }
    if (!priceInfo) continue;

    if (tipoConsumible === 'bateria' && !conBaterias) continue;
    if (tipoConsumible === 'aceite' && !conAceite) continue;

    const costeUnit = priceInfo.coste ?? 0;
    const precioUnit = priceInfo.precio ?? 0;

    if (tipoOferta === 'solo_limpieza') {
      if (tipoConsumible === 'aceite') {
        const cant = it.cantidad * (LIMPIEZA_OIL_FACTOR - 1);
        coste += costeUnit * cant;
        precio += precioUnit * cant;
      }
    } else {
      const cant = tipoConsumible === 'aceite' ? it.cantidad * LIMPIEZA_OIL_FACTOR : it.cantidad;
      coste += costeUnit * cant;
      precio += precioUnit * cant;
    }
  }

  if (tipoOferta === 'mantenimiento') {
    const otros = dec(cn.precioOtros) ?? 0;
    coste += otros;
    precio += otros;
  }

  return { coste, precio };
}

/**
 * Devuelve los niveles aplicables para un modelo (codigos canonicos + horas).
 *
 * Prioridad:
 * 1. modelo_nivel_aplicable (explicit)
 * 2. niveles permitidos para el tipo
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
      familiaId: true,
      nivelesAplicables: {
        include: { nivel: true },
        orderBy: { nivel: { orden: 'asc' } },
      },
      mantenimientoHoras: { include: { nivel: { select: { codigo: true } } } },
      mantenimientoHorasFamilia: { include: { nivel: { select: { codigo: true } } } },
      consumiblesNivel: { include: { nivel: { select: { codigo: true } } } },
    },
  });
  if (!modelo) return [];

  // Map codigo -> horas (en cascada: legacy modelo > horasFamilia con modelo > horasFamilia generica)
  const horasMap = new Map<string, number | null>();
  for (const h of modelo.mantenimientoHoras) {
    horasMap.set(h.nivel.codigo, dec(h.horas));
  }
  for (const h of modelo.mantenimientoHorasFamilia) {
    if (h.modeloComponenteId === modeloId) {
      const cur = horasMap.get(h.nivel.codigo);
      if (cur == null) horasMap.set(h.nivel.codigo, dec(h.horas));
    }
  }
  if (modelo.familiaId) {
    const generales = await prisma.mantenimientoHorasFamilia.findMany({
      where: { familiaId: modelo.familiaId, modeloComponenteId: null, controladorModeloId: null },
      include: { nivel: { select: { codigo: true } } },
    });
    for (const h of generales) {
      if (!horasMap.has(h.nivel.codigo)) horasMap.set(h.nivel.codigo, dec(h.horas));
    }
  }

  const consumiblesSet = new Set(
    modelo.consumiblesNivel
      .filter((c) => c.consumibles && Array.isArray(c.consumibles) && (c.consumibles as any[]).length > 0)
      .map((c) => c.nivel.codigo)
  );

  // 1. Explicit nivelesAplicables
  if (modelo.nivelesAplicables.length > 0) {
    return modelo.nivelesAplicables.map((na) => ({
      codigo: na.nivel.codigo,
      nombre: na.nivel.nombre,
      orden: na.nivel.orden,
      horas: horasMap.get(na.nivel.codigo) ?? null,
      costeLimpieza: null,
      tieneConsumibles: consumiblesSet.has(na.nivel.codigo),
    }));
  }

  // 2. Fallback: niveles permitidos por tipo
  const codigos = getNivelesPermitidos(modelo.tipo);
  if (codigos.length === 0) return [];

  const niveles = await prisma.luNivelMantenimiento.findMany({
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
        horas: horasMap.get(cod) ?? null,
        costeLimpieza: null,
        tieneConsumibles: consumiblesSet.has(cod),
      };
    })
    .sort((a, b) => a.orden - b.orden);
}

/** Reexport para compat; otros modulos lo usan sin saber del refactor */
export { normalizarCodigoNivel };
