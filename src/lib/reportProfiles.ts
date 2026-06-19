/**
 * Perfiles de informe por marca / generación / cinemática.
 *
 * Definen la ESTRUCTURA del informe (qué secciones, qué puntos de control por
 * eje, qué variante de calibración, qué baterías). El PLAN de mantenimiento
 * (tablas `lubricacion` y `actividad_preventiva`) rellena los DATOS encima
 * (lubricante+volumen por eje, intervalos, referencias de batería).
 *
 * Extraídos de informes Word reales (FY2025): IRB6620 (ABB-IRC5),
 * IRB2400 (ABB-S4C+), KR16 (KUKA-KRC4). KUKA queda pendiente de la campaña de
 * extracción de manuales (no hay datos todavía); su estructura se deja perfilada.
 *
 * REPARTO DE SECCIONES (se respeta el de las plantillas actuales):
 *  - mechanical_unit → Información general (manipulador) + Control unidad mecánica
 *  - controller      → Armario (ext/int) + Cableado + Unidad de programación + Sistema + baterías controlador
 *  - external_axis   → Control del eje + reductoras + calibración + batería SMB del eje
 *  El documento une las secciones de cada componente (1 informe = N componentes;
 *  MultiMove = varios manipuladores + ejes externos, cada uno con su sección).
 */

export type Marca = 'ABB' | 'KUKA';
export type CalibracionTipo = 'abb_conmutacion' | 'kuka_angulo' | 'none';
export type BateriaMedida = 'smb' | 'eib' | null;

/** Punto de control por eje: base (todos los ejes) + extras específicos. */
export interface MechanicalProfile {
  /** Checks aplicados a TODOS los ejes (1..N). */
  ejeBase: string[];
  /** Checks específicos por número de eje. */
  ejeExtras: Record<number, string[]>;
  /** Inspecciones generales del manipulador (no asociadas a un eje). */
  generalChecks: string[];
  /** Variante de tabla de calibración. */
  calibracion: CalibracionTipo;
  /** Batería de medida del manipulador (SMB para ABB). */
  bateriaMedida: BateriaMedida;
}

/** Referencia de batería sugerida (el técnico confirma contra el catálogo). */
export interface BateriaRef {
  nombre: string;
  /** codigo_interno del consumible en catálogo (BAT-xxx), si se conoce. */
  codigoInterno?: string;
}

export interface ControllerProfile {
  /** Control general exterior del armario (vacío en KUKA: no aplica). */
  armarioExterior: string[];
  /** Control general interior del armario. */
  armarioInterior: string[];
  /** Control del cableado a robot. */
  cableado: string[];
  /** Unidad de programación (FlexPendant / smartPAD / S4 pendant). */
  teachPendant: string[];
  /** Campos de control del sistema. */
  sistemaCampos: string[];
  /** KUKA KRC4/5 es un PC: añade clonado disco + RAM. */
  sistemaConRam: boolean;
  /** Baterías que vive en la controladora (CMOS, DSQC508...). El SMB va en el manipulador. */
  bateriasControlador: BateriaRef[];
}

export interface ExternalAxisProfile {
  /** Checks por eje del eje externo (track / positioner). */
  ejeChecks: string[];
  /** Inspecciones generales del eje externo. */
  generalChecks: string[];
  calibracion: CalibracionTipo;
  /** El eje externo tiene su propia batería SMB de medida. */
  bateriaMedida: BateriaMedida;
}

// ============================================================
// ABB — IRC5 / OmniCore (articulado 6 ejes)  [del Word IRB6620]
// ============================================================

const ABB_MECH_6AXIS: MechanicalProfile = {
  ejeBase: ['Estado del resolver', 'Funcionamiento general'],
  ejeExtras: {
    1: ['Estado del circuito neumático', 'Estado conexiones del cableado de la base', 'Estado del tope mecánico', 'Juego anormal'],
    2: ['Estado del arnés de cables', 'Estado del amortiguador del tope mecánico'],
    3: ['Estado del amortiguador del tope mecánico', 'Funcionamiento lámpara de motores (opción)'],
    4: ['Inspección de los conectores HARTING', 'Estado del circuito neumático', 'Estado del amortiguador del tope mecánico'],
    5: ['Estado del amortiguador del tope mecánico'],
    6: ['Estado del cable'],
  },
  generalChecks: [
    'Etiquetas de información del manipulador',
    'Funcionamiento signal lamp (opción)',
    'Limpieza del robot (exterior)',
  ],
  calibracion: 'abb_conmutacion',
  bateriaMedida: 'smb',
};

const ABB_IRC5_CONTROLLER: ControllerProfile = {
  armarioExterior: [
    'Estado del botón de motores',
    'Funcionamiento conmutador Manual/Automático',
    'Funcionamiento botón de emergencia',
    'Funcionamiento lectura/escritura',
    'Mensaje control de la batería',
    'Conector ethernet',
  ],
  armarioInterior: [
    'Orden cables internos',
    'Limpieza',
    'Estado de la junta de la puerta',
    'Fijación de los elementos',
    'Funcionamiento de los ventiladores',
    'Reemplazo del filtro del transformador',
    'Estado de climatización',
    'Estado de las aletas de la turbina',
    'Reemplazo del filtro',
  ],
  cableado: ['Estado de los cables', 'Conexión de tierra'],
  teachPendant: [
    'Funcionamiento del teclado',
    'Funcionamiento de la pantalla',
    'Funcionamiento del táctil',
    'Funcionamiento del Joystick',
    'Funcionamiento botón de emergencia',
    'Estado del lápiz',
    'Estado del cable',
    'Estado de la carcasa',
  ],
  sistemaCampos: [
    'Versión del sistema',
    'Aplicaciones instaladas',
    'Copia de seguridad al día',
    'Valores de supervisión',
    'Mensaje de error',
  ],
  sistemaConRam: false,
  bateriasControlador: [{ nombre: 'Pila CMOS CR2032', codigoInterno: 'BAT-032' }],
};

// ============================================================
// ABB — S4 / S4C / S4C+ (articulado)  [del Word IRB2400 S4C+]
// ============================================================

const ABB_S4_MECH_6AXIS: MechanicalProfile = {
  ejeBase: ['Estado del resolver', 'Funcionamiento general'],
  ejeExtras: {
    1: ['Movimiento tope mecánico', 'Estado tope mecánico', 'Estado protección tope mecánico', 'Estado del circuito neumático', 'Estado conexiones de la base'],
    2: ['Estado del arnés de cables'],
    4: ['Estado conectores CP/CS', 'Estado del circuito neumático'],
    6: ['Estado del cable'],
  },
  generalChecks: ['Limpieza del robot (exterior)'],
  calibracion: 'abb_conmutacion',
  bateriaMedida: 'smb',
};

const ABB_S4_CONTROLLER: ControllerProfile = {
  armarioExterior: ABB_IRC5_CONTROLLER.armarioExterior,
  armarioInterior: ABB_IRC5_CONTROLLER.armarioInterior,
  cableado: ABB_IRC5_CONTROLLER.cableado,
  // El pendant S4 no es táctil ni tiene lápiz.
  teachPendant: [
    'Funcionamiento del teclado',
    'Funcionamiento de la pantalla',
    'Funcionamiento del Joystick',
    'Funcionamiento botón de emergencia',
    'Estado del cable',
    'Estado de la carcasa',
  ],
  sistemaCampos: ['Versión del sistema', 'Aplicaciones instaladas', 'Copia de seguridad al día', 'Valores de supervisión', 'Mensaje de error'],
  sistemaConRam: false,
  bateriasControlador: [
    { nombre: 'Batería de respaldo (DSQC508)', codigoInterno: 'BAT-035' },
    { nombre: 'Pila CMOS CR2032', codigoInterno: 'BAT-036' },
  ],
};

// ============================================================
// ABB — Eje externo (track / positioner) con SMB propia
// ============================================================

const ABB_EXTERNAL_AXIS: ExternalAxisProfile = {
  ejeChecks: [
    'Estado mecánico general',
    'Estado de lubricación',
    'Estado de los conectores',
    'Estado del cableado',
    'Estado del resolver',
    'Funcionamiento general',
  ],
  generalChecks: ['Limpieza del eje externo'],
  calibracion: 'abb_conmutacion',
  bateriaMedida: 'smb',
};

// ============================================================
// Selectores
// ============================================================

/** Cinemáticas articuladas (no palletizer/scara/delta). */
function esArticulado(cinematica: string | null | undefined): boolean {
  return !cinematica || cinematica.startsWith('articulated') || cinematica === 'tricept_6axis';
}

export function getMechanicalProfile(marca: Marca, generacion: string | null, cinematica: string | null): MechanicalProfile {
  if (marca === 'ABB') {
    const esS4 = !!generacion && /S4/i.test(generacion);
    // Por ahora, perfil articulado (otras cinemáticas se añadirán al tener ejemplos).
    if (esArticulado(cinematica)) return esS4 ? ABB_S4_MECH_6AXIS : ABB_MECH_6AXIS;
    return esS4 ? ABB_S4_MECH_6AXIS : ABB_MECH_6AXIS;
  }
  // KUKA: pendiente de extracción. Estructura base provisional.
  return ABB_MECH_6AXIS;
}

// ============================================================
// Checks de inspección ESPECÍFICOS POR MODELO (además de los del perfil), por nº de eje.
// Para actividades que solo tienen ciertos modelos (p.ej. engrases de rodamientos del
// IRB 8700, sección 3.5 del manual) y que NO aplican a todos los ABB.
// ============================================================
const MODEL_EJE_EXTRAS: { match: RegExp; ejes: Record<number, string[]> }[] = [
  {
    // IRB 8700 (todas las variantes): engrases de rodamientos (manual 3.5 Lubrication activities).
    match: /^IRB\s*8700/i,
    ejes: {
      1: ['Engrase del rodamiento cross roller (Mobillux EP2, 3 g/boquilla)'],
      2: ['Engrase del rodamiento esférico del balancing device (Tribol GR 100-2 PD, 25 ml)'],
      3: [
        'Engrase del rodamiento esférico del balancing device (Tribol GR 100-2 PD, 25 ml)',
        'Engrase del rodamiento esférico del brazo inferior (Mobillux EP2, 3-6 g)',
      ],
    },
  },
];

/** Checks extra de inspección por eje, específicos del modelo (objeto vacío si no aplica). */
export function getModelEjeExtras(modeloNombre: string): Record<number, string[]> {
  for (const m of MODEL_EJE_EXTRAS) if (m.match.test(modeloNombre)) return m.ejes;
  return {};
}

export function getControllerProfile(marca: Marca, generacion: string | null): ControllerProfile {
  if (marca === 'ABB') {
    const esS4 = !!generacion && /S4/i.test(generacion);
    return esS4 ? ABB_S4_CONTROLLER : ABB_IRC5_CONTROLLER;
  }
  return ABB_IRC5_CONTROLLER;
}

export function getExternalAxisProfile(_marca: Marca): ExternalAxisProfile {
  return ABB_EXTERNAL_AXIS;
}
