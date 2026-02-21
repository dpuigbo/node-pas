import type { ComponentType } from 'react';
import type { BlockType, BlockDefinition, Block } from '@/types/editor';
import type { FormFieldProps } from '@/types/formField';

// ===== Component interfaces =====

export interface EditorPreviewProps {
  block: Block;
  isSelected: boolean;
}

export interface ConfigPanelProps {
  block: Block;
  onChange: (path: string, value: unknown) => void;
}

export type { FormFieldProps };

// ===== Registry entry =====

interface BlockRegistryEntry {
  definition: BlockDefinition;
  EditorPreview: ComponentType<EditorPreviewProps>;
  ConfigPanel: ComponentType<ConfigPanelProps>;
  FormField?: ComponentType<FormFieldProps>;
}

// ===== Registry map =====
const registry = new Map<BlockType, BlockRegistryEntry>();

export function registerBlock(entry: BlockRegistryEntry) {
  registry.set(entry.definition.type, entry);
}

export function getBlockEntry(type: BlockType): BlockRegistryEntry | undefined {
  return registry.get(type);
}

export function getAllBlockEntries(): BlockRegistryEntry[] {
  return Array.from(registry.values());
}

// ===== Block definitions (used by store before lazy-loaded components) =====

export const blockDefinitions: Record<BlockType, BlockDefinition> = {
  header: {
    type: 'header',
    label: 'Cabecera',
    icon: 'FileText',
    category: 'structure',
    hasData: false,
    defaultConfig: {
      title: 'Informe de Mantenimiento',
      subtitle: '',
      showLogo: true,
      showDate: true,
      showReference: true,
      logoPosition: 'left',
      logoUrl: '',
    },
  },
  section_title: {
    type: 'section_title',
    label: 'Titulo de seccion',
    icon: 'Heading',
    category: 'structure',
    hasData: false,
    defaultConfig: {
      title: 'Nueva seccion',
      description: '',
      level: 1,
      color: '#2563eb',
    },
  },
  divider: {
    type: 'divider',
    label: 'Separador',
    icon: 'Minus',
    category: 'structure',
    hasData: false,
    defaultConfig: {
      style: 'solid',
      spacing: 'medium',
      color: '#e5e7eb',
    },
  },
  text_field: {
    type: 'text_field',
    label: 'Campo de texto',
    icon: 'Type',
    category: 'data',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Campo de texto',
      required: false,
      width: 'full',
      helpText: '',
      placeholder: '',
    },
  },
  number_field: {
    type: 'number_field',
    label: 'Campo numerico',
    icon: 'Hash',
    category: 'data',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Campo numerico',
      required: false,
      width: 'full',
      helpText: '',
      unit: '',
      min: null,
      max: null,
    },
  },
  date_field: {
    type: 'date_field',
    label: 'Campo de fecha',
    icon: 'Calendar',
    category: 'data',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Fecha',
      required: false,
      width: 'full',
      helpText: '',
    },
  },
  text_area: {
    type: 'text_area',
    label: 'Area de texto',
    icon: 'AlignLeft',
    category: 'data',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Area de texto',
      required: false,
      width: 'full',
      helpText: '',
      rows: 3,
      placeholder: '',
    },
  },
  select_field: {
    type: 'select_field',
    label: 'Selector',
    icon: 'ChevronDown',
    category: 'data',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Selector',
      required: false,
      width: 'full',
      helpText: '',
      options: [] as { value: string; label: string }[],
    },
  },
  tristate: {
    type: 'tristate',
    label: 'Inspeccion OK/NOK/NA',
    icon: 'CheckCircle',
    category: 'inspection',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Punto de inspeccion',
      withObservation: true,
      required: false,
      maintenanceLevel: 'general',
    },
  },
  checklist: {
    type: 'checklist',
    label: 'Lista de verificacion',
    icon: 'ListChecks',
    category: 'inspection',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Lista de verificacion',
      items: [] as { key: string; label: string }[],
    },
  },
  table: {
    type: 'table',
    label: 'Tabla de datos',
    icon: 'Table',
    category: 'inspection',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Tabla',
      columns: [] as { key: string; label: string; type: string; width: string }[],
      fixedRows: [] as Record<string, unknown>[],
      allowAddRows: true,
      minRows: 0,
      maxRows: 50,
    },
  },
  image: {
    type: 'image',
    label: 'Imagen',
    icon: 'Image',
    category: 'media',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Imagen',
      allowMultiple: false,
      maxFiles: 1,
      maxSizeMB: 5,
      width: 'full',
    },
  },
  signature: {
    type: 'signature',
    label: 'Firma',
    icon: 'Pen',
    category: 'media',
    hasData: true,
    defaultConfig: {
      key: '',
      label: 'Firma',
      role: 'Tecnico',
      required: false,
      width: 'half',
    },
  },
  section_separator: {
    type: 'section_separator',
    label: 'Separador de seccion',
    icon: 'FileStack',
    category: 'structure',
    hasData: false,
    defaultConfig: {
      section: 'portada',
    },
  },
  table_of_contents: {
    type: 'table_of_contents',
    label: 'Tabla de contenidos',
    icon: 'List',
    category: 'structure',
    hasData: false,
    defaultConfig: {
      title: 'Tabla de contenidos',
    },
  },
};

// ===== Category metadata =====
export const blockCategories: { id: string; label: string; types: BlockType[] }[] = [
  {
    id: 'structure',
    label: 'Estructura',
    types: ['header', 'section_title', 'divider', 'table_of_contents'],
  },
  {
    id: 'data',
    label: 'Campos de datos',
    types: ['text_field', 'number_field', 'date_field', 'text_area', 'select_field'],
  },
  {
    id: 'inspection',
    label: 'Inspeccion',
    types: ['tristate', 'checklist', 'table'],
  },
  {
    id: 'media',
    label: 'Media y firma',
    types: ['image', 'signature'],
  },
];
