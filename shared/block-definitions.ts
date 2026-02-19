// Tipos de bloque disponibles en el sistema
export const BLOCK_TYPES = [
  'header',
  'section_title',
  'divider',
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
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

// Interfaz base de configuracion de un bloque en el schema
export interface BlockSchema {
  id: string;
  type: BlockType;
  config: Record<string, unknown>;
}

// Configuracion de pagina del template
export interface PageConfig {
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
}

// Schema completo de un template
export interface TemplateSchema {
  blocks: BlockSchema[];
  pageConfig: PageConfig;
}

// Metadata de un tipo de bloque (para el registry)
export interface BlockTypeInfo {
  type: BlockType;
  displayName: string;
  icon: string;
  category: 'estructura' | 'campos' | 'inspeccion' | 'media';
  producesData: boolean;
}

// Catalogo de tipos de bloque con su metadata
export const BLOCK_TYPE_INFO: Record<BlockType, BlockTypeInfo> = {
  header: {
    type: 'header',
    displayName: 'Cabecera',
    icon: 'FileText',
    category: 'estructura',
    producesData: false,
  },
  section_title: {
    type: 'section_title',
    displayName: 'Titulo de seccion',
    icon: 'Heading',
    category: 'estructura',
    producesData: false,
  },
  divider: {
    type: 'divider',
    displayName: 'Separador',
    icon: 'Minus',
    category: 'estructura',
    producesData: false,
  },
  text_field: {
    type: 'text_field',
    displayName: 'Campo de texto',
    icon: 'Type',
    category: 'campos',
    producesData: true,
  },
  number_field: {
    type: 'number_field',
    displayName: 'Campo numerico',
    icon: 'Hash',
    category: 'campos',
    producesData: true,
  },
  date_field: {
    type: 'date_field',
    displayName: 'Campo de fecha',
    icon: 'Calendar',
    category: 'campos',
    producesData: true,
  },
  text_area: {
    type: 'text_area',
    displayName: 'Area de texto',
    icon: 'AlignLeft',
    category: 'campos',
    producesData: true,
  },
  select_field: {
    type: 'select_field',
    displayName: 'Selector',
    icon: 'List',
    category: 'campos',
    producesData: true,
  },
  tristate: {
    type: 'tristate',
    displayName: 'Punto de inspeccion',
    icon: 'CheckCircle',
    category: 'inspeccion',
    producesData: true,
  },
  checklist: {
    type: 'checklist',
    displayName: 'Lista de verificacion',
    icon: 'ListChecks',
    category: 'inspeccion',
    producesData: true,
  },
  table: {
    type: 'table',
    displayName: 'Tabla de datos',
    icon: 'Table',
    category: 'inspeccion',
    producesData: true,
  },
  image: {
    type: 'image',
    displayName: 'Imagen',
    icon: 'Image',
    category: 'media',
    producesData: true,
  },
  signature: {
    type: 'signature',
    displayName: 'Firma',
    icon: 'Pen',
    category: 'media',
    producesData: true,
  },
};

// Configuraciones por defecto de cada tipo de bloque
export const BLOCK_DEFAULTS: Record<BlockType, Record<string, unknown>> = {
  header: {
    title: 'Informe de Mantenimiento',
    subtitle: '',
    showLogo: true,
    showDate: true,
    showReference: true,
    logoPosition: 'left',
    logoUrl: '',
  },
  section_title: {
    title: 'Nueva seccion',
    description: '',
    level: 1,
    color: '#1e40af',
  },
  divider: {
    style: 'solid',
    spacing: 'medium',
    color: '#e5e5e5',
  },
  text_field: {
    key: '',
    label: 'Campo de texto',
    required: false,
    width: 'full',
    helpText: '',
    placeholder: '',
  },
  number_field: {
    key: '',
    label: 'Campo numerico',
    required: false,
    width: 'full',
    helpText: '',
    unit: '',
    min: null,
    max: null,
  },
  date_field: {
    key: '',
    label: 'Fecha',
    required: false,
    width: 'half',
    helpText: '',
  },
  text_area: {
    key: '',
    label: 'Observaciones',
    required: false,
    width: 'full',
    helpText: '',
    rows: 3,
    placeholder: '',
  },
  select_field: {
    key: '',
    label: 'Selector',
    required: false,
    width: 'half',
    helpText: '',
    options: [
      { value: 'opcion_1', label: 'Opcion 1' },
      { value: 'opcion_2', label: 'Opcion 2' },
    ],
  },
  tristate: {
    key: '',
    label: 'Punto de inspeccion',
    withObservation: true,
    required: true,
    maintenanceLevel: 'general',
  },
  checklist: {
    key: '',
    label: 'Lista de verificacion',
    items: [
      { key: 'item_1', label: 'Item 1' },
      { key: 'item_2', label: 'Item 2' },
    ],
  },
  table: {
    key: '',
    label: 'Tabla',
    columns: [
      { key: 'col_1', label: 'Columna 1', type: 'text', width: 'auto' },
      { key: 'col_2', label: 'Columna 2', type: 'text', width: 'auto' },
    ],
    fixedRows: [],
    allowAddRows: true,
    minRows: 1,
    maxRows: 20,
  },
  image: {
    key: '',
    label: 'Imagen',
    allowMultiple: false,
    maxFiles: 1,
    maxSizeMb: 5,
    width: 'full',
  },
  signature: {
    key: '',
    label: 'Firma',
    role: 'Tecnico',
    required: false,
    width: 'half',
  },
};
