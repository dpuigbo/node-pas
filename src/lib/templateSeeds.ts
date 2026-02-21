/**
 * Pre-built template schemas for each component type.
 * Based on real PAS Robotics maintenance reports.
 * These serve as starting points — users can modify them in the editor.
 */

function uuid() {
  return crypto.randomUUID();
}

function block(type: string, config: Record<string, unknown>) {
  return { id: uuid(), type, config };
}

// ============================================================
// MECHANICAL UNIT TEMPLATE
// Sections: Info general + Reductoras + Control por ejes
// ============================================================

export function getMechanicalUnitTemplate() {
  return {
    blocks: [
      // --- Seccion 1: Informacion general ---
      block('section_title', {
        title: 'Informacion general',
        description: '',
        level: 1,
        color: '#1e293b',
      }),

      block('text_field', {
        key: 'linea_cliente',
        label: 'Linea cliente',
        required: false,
        width: 'third',
        helpText: '',
        placeholder: 'Ej: C32',
      }),
      block('text_field', {
        key: 'denominacion_cliente',
        label: 'Denominacion cliente',
        required: false,
        width: 'third',
        helpText: '',
        placeholder: '',
      }),
      block('number_field', {
        key: 'contador_horas',
        label: 'Contador de horas',
        required: false,
        width: 'third',
        helpText: '',
        unit: 'h',
        min: 0,
        max: null,
      }),

      // Info del manipulador
      block('divider', { style: 'solid', spacing: 'small', color: '#e5e7eb' }),

      block('text_field', {
        key: 'manipulador_numero_serie',
        label: 'Numero de serie',
        required: true,
        width: 'third',
        helpText: '',
        placeholder: '',
      }),
      block('text_field', {
        key: 'manipulador_tipo',
        label: 'Tipo de manipulador',
        required: true,
        width: 'third',
        helpText: '',
        placeholder: 'Ej: IRB1200-5/0.9 Type A',
      }),
      block('date_field', {
        key: 'manipulador_fecha_fabricacion',
        label: 'Fecha de fabricacion',
        required: false,
        width: 'third',
        helpText: '',
      }),

      // Info instalacion
      block('divider', { style: 'solid', spacing: 'small', color: '#e5e7eb' }),

      block('select_field', {
        key: 'presencia_cubierta',
        label: 'Presencia de cubierta y estado',
        required: false,
        width: 'third',
        helpText: '',
        options: [
          { value: 'si_bien', label: 'Si - Bien' },
          { value: 'si_mal', label: 'Si - Mal' },
          { value: 'no', label: 'No' },
          { value: 'na', label: 'N/A' },
        ],
      }),
      block('select_field', {
        key: 'tipo_montaje',
        label: 'Tipo de montaje',
        required: false,
        width: 'third',
        helpText: '',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'pared', label: 'Pared' },
          { value: 'invertido', label: 'Invertido' },
        ],
      }),
      block('number_field', {
        key: 'altura_base',
        label: 'Altura de la base',
        required: false,
        width: 'third',
        helpText: '',
        unit: 'mm',
        min: 0,
        max: null,
      }),

      // --- Seccion 2: Control de la unidad mecanica ---
      block('section_title', {
        title: 'Control de la unidad mecanica',
        description: '',
        level: 1,
        color: '#1e293b',
      }),

      // Reductoras
      block('table', {
        key: 'reductoras',
        label: 'Reductoras del manipulador',
        columns: [
          { key: 'eje', label: 'Eje', type: 'text', width: '60px' },
          { key: 'tipo_suministro', label: 'Tipo suministro', type: 'text', width: 'auto' },
          { key: 'volumen', label: 'Volumen', type: 'text', width: 'auto' },
          { key: 'control', label: 'Control', type: 'checkbox', width: '80px' },
          { key: 'cambio', label: 'Cambio', type: 'checkbox', width: '80px' },
          { key: 'observaciones', label: 'Observaciones', type: 'text', width: 'auto' },
        ],
        fixedRows: [
          { eje: '1', tipo_suministro: '-', volumen: '-', control: false, cambio: false, observaciones: '-' },
          { eje: '2', tipo_suministro: '-', volumen: '-', control: false, cambio: false, observaciones: '-' },
          { eje: '3', tipo_suministro: '-', volumen: '-', control: false, cambio: false, observaciones: '-' },
          { eje: '4', tipo_suministro: '-', volumen: '-', control: false, cambio: false, observaciones: '-' },
          { eje: '5', tipo_suministro: '-', volumen: '-', control: false, cambio: false, observaciones: '-' },
          { eje: '6', tipo_suministro: '-', volumen: '-', control: false, cambio: false, observaciones: '-' },
        ],
        allowAddRows: false,
        minRows: 6,
        maxRows: 6,
      }),

      // Control eje 1
      block('section_title', {
        title: 'Control eje 1',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('tristate', { key: 'eje1_movimiento_tope', label: 'Movimiento tope mecanico', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje1_estado_tope', label: 'Estado tope mecanico', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje1_proteccion_tope', label: 'Estado proteccion tope mecanico', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje1_circuito_neumatico', label: 'Estado del circuito neumatico', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje1_conector', label: 'Estado del conector', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje1_resolver', label: 'Estado del resolver', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje1_funcionamiento', label: 'Funcionamiento general', withObservation: true, required: false, maintenanceLevel: 'level1' }),

      // Control ejes 2 y 3
      block('section_title', {
        title: 'Control ejes 2 y 3',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('tristate', { key: 'eje23_arnes_cables', label: 'Estado arnes de cables', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje23_tope_eje2', label: 'Estado tope mecanico eje 2', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje23_tope_eje3', label: 'Estado tope mecanico eje 3', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje23_resolver', label: 'Estado de los resolver', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje23_funcionamiento', label: 'Funcionamiento general', withObservation: true, required: false, maintenanceLevel: 'level1' }),

      // Control ejes 4 y 5
      block('section_title', {
        title: 'Control ejes 4 y 5',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('tristate', { key: 'eje45_conectores_cpcs', label: 'Inspeccion de conectores CP/CS', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje45_circuito_neumatico', label: 'Estado del circuito neumatico', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje45_tope_eje4', label: 'Estado tope mecanico eje 4', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje45_correa_eje4', label: 'Estado correa eje 4', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje45_correa_eje5', label: 'Estado correa eje 5', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje45_resolver', label: 'Estado del resolver', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje45_funcionamiento', label: 'Funcionamiento general', withObservation: true, required: false, maintenanceLevel: 'level1' }),

      // Control eje 6
      block('section_title', {
        title: 'Control eje 6',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('tristate', { key: 'eje6_cable', label: 'Estado del cable', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'eje6_funcionamiento', label: 'Funcionamiento general', withObservation: true, required: false, maintenanceLevel: 'level1' }),

      // Funcionamiento ejes y frenos
      block('section_title', {
        title: 'Funcionamiento de ejes y frenos',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('table', {
        key: 'ejes_frenos',
        label: 'Funcionamiento ejes y frenos',
        columns: [
          { key: 'eje', label: 'Eje', type: 'text', width: '60px' },
          { key: 'ruido', label: 'Ruido', type: 'checkbox', width: '80px' },
          { key: 'vibracion', label: 'Vibracion', type: 'checkbox', width: '80px' },
          { key: 'holgura', label: 'Holgura', type: 'checkbox', width: '80px' },
          { key: 'freno', label: 'Freno', type: 'checkbox', width: '80px' },
          { key: 'observaciones', label: 'Observaciones', type: 'text', width: 'auto' },
        ],
        fixedRows: [
          { eje: '1', ruido: false, vibracion: false, holgura: false, freno: false, observaciones: '' },
          { eje: '2', ruido: false, vibracion: false, holgura: false, freno: false, observaciones: '' },
          { eje: '3', ruido: false, vibracion: false, holgura: false, freno: false, observaciones: '' },
          { eje: '4', ruido: false, vibracion: false, holgura: false, freno: false, observaciones: '' },
          { eje: '5', ruido: false, vibracion: false, holgura: false, freno: false, observaciones: '' },
          { eje: '6', ruido: false, vibracion: false, holgura: false, freno: false, observaciones: '' },
        ],
        allowAddRows: false,
        minRows: 6,
        maxRows: 6,
      }),

      // Valores de conmutacion y calibracion
      block('section_title', {
        title: 'Valores de conmutacion y calibracion',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('table', {
        key: 'conmutacion_calibracion',
        label: 'Valores de conmutacion y calibracion',
        columns: [
          { key: 'eje', label: 'Eje', type: 'text', width: '60px' },
          { key: 'offset_actual', label: 'Offset actual', type: 'text', width: 'auto' },
          { key: 'offset_anterior', label: 'Offset anterior', type: 'text', width: 'auto' },
          { key: 'calibracion', label: 'Calibracion', type: 'text', width: 'auto' },
        ],
        fixedRows: [
          { eje: '1', offset_actual: '', offset_anterior: '', calibracion: '' },
          { eje: '2', offset_actual: '', offset_anterior: '', calibracion: '' },
          { eje: '3', offset_actual: '', offset_anterior: '', calibracion: '' },
          { eje: '4', offset_actual: '', offset_anterior: '', calibracion: '' },
          { eje: '5', offset_actual: '', offset_anterior: '', calibracion: '' },
          { eje: '6', offset_actual: '', offset_anterior: '', calibracion: '' },
        ],
        allowAddRows: false,
        minRows: 6,
        maxRows: 6,
      }),
    ],
    pageConfig: {
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      fontSize: 10,
    },
  };
}

// ============================================================
// CONTROLLER TEMPLATE
// Sections: Info controladora + Control armario + Teach pendant + Control sistema
// ============================================================

export function getControllerTemplate() {
  return {
    blocks: [
      // --- Info de la controladora ---
      block('section_title', {
        title: 'Informacion de la controladora',
        description: '',
        level: 1,
        color: '#1e293b',
      }),

      block('text_field', {
        key: 'controladora_numero_serie',
        label: 'Numero de serie',
        required: true,
        width: 'third',
        helpText: '',
        placeholder: '',
      }),
      block('text_field', {
        key: 'controladora_tipo',
        label: 'Tipo de controlador',
        required: true,
        width: 'third',
        helpText: '',
        placeholder: 'Ej: IRC5 Compact',
      }),
      block('date_field', {
        key: 'controladora_fecha_fabricacion',
        label: 'Fecha de fabricacion',
        required: false,
        width: 'third',
        helpText: '',
      }),

      // --- Seccion 3: Control del armario ---
      block('section_title', {
        title: 'Control del armario',
        description: '',
        level: 1,
        color: '#1e293b',
      }),

      block('section_title', {
        title: 'Control exterior',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('tristate', { key: 'armario_ext_estado_general', label: 'Estado general del armario', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_ext_cables_alimentacion', label: 'Estado cables de alimentacion', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_ext_ventilacion', label: 'Estado sistema de ventilacion', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_ext_conectores', label: 'Estado de conectores', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_ext_pulsanteria', label: 'Estado pulsanteria', withObservation: true, required: false, maintenanceLevel: 'level1' }),

      block('section_title', {
        title: 'Control interior',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('tristate', { key: 'armario_int_limpieza', label: 'Limpieza interior', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_int_drives', label: 'Estado drives', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_int_contactores', label: 'Estado contactores y reles', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_int_placa_cpu', label: 'Estado placa CPU', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_int_cableado', label: 'Estado del cableado interno', withObservation: true, required: false, maintenanceLevel: 'level1' }),

      block('section_title', {
        title: 'Cableado',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('tristate', { key: 'armario_cable_robot', label: 'Cable robot - controlador', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_cable_motor', label: 'Cables de motor', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_cable_smc', label: 'Cable SMC', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_cable_cp', label: 'Cables CP', withObservation: true, required: false, maintenanceLevel: 'level1' }),

      block('section_title', {
        title: 'Baterias',
        description: '',
        level: 2,
        color: '#475569',
      }),
      block('tristate', { key: 'armario_bat_smc', label: 'Bateria SMC', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'armario_bat_cpu', label: 'Bateria CPU', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('date_field', {
        key: 'armario_bat_fecha_cambio',
        label: 'Fecha ultimo cambio de baterias',
        required: false,
        width: 'half',
        helpText: '',
      }),
      block('date_field', {
        key: 'armario_bat_proximo_cambio',
        label: 'Proximo cambio recomendado',
        required: false,
        width: 'half',
        helpText: '',
      }),

      // --- Seccion 4: Control de la unidad de programacion ---
      block('section_title', {
        title: 'Control de la unidad de programacion',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('tristate', { key: 'tp_estado_general', label: 'Estado general', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'tp_pantalla', label: 'Estado de la pantalla', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'tp_joystick', label: 'Estado del joystick', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'tp_enabling', label: 'Dispositivo de habilitacion', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'tp_paro_emergencia', label: 'Paro de emergencia', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'tp_cable', label: 'Estado del cable', withObservation: true, required: false, maintenanceLevel: 'level1' }),

      // --- Seccion 5: Control del sistema ---
      block('section_title', {
        title: 'Control del sistema',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('text_field', {
        key: 'sistema_version_rw',
        label: 'Version RobotWare',
        required: false,
        width: 'half',
        helpText: '',
        placeholder: '',
      }),
      block('text_field', {
        key: 'sistema_paquetes',
        label: 'Paquetes / opciones instalados',
        required: false,
        width: 'half',
        helpText: '',
        placeholder: '',
      }),

      block('tristate', { key: 'sistema_backup', label: 'Backup realizado', withObservation: true, required: false, maintenanceLevel: 'general' }),
      block('tristate', { key: 'sistema_errores', label: 'Revision de errores del sistema', withObservation: true, required: false, maintenanceLevel: 'general' }),

      block('table', {
        key: 'sistema_supervision',
        label: 'Valores de supervision',
        columns: [
          { key: 'parametro', label: 'Parametro', type: 'text', width: 'auto' },
          { key: 'valor', label: 'Valor', type: 'text', width: 'auto' },
          { key: 'unidad', label: 'Unidad', type: 'text', width: '80px' },
        ],
        fixedRows: [
          { parametro: 'Velocidad maxima TCP', valor: '', unidad: 'mm/s' },
          { parametro: 'Temperatura CPU', valor: '', unidad: 'C' },
          { parametro: 'Temperatura Drive', valor: '', unidad: 'C' },
        ],
        allowAddRows: true,
        minRows: 3,
        maxRows: 20,
      }),

      // --- Seccion 6: Intercambio de equipos ---
      block('section_title', {
        title: 'Intercambio de equipos',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('table', {
        key: 'intercambio_equipos',
        label: 'Piezas intercambiadas',
        columns: [
          { key: 'descripcion', label: 'Descripcion', type: 'text', width: 'auto' },
          { key: 'referencia', label: 'Referencia', type: 'text', width: 'auto' },
          { key: 'sn_antiguo', label: 'S/N antiguo', type: 'text', width: 'auto' },
          { key: 'sn_nuevo', label: 'S/N nuevo', type: 'text', width: 'auto' },
        ],
        fixedRows: [],
        allowAddRows: true,
        minRows: 0,
        maxRows: 20,
      }),

      // --- Seccion 7: Observaciones generales ---
      block('section_title', {
        title: 'Observaciones generales',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('text_area', {
        key: 'observaciones_generales',
        label: 'Observaciones',
        required: false,
        width: 'full',
        helpText: 'Describe cualquier incidencia o aspecto relevante',
        rows: 6,
        placeholder: '',
      }),

      // --- Seccion 8: Estado y aceptacion ---
      block('section_title', {
        title: 'Estado y aceptacion',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('select_field', {
        key: 'estado_sistema',
        label: 'Estado general del sistema',
        required: true,
        width: 'full',
        helpText: '',
        options: [
          { value: 'correcto', label: 'Correcto - Sistema operativo' },
          { value: 'con_observaciones', label: 'Operativo con observaciones' },
          { value: 'requiere_intervencion', label: 'Requiere intervencion' },
          { value: 'fuera_servicio', label: 'Fuera de servicio' },
        ],
      }),
      block('signature', {
        key: 'firma_tecnico',
        label: 'Firma tecnico PAS',
        role: 'Tecnico de mantenimiento',
        required: true,
        width: 'half',
      }),
      block('signature', {
        key: 'firma_cliente',
        label: 'Firma cliente',
        role: 'Responsable cliente',
        required: true,
        width: 'half',
      }),
    ],
    pageConfig: {
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      fontSize: 10,
    },
  };
}

// ============================================================
// DRIVE UNIT TEMPLATE (simpler)
// ============================================================

export function getDriveUnitTemplate() {
  return {
    blocks: [
      block('section_title', {
        title: 'Informacion del drive unit',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('text_field', {
        key: 'drive_numero_serie',
        label: 'Numero de serie',
        required: true,
        width: 'third',
        helpText: '',
        placeholder: '',
      }),
      block('text_field', {
        key: 'drive_tipo',
        label: 'Tipo',
        required: true,
        width: 'third',
        helpText: '',
        placeholder: '',
      }),
      block('date_field', {
        key: 'drive_fecha_fabricacion',
        label: 'Fecha de fabricacion',
        required: false,
        width: 'third',
        helpText: '',
      }),

      block('section_title', {
        title: 'Control del drive',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('tristate', { key: 'drive_estado_general', label: 'Estado general', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'drive_ventilacion', label: 'Sistema de ventilacion', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'drive_conectores', label: 'Estado de conectores', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'drive_cableado', label: 'Estado del cableado', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'drive_funcionamiento', label: 'Funcionamiento general', withObservation: true, required: false, maintenanceLevel: 'level1' }),
    ],
    pageConfig: {
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      fontSize: 10,
    },
  };
}

// ============================================================
// EXTERNAL AXIS TEMPLATE (minimal)
// ============================================================

export function getExternalAxisTemplate() {
  return {
    blocks: [
      block('section_title', {
        title: 'Informacion del eje externo',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('text_field', {
        key: 'ext_numero_serie',
        label: 'Numero de serie',
        required: true,
        width: 'third',
        helpText: '',
        placeholder: '',
      }),
      block('text_field', {
        key: 'ext_tipo',
        label: 'Tipo',
        required: true,
        width: 'third',
        helpText: '',
        placeholder: '',
      }),
      block('date_field', {
        key: 'ext_fecha_fabricacion',
        label: 'Fecha de fabricacion',
        required: false,
        width: 'third',
        helpText: '',
      }),

      block('section_title', {
        title: 'Control del eje externo',
        description: '',
        level: 1,
        color: '#1e293b',
      }),
      block('tristate', { key: 'ext_estado_mecanico', label: 'Estado mecanico general', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'ext_lubricacion', label: 'Estado de lubricacion', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'ext_conectores', label: 'Estado de conectores', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'ext_cableado', label: 'Estado del cableado', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'ext_resolver', label: 'Estado del resolver', withObservation: true, required: false, maintenanceLevel: 'level1' }),
      block('tristate', { key: 'ext_funcionamiento', label: 'Funcionamiento general', withObservation: true, required: false, maintenanceLevel: 'level1' }),
    ],
    pageConfig: {
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      fontSize: 10,
    },
  };
}

/** Get seed template by component type */
export function getSeedTemplate(tipo: string) {
  switch (tipo) {
    case 'mechanical_unit': return getMechanicalUnitTemplate();
    case 'controller': return getControllerTemplate();
    case 'drive_unit': return getDriveUnitTemplate();
    case 'external_axis': return getExternalAxisTemplate();
    default: return { blocks: [], pageConfig: { orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 }, fontSize: 10 } };
  }
}
