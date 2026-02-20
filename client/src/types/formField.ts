import type { Block } from './editor';

/**
 * Props for the FormField component of each data block.
 * The FormField renders the interactive input for the technician to fill.
 */
export interface FormFieldProps {
  /** The frozen block definition (type + config from schemaCongelado) */
  block: Block;
  /** Current value for this field from datos[block.config.key] */
  value: unknown;
  /** Called when the technician changes the value */
  onChange: (value: unknown) => void;
  /** When true, display read-only (for finalizado/entregado informes) */
  readOnly?: boolean;
}
