// Niveles de mantenimiento por tipo de componente
// controller/drive_unit: solo N1 (fijo)
// external_axis: N1 (fijo) + N2 (opcional, cambio aceite del eje)
// mechanical_unit: N1 (fijo) + N2 Inf / N2 Sup / N3 (opcionales según modelo)

export interface NivelOption {
  value: string;
  label: string;
  fixed: boolean; // true = siempre activo, no se puede deseleccionar
}

export const NIVELES_POR_TIPO: Record<string, NivelOption[]> = {
  controller: [
    { value: '1', label: 'Nivel 1', fixed: true },
  ],
  drive_unit: [
    { value: '1', label: 'Nivel 1', fixed: true },
  ],
  external_axis: [
    { value: '1', label: 'Nivel 1', fixed: true },
    { value: '2', label: 'Nivel 2', fixed: false },
  ],
  mechanical_unit: [
    { value: '1', label: 'Nivel 1', fixed: true },
    { value: '2_inferior', label: 'Nivel 2 Inferior', fixed: false },
    { value: '2_superior', label: 'Nivel 2 Superior', fixed: false },
    { value: '3', label: 'Nivel 3', fixed: false },
  ],
};

export const NIVEL_SHORT: Record<string, string> = {
  '1': 'N1',
  '2': 'N2',
  '2_inferior': 'N2 Inf',
  '2_superior': 'N2 Sup',
  '3': 'N3',
};

/** Todos los valores de nivel posibles en el sistema */
export const NIVELES_ALL = [
  { value: '1', label: 'Nivel 1' },
  { value: '2', label: 'Nivel 2' },
  { value: '2_inferior', label: 'Nivel 2 Inf.' },
  { value: '2_superior', label: 'Nivel 2 Sup.' },
  { value: '3', label: 'Nivel 3' },
] as const;

/** Devuelve las opciones de nivel permitidas para un tipo de componente */
export function getNivelesForTipo(tipo: string): NivelOption[] {
  return NIVELES_POR_TIPO[tipo] ?? NIVELES_POR_TIPO['mechanical_unit']!;
}

/** Devuelve los niveles fijos (obligatorios) para un tipo de componente */
export function getNivelesFijos(tipo: string): string[] {
  return getNivelesForTipo(tipo).filter((n) => n.fixed).map((n) => n.value);
}

/**
 * Dado un tipo y un CSV de niveles del modelo, devuelve solo los niveles
 * válidos (intersección entre lo configurado y lo permitido por el tipo).
 */
export function getNivelesValidos(tipo: string, nivelesCSV: string | null | undefined): string[] {
  const permitidos = getNivelesForTipo(tipo).map((n) => n.value);
  if (!nivelesCSV) return permitidos.filter((v) => getNivelesForTipo(tipo).find((n) => n.value === v)?.fixed);
  const configurados = nivelesCSV.split(',').map((s) => s.trim()).filter(Boolean);
  return permitidos.filter((v) => configurados.includes(v));
}

/** Comprueba si un tipo tiene algún nivel no-fijo (editable por admin) */
export function tieneNivelesEditables(tipo: string): boolean {
  return getNivelesForTipo(tipo).some((n) => !n.fixed);
}
