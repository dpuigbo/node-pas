// Backend: utilidades de niveles de mantenimiento.
//
// Despues del refactor v2 (SQL 28), los niveles canonicos son los codigos
// de la tabla lu_nivel_mantenimiento. El API publico sigue trabajando con
// codigos string (N1, N2_INF, ...); el backend traduce a nivel_id (FK)
// cuando guarda en BD.

import { prisma } from '../config/database';

/** Codigos canonicos por tipo de componente (lu_familia.tipo) */
const NIVELES_PERMITIDOS: Record<string, string[]> = {
  controller:      ['N_CTRL'],
  drive_unit:      ['N_DU'],
  external_axis:   ['N0_EJE', 'N1_EJE', 'N2_EJE'],
  mechanical_unit: ['N1', 'N2_INF', 'N2_SUP', 'N3'],
};

/** Codigo "fijo" por defecto para cada tipo (el primero permitido) */
const NIVEL_DEFAULT: Record<string, string> = {
  controller:      'N_CTRL',
  drive_unit:      'N_DU',
  external_axis:   'N1_EJE',
  mechanical_unit: 'N1',
};

/** Mapping de codigos legacy (pre-SQL 28) a canonicos */
const LEGACY_MAP: Record<string, string> = {
  '1': 'N1',
  '2_inferior': 'N2_INF',
  '2_superior': 'N2_SUP',
  '3': 'N3',
  '2': 'N2_EJE', // eje externo nivel 2 antiguo
};

/** Niveles permitidos para un tipo de componente (codigos canonicos) */
export function getNivelesPermitidos(tipo: string): string[] {
  return NIVELES_PERMITIDOS[tipo] ?? NIVELES_PERMITIDOS.mechanical_unit!;
}

/** Codigo por defecto para un tipo de componente */
export function getNivelDefault(tipo: string): string {
  return NIVEL_DEFAULT[tipo] ?? NIVEL_DEFAULT.mechanical_unit!;
}

/** Normaliza un codigo legacy a canonico (idempotente para codigos ya nuevos) */
export function normalizarCodigoNivel(codigo: string | null | undefined): string | null {
  if (!codigo) return null;
  return LEGACY_MAP[codigo] ?? codigo;
}

/** Compatibilidad: niveles fijos de un tipo (devuelve array con uno: el default) */
export function getNivelesFijos(tipo: string): string[] {
  return [getNivelDefault(tipo)];
}

/**
 * Ensures a niveles CSV string includes the default level for the given type
 * and only contains permitted levels. Returns the cleaned CSV.
 */
export function ensureNivelesFijos(tipo: string, nivelesCSV: string | null | undefined): string {
  const def = getNivelDefault(tipo);
  const permitidos = getNivelesPermitidos(tipo);

  if (!nivelesCSV) return def;

  const current = nivelesCSV.split(',').map((s) => normalizarCodigoNivel(s.trim()) ?? '').filter(Boolean);
  const merged = [...new Set([def, ...current])];
  const valid = merged.filter((n) => permitidos.includes(n));
  return valid.join(',');
}

// ===== Cache de codigo<->id de lu_nivel_mantenimiento =====

let codigoToId: Map<string, number> | null = null;
let idToInfo: Map<number, { codigo: string; nombre: string; ambito: string; orden: number }> | null = null;

async function loadCache() {
  if (codigoToId && idToInfo) return;
  const niveles = await prisma.luNivelMantenimiento.findMany({
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
export function invalidateNivelesCache() {
  codigoToId = null;
  idToInfo = null;
}

/** Codigo canonico -> id en BD. null si codigo es null o no existe */
export async function nivelIdFromCodigo(codigo: string | null | undefined): Promise<number | null> {
  if (!codigo) return null;
  const norm = normalizarCodigoNivel(codigo);
  if (!norm) return null;
  await loadCache();
  return codigoToId!.get(norm) ?? null;
}

/** id -> codigo. null si id no existe */
export async function nivelCodigoFromId(id: number | null | undefined): Promise<string | null> {
  if (id == null) return null;
  await loadCache();
  return idToInfo!.get(id)?.codigo ?? null;
}

/** id -> info completa */
export async function nivelInfoFromId(
  id: number | null | undefined
): Promise<{ codigo: string; nombre: string; ambito: string; orden: number } | null> {
  if (id == null) return null;
  await loadCache();
  return idToInfo!.get(id) ?? null;
}
