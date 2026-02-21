"use strict";
/**
 * Generates the initial (empty) datos JSON for a frozen template schema.
 * Called when creating a ComponenteInforme during atomic report creation.
 * Only data-producing blocks get entries; structure blocks are skipped.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatos = initDatos;
const DATA_BLOCKS = new Set([
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
]);
function initDatos(schema) {
    const datos = {};
    for (const block of schema.blocks) {
        if (!DATA_BLOCKS.has(block.type))
            continue;
        const key = block.config.key;
        if (!key)
            continue;
        switch (block.type) {
            case 'tristate':
                datos[key] = { valor: null, observacion: '' };
                break;
            case 'checklist':
                datos[key] = [];
                break;
            case 'table': {
                const fixedRows = block.config.fixedRows ?? [];
                datos[key] = fixedRows.length > 0 ? JSON.parse(JSON.stringify(fixedRows)) : [];
                break;
            }
            case 'image':
                datos[key] = [];
                break;
            default:
                // text_field, number_field, date_field, text_area, select_field, signature
                datos[key] = null;
        }
    }
    return datos;
}
//# sourceMappingURL=initDatos.js.map