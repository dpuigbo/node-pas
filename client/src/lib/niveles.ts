// Niveles de mantenimiento por tipo de componente (codigos canonicos v2.9).
//
// Fuente de verdad (D-075): flags nivel_n1/n2_inf/n2_sup/n3 en
// modelos_componente para manipuladores. Para controller/drive_unit/
// external_axis el nivel es fijo por tipo (N_CTRL, N_DU, N*_EJE).

export interface NivelOption {
  value: string;
  label: string;
  fixed: boolean; // true = siempre activo, no se puede deseleccionar
}

export const NIVELES_POR_TIPO: Record<string, NivelOption[]> = {
  controller: [
    { value: 'N_CTRL', label: 'Nivel Controlador', fixed: true },
  ],
  drive_unit: [
    { value: 'N_DU', label: 'Nivel Drive Unit', fixed: true },
  ],
  external_axis: [
    { value: 'N0_EJE', label: 'Eje sin revisión', fixed: false },
    { value: 'N1_EJE', label: 'Eje N1', fixed: true },
    { value: 'N2_EJE', label: 'Eje N2', fixed: false },
  ],
  mechanical_unit: [
    { value: 'N1', label: 'Nivel 1', fixed: true },
    { value: 'N2_INF', label: 'Nivel 2 Inferior', fixed: false },
    { value: 'N2_SUP', label: 'Nivel 2 Superior', fixed: false },
    { value: 'N3', label: 'Nivel 3', fixed: false },
  ],
};

export const NIVEL_SHORT: Record<string, string> = {
  N1: 'N1',
  N2_INF: 'N2 Inf',
  N2_SUP: 'N2 Sup',
  N3: 'N3',
  N_CTRL: 'N Ctrl',
  N_DU: 'N DU',
  N0_EJE: 'N0 Eje',
  N1_EJE: 'N1 Eje',
  N2_EJE: 'N2 Eje',
  // legacy (pre-v2.9), por si quedan datos antiguos en caches
  '1': 'N1',
  '2': 'N2',
  '2_inferior': 'N2 Inf',
  '2_superior': 'N2 Sup',
  '3': 'N3',
};

/** Todos los valores de nivel posibles en el sistema */
export const NIVELES_ALL = [
  { value: 'N1', label: 'Nivel 1' },
  { value: 'N2_INF', label: 'Nivel 2 Inf.' },
  { value: 'N2_SUP', label: 'Nivel 2 Sup.' },
  { value: 'N3', label: 'Nivel 3' },
  { value: 'N_CTRL', label: 'Nivel Controlador' },
  { value: 'N_DU', label: 'Nivel Drive Unit' },
  { value: 'N0_EJE', label: 'Eje sin revisión' },
  { value: 'N1_EJE', label: 'Eje N1' },
  { value: 'N2_EJE', label: 'Eje N2' },
] as const;

/** Flags de nivel del modelo (campos de modelos_componente) */
export interface ModeloNivelFlags {
  tipo: string;
  nivelN1?: boolean;
  nivelN2Inf?: boolean;
  nivelN2Sup?: boolean;
  nivelN3?: boolean;
}

/** Devuelve las opciones de nivel permitidas para un tipo de componente */
export function getNivelesForTipo(tipo: string): NivelOption[] {
  return NIVELES_POR_TIPO[tipo] ?? NIVELES_POR_TIPO['mechanical_unit']!;
}

/** Devuelve los niveles fijos (obligatorios) para un tipo de componente */
export function getNivelesFijos(tipo: string): string[] {
  return getNivelesForTipo(tipo).filter((n) => n.fixed).map((n) => n.value);
}

/**
 * Niveles aplicables de un modelo segun sus flags (D-075). Para tipos
 * no-manipulador devuelve los niveles fijos del tipo.
 */
export function getNivelesModelo(modelo: ModeloNivelFlags): string[] {
  if (modelo.tipo === 'mechanical_unit') {
    const out: string[] = [];
    if (modelo.nivelN1 !== false) out.push('N1');
    if (modelo.nivelN2Inf) out.push('N2_INF');
    if (modelo.nivelN2Sup) out.push('N2_SUP');
    if (modelo.nivelN3) out.push('N3');
    return out;
  }
  return getNivelesFijos(modelo.tipo);
}

/** Convierte una seleccion de codigos a flags para guardar en el modelo */
export function nivelesToFlags(niveles: string[]): {
  nivelN1: boolean; nivelN2Inf: boolean; nivelN2Sup: boolean; nivelN3: boolean;
} {
  return {
    nivelN1: niveles.includes('N1'),
    nivelN2Inf: niveles.includes('N2_INF'),
    nivelN2Sup: niveles.includes('N2_SUP'),
    nivelN3: niveles.includes('N3'),
  };
}

/** Comprueba si un tipo tiene algún nivel no-fijo (editable por admin) */
export function tieneNivelesEditables(tipo: string): boolean {
  return getNivelesForTipo(tipo).some((n) => !n.fixed);
}
