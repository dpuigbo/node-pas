export type SystemContentType =
  | 'all'
  | 'controller_info'
  | 'manipulator_info'
  | 'manipulator_installation'
  | 'mechanical_unit_control'
  | 'cabinet_control'
  | 'programming_unit_control'
  | 'system_control';

export interface SystemContentOption {
  value: SystemContentType;
  label: string;
  description: string;
  icon: string;
}

export const SYSTEM_CONTENT_TYPES: SystemContentOption[] = [
  {
    value: 'all',
    label: 'Todo el contenido',
    description: 'Inserta todas las secciones del sistema',
    icon: 'LayoutTemplate',
  },
  {
    value: 'controller_info',
    label: 'Informacion de controladora / Drive Unit',
    description: 'Datos tecnicos y estado de la controladora',
    icon: 'Cpu',
  },
  {
    value: 'manipulator_info',
    label: 'Informacion de manipuladores',
    description: 'Datos tecnicos de los manipuladores del sistema',
    icon: 'Bot',
  },
  {
    value: 'manipulator_installation',
    label: 'Instalacion de manipuladores',
    description: 'Informacion sobre la instalacion fisica de los manipuladores',
    icon: 'Wrench',
  },
  {
    value: 'mechanical_unit_control',
    label: 'Control de la unidad mecanica',
    description: 'Revision y estado de la unidad mecanica',
    icon: 'Cog',
  },
  {
    value: 'cabinet_control',
    label: 'Control del armario',
    description: 'Revision y estado del armario electrico',
    icon: 'Server',
  },
  {
    value: 'programming_unit_control',
    label: 'Control de la unidad de programacion',
    description: 'Revision del teach pendant / unidad de programacion',
    icon: 'Tablet',
  },
  {
    value: 'system_control',
    label: 'Control del sistema',
    description: 'Control general del sistema completo',
    icon: 'Settings',
  },
];

/** Map for quick label lookup by content type */
export const CONTENT_TYPE_LABELS: Record<SystemContentType, string> = Object.fromEntries(
  SYSTEM_CONTENT_TYPES.map((t) => [t.value, t.label]),
) as Record<SystemContentType, string>;
