import type { TemplateSchema } from '@/types/editor';
import { blockDefinitions } from '@/components/blocks/registry';

export interface ValidationError {
  blockId: string;
  field: string;
  message: string;
}

const SNAKE_CASE_RE = /^[a-z][a-z0-9_]*$/;

/**
 * Validate a template schema before saving.
 * Returns an array of validation errors (empty = valid).
 */
export function validateSchema(schema: TemplateSchema): ValidationError[] {
  const errors: ValidationError[] = [];
  const keys = new Map<string, string>(); // key -> blockId

  for (const block of schema.blocks) {
    const def = blockDefinitions[block.type];
    if (!def) continue;

    // Data blocks must have a valid key
    if (def.hasData) {
      const key = (block.config.key as string) || '';

      if (!key) {
        errors.push({
          blockId: block.id,
          field: 'key',
          message: `El bloque "${(block.config.label as string) || block.type}" no tiene clave definida`,
        });
      } else if (!SNAKE_CASE_RE.test(key)) {
        errors.push({
          blockId: block.id,
          field: 'key',
          message: `La clave "${key}" debe ser snake_case (solo letras minusculas, numeros y guiones bajos)`,
        });
      } else if (key.length > 64) {
        errors.push({
          blockId: block.id,
          field: 'key',
          message: `La clave "${key}" es demasiado larga (max 64 caracteres)`,
        });
      } else if (keys.has(key)) {
        errors.push({
          blockId: block.id,
          field: 'key',
          message: `La clave "${key}" esta duplicada`,
        });
      }

      if (key) {
        keys.set(key, block.id);
      }
    }

    // Type-specific validations
    if (block.type === 'select_field') {
      const options = (block.config.options as any[]) || [];
      if (options.length === 0) {
        errors.push({
          blockId: block.id,
          field: 'options',
          message: `El selector "${(block.config.label as string) || 'sin nombre'}" no tiene opciones definidas`,
        });
      }
    }

    if (block.type === 'checklist') {
      const items = (block.config.items as any[]) || [];
      if (items.length === 0) {
        errors.push({
          blockId: block.id,
          field: 'items',
          message: `La lista "${(block.config.label as string) || 'sin nombre'}" no tiene items definidos`,
        });
      }
    }

    if (block.type === 'table') {
      const columns = (block.config.columns as any[]) || [];
      if (columns.length === 0) {
        errors.push({
          blockId: block.id,
          field: 'columns',
          message: `La tabla "${(block.config.label as string) || 'sin nombre'}" no tiene columnas definidas`,
        });
      }
    }
  }

  return errors;
}
