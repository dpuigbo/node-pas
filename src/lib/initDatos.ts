/**
 * Generates the initial (empty) datos JSON for a frozen template schema.
 * Called when creating a ComponenteInforme during atomic report creation.
 * Only data-producing blocks get entries; structure blocks are skipped.
 */

interface BlockSchema {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

interface TemplateSchema {
  blocks: BlockSchema[];
  pageConfig?: unknown;
}

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

export function initDatos(schema: TemplateSchema): Record<string, unknown> {
  const datos: Record<string, unknown> = {};

  for (const block of schema.blocks) {
    if (!DATA_BLOCKS.has(block.type)) continue;

    const key = block.config.key as string | undefined;
    if (!key) continue;

    switch (block.type) {
      case 'tristate':
        datos[key] = { valor: null, observacion: '' };
        break;
      case 'checklist':
        datos[key] = [];
        break;
      case 'table': {
        const fixedRows = (block.config.fixedRows as Record<string, unknown>[] | undefined) ?? [];
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
