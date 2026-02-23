// ===== Block Types =====

export type BlockType =
  | 'header'
  | 'section_title'
  | 'divider'
  | 'text_field'
  | 'number_field'
  | 'date_field'
  | 'text_area'
  | 'select_field'
  | 'tristate'
  | 'checklist'
  | 'table'
  | 'image'
  | 'signature'
  | 'section_separator'
  | 'table_of_contents'
  | 'cover_header'
  | 'page_header'
  | 'page_footer'
  | 'back_cover'
  | 'page_break'
  | 'content_placeholder'
  | 'intervention_data'
  | 'client_data'
  | 'equipment_exchange'
  | 'component_section'
  | 'reducer_oils'
  | 'battery_manipulator'
  | 'battery_controller';

export type BlockCategory = 'structure' | 'data' | 'inspection' | 'media' | 'document';

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string; // lucide icon name
  category: BlockCategory;
  defaultConfig: Record<string, unknown>;
  /** Whether this block produces data (has a key field) */
  hasData: boolean;
}

// ===== Block Instance (in schema) =====

export interface Block {
  id: string;
  type: BlockType;
  config: Record<string, unknown>;
}

// ===== Page Config =====

export interface PageConfig {
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
  fontFamily: string;
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  orientation: 'portrait',
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
  fontSize: 10,
  fontFamily: 'Inter',
};

/** Available font families for document templates */
export const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (sans-serif)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia (serif)' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New (mono)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
];

// ===== Schema (persisted in VersionTemplate.schema) =====

export interface TemplateSchema {
  blocks: Block[];
  pageConfig: PageConfig;
}

// ===== Document chrome blocks (ignore margins, pin to edges) =====

/** Block types that render edge-to-edge ignoring page margins */
export const DOCUMENT_CHROME_TYPES = new Set<BlockType>([
  'cover_header', 'page_header', 'page_footer', 'back_cover',
]);

/** Position hint: top-pinned or bottom-pinned */
export const DOCUMENT_CHROME_POSITION: Partial<Record<BlockType, 'top' | 'bottom'>> = {
  cover_header: 'top',
  page_header: 'top',
  page_footer: 'bottom',
  back_cover: 'top', // fills entire page, but starts from top
};

// ===== Width options for data blocks =====

export type FieldWidth = 'full' | 'half' | 'third' | 'two_thirds';

export const FIELD_WIDTH_LABELS: Record<FieldWidth, string> = {
  full: 'Completo',
  half: 'Mitad',
  third: 'Tercio',
  two_thirds: 'Dos tercios',
};

export const FIELD_WIDTH_CSS: Record<FieldWidth, string> = {
  full: 'w-full',
  half: 'w-1/2',
  third: 'w-1/3',
  two_thirds: 'w-2/3',
};

// ===== Block alignment =====

export type BlockAlign = 'left' | 'center' | 'right';

export const BLOCK_ALIGN_CSS: Record<BlockAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// ===== Width fractions for pagination =====

export const FIELD_WIDTH_FRACTION: Record<FieldWidth, number> = {
  full: 1,
  half: 0.5,
  third: 0.333,
  two_thirds: 0.667,
};

// ===== Document template sections =====

export type DocumentSection = 'portada' | 'intermedia' | 'contraportada';

export const DOCUMENT_SECTIONS: { id: DocumentSection; label: string; color: string }[] = [
  { id: 'portada', label: 'Portada', color: '#2563eb' },
  { id: 'intermedia', label: 'Pagina Intermedia (Cabecera + Pie)', color: '#059669' },
  { id: 'contraportada', label: 'Contraportada', color: '#7c3aed' },
];

// ===== Maintenance Level for tristate =====

export type MaintenanceLevel = 'general' | 'level1' | 'level2' | 'level3';

export const MAINTENANCE_LEVEL_LABELS: Record<MaintenanceLevel, string> = {
  general: 'General',
  level1: 'Nivel 1',
  level2: 'Nivel 2',
  level3: 'Nivel 3',
};

export const MAINTENANCE_LEVEL_COLORS: Record<MaintenanceLevel, string> = {
  general: 'bg-gray-100 text-gray-700',
  level1: 'bg-green-100 text-green-700',
  level2: 'bg-amber-100 text-amber-700',
  level3: 'bg-red-100 text-red-700',
};
