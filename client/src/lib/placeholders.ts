/**
 * Dynamic Placeholders System
 *
 * Allows using variables like {{componente.etiqueta}} in block text fields
 * (table titles, section titles, labels, etc.) that get resolved when
 * generating the final report.
 *
 * Usage in templates:
 *   "Control general de {{componente.etiqueta}}"
 *   "Informacion del sistema {{sistema.nombre}}"
 */

export interface PlaceholderDef {
  /** Placeholder key, e.g. "componente.etiqueta" */
  key: string;
  /** Display label in selector */
  label: string;
  /** Example value for preview */
  example: string;
  /** Category grouping */
  category: 'componente' | 'sistema' | 'cliente' | 'intervencion';
}

export const PLACEHOLDER_DEFINITIONS: PlaceholderDef[] = [
  // Componente
  { key: 'componente.etiqueta', label: 'Nombre del componente', example: 'Robot 1', category: 'componente' },
  { key: 'componente.tipo', label: 'Tipo de componente', example: 'mechanical_unit', category: 'componente' },
  { key: 'componente.numero_serie', label: 'Numero de serie', example: 'SN-2024-001', category: 'componente' },
  { key: 'componente.num_ejes', label: 'Numero de ejes', example: '6', category: 'componente' },
  { key: 'componente.modelo', label: 'Modelo del componente', example: 'IRB 6700', category: 'componente' },

  // Sistema
  { key: 'sistema.nombre', label: 'Nombre del sistema', example: 'Celula soldadura L1', category: 'sistema' },
  { key: 'sistema.descripcion', label: 'Descripcion del sistema', example: 'Celula de soldadura linea 1', category: 'sistema' },
  { key: 'sistema.fabricante', label: 'Fabricante del sistema', example: 'ABB', category: 'sistema' },

  // Cliente
  { key: 'cliente.nombre', label: 'Nombre del cliente', example: 'Empresa S.A.', category: 'cliente' },
  { key: 'cliente.maquina', label: 'Maquina', example: 'Maquina 3', category: 'cliente' },

  // Intervencion
  { key: 'intervencion.actividad', label: 'Actividad', example: 'Mantenimiento preventivo', category: 'intervencion' },
  { key: 'intervencion.fecha', label: 'Fecha de intervencion', example: '22/02/2026', category: 'intervencion' },
  { key: 'intervencion.referencia', label: 'Referencia / OT', example: 'OT-2026-0042', category: 'intervencion' },
];

export const PLACEHOLDER_CATEGORIES = [
  { id: 'componente' as const, label: 'Componente' },
  { id: 'sistema' as const, label: 'Sistema' },
  { id: 'cliente' as const, label: 'Cliente' },
  { id: 'intervencion' as const, label: 'Intervencion' },
];

/** Regex to match {{placeholder.key}} */
const PLACEHOLDER_REGEX = /\{\{([a-z_]+\.[a-z_]+)\}\}/g;

/**
 * Check if a string contains any placeholder tokens.
 */
export function hasPlaceholders(text: string): boolean {
  return PLACEHOLDER_REGEX.test(text);
}

/**
 * Replace all {{key}} tokens with their resolved values.
 * Falls back to the placeholder key wrapped in brackets if no value found.
 */
export function resolvePlaceholders(
  text: string,
  context: Record<string, string | undefined>,
): string {
  return text.replace(PLACEHOLDER_REGEX, (_match, key: string) => {
    return context[key] ?? `[${key}]`;
  });
}

/**
 * Replace all {{key}} tokens with example values (for editor preview).
 */
export function resolveWithExamples(text: string): string {
  const exampleMap: Record<string, string> = {};
  for (const p of PLACEHOLDER_DEFINITIONS) {
    exampleMap[p.key] = p.example;
  }
  return resolvePlaceholders(text, exampleMap);
}

/**
 * Recursively resolve all {{placeholder}} tokens in any JSON structure.
 * Walks strings, arrays, and plain objects.
 */
export function deepResolveStrings(
  value: unknown,
  context: Record<string, string | undefined>,
): unknown {
  if (typeof value === 'string') {
    return resolvePlaceholders(value, context);
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepResolveStrings(item, context));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = deepResolveStrings(v, context);
    }
    return result;
  }
  return value;
}

/**
 * Build a placeholder context for the report form view.
 * Takes informe-level data + per-component data and produces
 * the key-value map for resolving {{placeholder}} tokens.
 */
export function buildFormContext(
  informe: {
    intervencion: {
      titulo: string;
      referencia?: string | null;
      fechaInicio?: string | null;
      cliente?: { nombre: string } | null;
    };
    sistema: {
      nombre: string;
      descripcion?: string | null;
      fabricante: { nombre: string };
      maquina?: { nombre: string } | null;
    };
  },
  componente: {
    etiqueta: string;
    tipoComponente: string;
    componenteSistema: {
      etiqueta: string;
      numeroSerie: string | null;
      numEjes?: number | null;
      modeloComponente: { nombre: string };
    };
  },
): Record<string, string | undefined> {
  return {
    'sistema.nombre': informe.sistema.nombre,
    'sistema.descripcion': informe.sistema.descripcion ?? undefined,
    'sistema.fabricante': informe.sistema.fabricante.nombre,
    'cliente.nombre': informe.intervencion.cliente?.nombre ?? undefined,
    'cliente.maquina': informe.sistema.maquina?.nombre ?? undefined,
    'intervencion.actividad': informe.intervencion.titulo,
    'intervencion.fecha': informe.intervencion.fechaInicio
      ? new Date(informe.intervencion.fechaInicio).toLocaleDateString('es-ES')
      : undefined,
    'intervencion.referencia': informe.intervencion.referencia ?? undefined,
    'componente.etiqueta': componente.componenteSistema.etiqueta,
    'componente.tipo': componente.tipoComponente,
    'componente.numero_serie': componente.componenteSistema.numeroSerie ?? undefined,
    'componente.num_ejes': componente.componenteSistema.numEjes != null
      ? String(componente.componenteSistema.numEjes)
      : undefined,
    'componente.modelo': componente.componenteSistema.modeloComponente.nombre,
  };
}

/**
 * Extract all placeholder keys found in a text.
 */
export function extractPlaceholders(text: string): string[] {
  const keys: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_REGEX.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m[1] && !keys.includes(m[1])) keys.push(m[1]);
  }
  return keys;
}
