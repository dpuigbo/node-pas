"use strict";
/**
 * Report Assembly Engine
 *
 * Merges a document template with frozen component schemas to produce
 * a fully assembled report. Resolves {{placeholder}} tokens throughout
 * all string values in block configs.
 *
 * This is a pure function with no database calls — all data is passed in.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlaceholderContext = buildPlaceholderContext;
exports.assembleReport = assembleReport;
// ===== Default page config =====
const DEFAULT_PAGE_CONFIG = {
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    fontSize: 14,
    fontFamily: 'Inter',
};
// ===== Placeholder resolution =====
const PLACEHOLDER_REGEX = /\{\{([a-z_]+\.[a-z_]+)\}\}/g;
function resolvePlaceholders(text, context) {
    return text.replace(PLACEHOLDER_REGEX, (_match, key) => {
        return context[key] ?? `[${key}]`;
    });
}
/**
 * Recursively resolve all {{placeholder}} tokens in any JSON structure.
 * Walks strings, arrays, and plain objects.
 */
function deepResolveStrings(value, context) {
    if (typeof value === 'string') {
        return resolvePlaceholders(value, context);
    }
    if (Array.isArray(value)) {
        return value.map((item) => deepResolveStrings(item, context));
    }
    if (value !== null && typeof value === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(value)) {
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
function extractSection(blocks, contentType) {
    if (contentType === 'all') {
        return blocks.filter((b) => b.type !== 'component_section');
    }
    const result = [];
    let inSection = false;
    for (const block of blocks) {
        if (block.type === 'component_section') {
            if (inSection)
                break; // Hit next section → stop
            if (block.config.contentType === contentType) {
                inSection = true;
                continue; // Skip the delimiter itself
            }
        }
        else if (inSection) {
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
function buildPlaceholderContext(informe) {
    const cli = informe.intervencion.cliente;
    return {
        'sistema.nombre': informe.sistema.nombre,
        'sistema.descripcion': informe.sistema.descripcion ?? undefined,
        'sistema.fabricante': informe.sistema.fabricante.nombre,
        'cliente.nombre': cli?.nombre ?? undefined,
        'cliente.sede': cli?.sede ?? undefined,
        'cliente.direccion': cli?.direccion ?? undefined,
        'cliente.ciudad': cli?.ciudad ?? undefined,
        'cliente.codigoPostal': cli?.codigoPostal ?? undefined,
        'cliente.provincia': cli?.provincia ?? undefined,
        'cliente.telefono': cli?.telefono ?? undefined,
        'cliente.email': cli?.email ?? undefined,
        'cliente.personaContacto': cli?.personaContacto ?? undefined,
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
function buildComponentContext(base, comp) {
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
    'reducer_oils',
    'battery_manipulator',
    'battery_controller',
]);
/**
 * Compute the initial default value for a data block (same logic as initDatos).
 * Used when no saved value exists yet in datos/datosDocumento.
 */
function computeDefaultValue(block) {
    switch (block.type) {
        case 'tristate':
            return { valor: null, observacion: '' };
        case 'checklist':
            return [];
        case 'table': {
            const fixedRows = block.config.fixedRows ?? [];
            return fixedRows.length > 0 ? JSON.parse(JSON.stringify(fixedRows)) : [];
        }
        case 'equipment_exchange':
            return [];
        case 'reducer_oils': {
            const oilRows = block.config.fixedRows ?? [];
            return oilRows.map(row => ({ ...row, control: false, cambio: false, observaciones: '' }));
        }
        case 'battery_manipulator':
            return { consumibleId: null, consumibleNombre: '', cantidad: 1, notas: '' };
        case 'battery_controller':
            return { consumibleId: null, consumibleNombre: '', cantidad: 1, notas: '' };
        case 'image':
            return [];
        default:
            return null;
    }
}
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
function assembleReport(input) {
    const { documentSchema, componentes, baseContext, datosDocumento = {} } = input;
    const result = [];
    // Sort components by orden
    const sortedComponents = [...componentes].sort((a, b) => a.orden - b.orden);
    for (const docBlock of documentSchema.blocks) {
        if (docBlock.type === 'content_placeholder') {
            // === Replace content_placeholder with component blocks ===
            const contentType = docBlock.config.contentType || 'all';
            for (const comp of sortedComponents) {
                const schema = comp.schemaCongelado;
                if (!schema?.blocks)
                    continue;
                const sectionBlocks = extractSection(schema.blocks, contentType);
                if (sectionBlocks.length === 0)
                    continue;
                const compContext = buildComponentContext(baseContext, comp);
                for (const block of sectionBlocks) {
                    // Deep clone + resolve placeholders
                    const cloned = JSON.parse(JSON.stringify(block));
                    const resolvedConfig = deepResolveStrings(cloned.config, compContext);
                    const assembled = {
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
                        const key = cloned.config.key;
                        if (key) {
                            assembled._dataKey = key;
                            // Use saved value, or compute default (e.g. fixedRows for tables)
                            const rawValue = key in comp.datos
                                ? comp.datos[key]
                                : computeDefaultValue(cloned);
                            assembled._dataValue = deepResolveStrings(rawValue, compContext);
                        }
                    }
                    result.push(assembled);
                }
            }
        }
        else if (docBlock.type === 'section_separator') {
            // === Keep section separators as visual dividers ===
            result.push({
                id: docBlock.id,
                type: docBlock.type,
                config: { ...docBlock.config },
                _source: 'document',
            });
        }
        else {
            // === Regular document block (cover_header, page_header, etc.) ===
            const cloned = JSON.parse(JSON.stringify(docBlock));
            const resolvedConfig = deepResolveStrings(cloned.config, baseContext);
            const assembled = {
                id: cloned.id,
                type: cloned.type,
                config: resolvedConfig,
                _source: 'document',
            };
            // If this is a data block directly in the document template,
            // pair it with its value from datosDocumento
            if (DATA_BLOCK_TYPES.has(cloned.type)) {
                const key = cloned.config.key;
                if (key) {
                    assembled._dataKey = key;
                    // Use saved value, or compute default (e.g. fixedRows for tables)
                    const rawValue = key in datosDocumento
                        ? datosDocumento[key]
                        : computeDefaultValue(cloned);
                    assembled._dataValue = deepResolveStrings(rawValue, baseContext);
                }
            }
            // Special handling: intervention_data → editable table seeded from context
            if (cloned.type === 'intervention_data') {
                const key = '__intervention_data';
                assembled._dataKey = key;
                const seeded = {
                    actividad: String(baseContext['intervencion.actividad'] ?? ''),
                    ordenTrabajo: String(baseContext['intervencion.referencia'] ?? ''),
                    fecha: String(baseContext['intervencion.fecha'] ?? ''),
                    horas: '',
                    horaInicio: '',
                    horaFin: '',
                    tecnicoPas: '',
                    tecnicoCliente: '',
                    telTecnico: '',
                    telContacto: '',
                    emailTecnico: '',
                    emailContacto: '',
                };
                const userEdits = datosDocumento[key] || {};
                assembled._dataValue = { ...seeded, ...userEdits };
            }
            // Special handling: client_data → editable card seeded from context
            if (cloned.type === 'client_data') {
                const key = '__client_data';
                assembled._dataKey = key;
                // Compose full address from parts
                const addrParts = [
                    baseContext['cliente.direccion'],
                    [baseContext['cliente.codigoPostal'], baseContext['cliente.ciudad']].filter(Boolean).join(' '),
                    baseContext['cliente.provincia'],
                ].filter(Boolean);
                const seeded = {
                    nombre: String(baseContext['cliente.nombre'] ?? ''),
                    direccion: addrParts.join(', '),
                };
                const userEdits = datosDocumento[key] || {};
                assembled._dataValue = { ...seeded, ...userEdits };
            }
            result.push(assembled);
        }
    }
    return {
        blocks: result,
        pageConfig: documentSchema.pageConfig || DEFAULT_PAGE_CONFIG,
    };
}
//# sourceMappingURL=assembleReport.js.map