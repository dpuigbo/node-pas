/**
 * Report Assembly Engine
 *
 * Merges a document template with frozen component schemas to produce
 * a fully assembled report. Resolves {{placeholder}} tokens throughout
 * all string values in block configs.
 *
 * This is a pure function with no database calls — all data is passed in.
 */

// ===== Types =====

interface Block {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

interface PageConfig {
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
  fontFamily: string;
}

interface TemplateSchema {
  blocks: Block[];
  pageConfig?: PageConfig;
}

export interface AssemblyComponente {
  id: number; // ComponenteInforme id
  componenteSistemaId: number;
  etiqueta: string;
  orden: number;
  tipoComponente: string;
  schemaCongelado: TemplateSchema;
  datos: Record<string, unknown>;
  componenteSistema: {
    etiqueta: string;
    tipo: string;
    numeroSerie: string | null;
    numEjes: number | null;
    modeloComponente: { nombre: string; tipo: string };
  };
}

export interface AssembledBlock {
  id: string;
  type: string;
  config: Record<string, unknown>;
  /** Where this block comes from */
  _source: 'document' | 'component';
  /** ComponenteInforme id if from a component */
  _componenteInformeId?: number;
  /** Component label for visual grouping */
  _componenteEtiqueta?: string;
  /** Data key if this is a data block */
  _dataKey?: string;
  /** Current value from datos */
  _dataValue?: unknown;
}

export interface AssemblyResult {
  blocks: AssembledBlock[];
  pageConfig: PageConfig;
}

interface AssemblyInput {
  documentSchema: TemplateSchema;
  componentes: AssemblyComponente[];
  baseContext: Record<string, string | undefined>;
}

// ===== Default page config =====

const DEFAULT_PAGE_CONFIG: PageConfig = {
  orientation: 'portrait',
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
  fontSize: 14,
  fontFamily: 'Inter',
};

// ===== Placeholder resolution =====

const PLACEHOLDER_REGEX = /\{\{([a-z_]+\.[a-z_]+)\}\}/g;

function resolvePlaceholders(
  text: string,
  context: Record<string, string | undefined>,
): string {
  return text.replace(PLACEHOLDER_REGEX, (_match, key: string) => {
    return context[key] ?? `[${key}]`;
  });
}

/**
 * Recursively resolve all {{placeholder}} tokens in any JSON structure.
 * Walks strings, arrays, and plain objects.
 */
function deepResolveStrings(
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

// ===== Section extraction =====

/**
 * Extract blocks belonging to a specific section from a component template.
 *
 * Walks the component's blocks looking for a `component_section` with the
 * matching contentType. Returns all blocks between it and the next
 * `component_section` (or end of list). The delimiter itself is excluded.
 *
 * If contentType is 'all', returns ALL blocks excluding component_section delimiters.
 */
function extractSection(blocks: Block[], contentType: string): Block[] {
  if (contentType === 'all') {
    return blocks.filter((b) => b.type !== 'component_section');
  }

  const result: Block[] = [];
  let inSection = false;

  for (const block of blocks) {
    if (block.type === 'component_section') {
      if (inSection) break; // Hit next section → stop
      if (block.config.contentType === contentType) {
        inSection = true;
        continue; // Skip the delimiter itself
      }
    } else if (inSection) {
      result.push(block);
    }
  }

  return result;
}

// ===== Context builders =====

/**
 * Build the base placeholder context from informe-level data.
 * This covers sistema, cliente, and intervencion placeholders.
 */
export function buildPlaceholderContext(informe: {
  intervencion: {
    titulo: string;
    tipo: string;
    referencia?: string | null;
    fechaInicio?: string | Date | null;
    cliente?: { nombre: string; sede?: string | null } | null;
  };
  sistema: {
    nombre: string;
    descripcion?: string | null;
    fabricante: { nombre: string };
    planta?: { nombre: string } | null;
    maquina?: { nombre: string } | null;
  };
}): Record<string, string | undefined> {
  return {
    'sistema.nombre': informe.sistema.nombre,
    'sistema.descripcion': informe.sistema.descripcion ?? undefined,
    'sistema.fabricante': informe.sistema.fabricante.nombre,
    'cliente.nombre': informe.intervencion.cliente?.nombre ?? undefined,
    'cliente.planta': informe.sistema.planta?.nombre ?? undefined,
    'cliente.maquina': informe.sistema.maquina?.nombre ?? undefined,
    'intervencion.actividad': informe.intervencion.titulo,
    'intervencion.fecha': informe.intervencion.fechaInicio
      ? new Date(informe.intervencion.fechaInicio).toLocaleDateString('es-ES')
      : undefined,
    'intervencion.referencia': informe.intervencion.referencia ?? undefined,
  };
}

/**
 * Extend the base context with component-specific placeholders.
 */
function buildComponentContext(
  base: Record<string, string | undefined>,
  comp: AssemblyComponente,
): Record<string, string | undefined> {
  return {
    ...base,
    'componente.etiqueta': comp.componenteSistema.etiqueta,
    'componente.tipo': comp.tipoComponente,
    'componente.numero_serie': comp.componenteSistema.numeroSerie ?? undefined,
    'componente.num_ejes': comp.componenteSistema.numEjes != null
      ? String(comp.componenteSistema.numEjes)
      : undefined,
    'componente.modelo': comp.componenteSistema.modeloComponente.nombre,
  };
}

// ===== Data block detection =====

const DATA_BLOCK_TYPES = new Set([
  'text_field',
  'number_field',
  'date_field',
  'text_area',
  'select_field',
  'tristate',
  'checklist',
  'table',
  'image',
  'signature',
  'equipment_exchange',
]);

// ===== Main assembly function =====

/**
 * Assemble a complete report by merging a document template with
 * frozen component schemas.
 *
 * For each `content_placeholder` in the document template:
 * - Finds matching sections in component schemas (by contentType)
 * - Resolves all {{placeholders}} with real data
 * - Pairs data blocks with their current values from datos
 *
 * For all other document blocks:
 * - Resolves {{placeholders}} with base context (sistema/cliente/intervencion)
 */
export function assembleReport(input: AssemblyInput): AssemblyResult {
  const { documentSchema, componentes, baseContext } = input;
  const result: AssembledBlock[] = [];

  // Sort components by orden
  const sortedComponents = [...componentes].sort((a, b) => a.orden - b.orden);

  for (const docBlock of documentSchema.blocks) {
    if (docBlock.type === 'content_placeholder') {
      // === Replace content_placeholder with component blocks ===
      const contentType = (docBlock.config.contentType as string) || 'all';

      for (const comp of sortedComponents) {
        const schema = comp.schemaCongelado;
        if (!schema?.blocks) continue;

        const sectionBlocks = extractSection(schema.blocks, contentType);
        if (sectionBlocks.length === 0) continue;

        const compContext = buildComponentContext(baseContext, comp);

        for (const block of sectionBlocks) {
          // Deep clone + resolve placeholders
          const cloned = JSON.parse(JSON.stringify(block)) as Block;
          const resolvedConfig = deepResolveStrings(
            cloned.config,
            compContext,
          ) as Record<string, unknown>;

          const assembled: AssembledBlock = {
            // Make ID unique per component instance
            id: `${comp.id}_${cloned.id}`,
            type: cloned.type,
            config: resolvedConfig,
            _source: 'component',
            _componenteInformeId: comp.id,
            _componenteEtiqueta: comp.etiqueta,
          };

          // If this is a data block, pair with its value from datos
          // Also resolve placeholders inside datos (e.g. fixedRows cells
          // that were initialized with {{componente.etiqueta}} text)
          if (DATA_BLOCK_TYPES.has(cloned.type)) {
            const key = cloned.config.key as string | undefined;
            if (key) {
              assembled._dataKey = key;
              const rawValue = comp.datos[key] ?? null;
              assembled._dataValue = deepResolveStrings(rawValue, compContext);
            }
          }

          result.push(assembled);
        }
      }
    } else if (docBlock.type === 'section_separator') {
      // === Keep section separators as visual dividers ===
      result.push({
        id: docBlock.id,
        type: docBlock.type,
        config: { ...docBlock.config },
        _source: 'document',
      });
    } else {
      // === Regular document block (cover_header, page_header, etc.) ===
      const cloned = JSON.parse(JSON.stringify(docBlock)) as Block;
      const resolvedConfig = deepResolveStrings(
        cloned.config,
        baseContext,
      ) as Record<string, unknown>;

      result.push({
        id: cloned.id,
        type: cloned.type,
        config: resolvedConfig,
        _source: 'document',
      });
    }
  }

  return {
    blocks: result,
    pageConfig: documentSchema.pageConfig || DEFAULT_PAGE_CONFIG,
  };
}
