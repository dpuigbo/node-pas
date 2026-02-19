// Tipos de componente
export const TIPO_COMPONENTE = {
  CONTROLLER: 'controller',
  MECHANICAL_UNIT: 'mechanical_unit',
  DRIVE_UNIT: 'drive_unit',
} as const;

export const TIPO_COMPONENTE_LABELS: Record<string, string> = {
  controller: 'Controladora',
  mechanical_unit: 'Unidad Mecanica',
  drive_unit: 'Drive Unit',
};

// Estados de template
export const ESTADO_TEMPLATE = {
  BORRADOR: 'borrador',
  ACTIVO: 'activo',
  OBSOLETO: 'obsoleto',
} as const;

// Estados de intervencion
export const ESTADO_INTERVENCION = {
  BORRADOR: 'borrador',
  EN_CURSO: 'en_curso',
  COMPLETADA: 'completada',
  FACTURADA: 'facturada',
} as const;

export const ESTADO_INTERVENCION_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  en_curso: 'En Curso',
  completada: 'Completada',
  facturada: 'Facturada',
};

// Estados de informe
export const ESTADO_INFORME = {
  BORRADOR: 'borrador',
  FINALIZADO: 'finalizado',
  ENTREGADO: 'entregado',
} as const;

// Tipos de intervencion
export const TIPO_INTERVENCION = {
  PREVENTIVA: 'preventiva',
  CORRECTIVA: 'correctiva',
} as const;

export const TIPO_INTERVENCION_LABELS: Record<string, string> = {
  preventiva: 'Preventiva',
  correctiva: 'Correctiva',
};

// Roles
export const ROL = {
  ADMIN: 'admin',
  TECNICO: 'tecnico',
} as const;

// Categorias de bloques
export const BLOCK_CATEGORIES = {
  ESTRUCTURA: 'estructura',
  CAMPOS: 'campos',
  INSPECCION: 'inspeccion',
  MEDIA: 'media',
} as const;

export const BLOCK_CATEGORY_LABELS: Record<string, string> = {
  estructura: 'Estructura',
  campos: 'Campos de datos',
  inspeccion: 'Inspeccion',
  media: 'Media y firma',
};

// Niveles de mantenimiento (tristate)
export const MAINTENANCE_LEVEL_COLORS: Record<string, string> = {
  general: '#6b7280',
  level1: '#22c55e',
  level2: '#f59e0b',
  level3: '#ef4444',
};

// Config pagina por defecto
export const DEFAULT_PAGE_CONFIG = {
  orientation: 'portrait' as const,
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
  fontSize: 10,
};
