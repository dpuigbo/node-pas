"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMechanicalProfile = getMechanicalProfile;
exports.getModelEjeExtras = getModelEjeExtras;
exports.getControllerProfile = getControllerProfile;
exports.getExternalAxisProfile = getExternalAxisProfile;
// ============================================================
// ABB — IRC5 / OmniCore (articulado 6 ejes)  [del Word IRB6620]
// ============================================================
const ABB_MECH_6AXIS = {
    ejeBase: ['Estado del resolver', 'Funcionamiento general'],
    ejeExtras: {
        1: ['Estado del circuito neumático', 'Estado conexiones del cableado de la base', 'Estado del tope mecánico', 'Juego anormal'],
        2: ['Estado del arnés de cables', 'Estado del amortiguador del tope mecánico'],
        3: ['Estado del amortiguador del tope mecánico', 'Funcionamiento lámpara de motores (opción)'],
        4: ['Inspección de los conectores HARTING', 'Estado del circuito neumático', 'Estado del amortiguador del tope mecánico'],
        5: ['Estado del amortiguador del tope mecánico'],
        6: ['Estado del cable'],
    },
    // Tabla "Control general de ejes" de los informes Word (va tras ejes y frenos).
    generalChecks: [
        'Juego anormal en los ejes',
        'Estado valores de sincronización en el manipulador',
        'Verificación posición de sincronización del manipulador',
    ],
    calibracion: 'abb_conmutacion',
    bateriaMedida: 'smb',
};
const ABB_IRC5_CONTROLLER = {
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
const ABB_S4_MECH_6AXIS = {
    ejeBase: ['Estado del resolver', 'Funcionamiento general'],
    ejeExtras: {
        1: ['Movimiento tope mecánico', 'Estado tope mecánico', 'Estado protección tope mecánico', 'Estado del circuito neumático', 'Estado conexiones de la base'],
        2: ['Estado del arnés de cables'],
        4: ['Estado conectores CP/CS', 'Estado del circuito neumático'],
        6: ['Estado del cable'],
    },
    // Mismo "Control general de ejes" del esqueleto Word (comun a las generaciones ABB).
    generalChecks: [
        'Juego anormal en los ejes',
        'Estado valores de sincronización en el manipulador',
        'Verificación posición de sincronización del manipulador',
    ],
    calibracion: 'abb_conmutacion',
    bateriaMedida: 'smb',
};
const ABB_S4_CONTROLLER = {
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
// KUKA — KRC (articulado 6 ejes)  [del Word real KR16/KRC4, BMTC 2026]
// ============================================================
const KUKA_MECH_6AXIS = {
    // En KUKA solo el eje 1 lista el resolver; el comun a todos es el funcionamiento.
    ejeBase: ['Funcionamiento general'],
    ejeExtras: {
        1: [
            'Estado del circuito neumático',
            'Estado conexiones del cableado de la base',
            'Comprobación grasa para cableado en la base',
            'Estado del tope mecánico',
            'Estado del resolver',
        ],
        // Grupo "ejes 2 y 3" del Word (los extras del grupo cuelgan del eje 2).
        2: [
            'Estado arnés de cables',
            'Estado rodamiento del codo',
            'Estado de los amortiguadores del eje',
            'Estado del tope mecánico',
        ],
        // Grupo "ejes 4 y 5" del Word.
        4: [
            'Control de tensión de la correa',
            'Engrasado de los retenes',
            'Estado del tope mecánico',
        ],
        6: ['Engrasado del retén del eje'],
    },
    generalChecks: [
        'Juego anormal en los ejes',
        'Verificación posición de sincronización del manipulador',
    ],
    calibracion: 'kuka_angulo',
    bateriaMedida: null, // KUKA no lleva SMB; sus baterias van en la controladora.
};
const KUKA_KRC_CONTROLLER = {
    armarioExterior: [], // KUKA no tiene tabla de exterior en los informes.
    armarioInterior: [
        'Orden cables internos',
        'Limpieza',
        'Estado de la junta de la puerta',
        'Estado de la junta del canal de ventilación',
        'Fijación de los elementos',
        'Limpieza y funcionamiento del ventilador trasero',
        'Limpieza del disipador lateral izquierdo',
        'Cambio del tapón de compensación de presión',
    ],
    cableado: ['Estado de los cables', 'Conexión de tierra'],
    // smartPAD: MoveSpace + palancas + contactor a llave + START/STOP fisicos.
    teachPendant: [
        'Funcionamiento del teclado',
        'Funcionamiento de la pantalla',
        'Funcionamiento del MoveSpace',
        'Funcionamiento botón de emergencia',
        'Estado de las palancas',
        'Estado del cable',
        'Estado de la carcasa',
        'Prueba del contactor a llave',
        'Estado de los botones START/STOP',
    ],
    sistemaCampos: [
        'Versión del sistema',
        'Aplicaciones instaladas',
        'Copia de seguridad al día (incluye parámetros del sistema)',
        'Valores de supervisión',
        'Mensaje de error',
    ],
    sistemaConRam: true, // KRC4/5 es un PC: clonado de disco + disponibilidad/ocupacion RAM.
    bateriasControlador: [
        { nombre: 'Batería de la controladora (PGB-5.2-12)' },
        { nombre: 'Pila CMOS CR2032', codigoInterno: 'BAT-032' },
    ],
};
// ============================================================
// ABB — Eje externo (track / positioner) con SMB propia
// ============================================================
const ABB_EXTERNAL_AXIS = {
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
function esArticulado(cinematica) {
    return !cinematica || cinematica.startsWith('articulated') || cinematica === 'tricept_6axis';
}
function getMechanicalProfile(marca, generacion, cinematica) {
    if (marca === 'ABB') {
        const esS4 = !!generacion && /S4/i.test(generacion);
        // Por ahora, perfil articulado (otras cinemáticas se añadirán al tener ejemplos).
        if (esArticulado(cinematica))
            return esS4 ? ABB_S4_MECH_6AXIS : ABB_MECH_6AXIS;
        return esS4 ? ABB_S4_MECH_6AXIS : ABB_MECH_6AXIS;
    }
    // KUKA: perfil del Word real KR16/KRC4 (BMTC 2026).
    return KUKA_MECH_6AXIS;
}
// ============================================================
// Checks de inspección ESPECÍFICOS POR MODELO (además de los del perfil), por nº de eje.
// Para actividades que solo tienen ciertos modelos (p.ej. engrases de rodamientos del
// IRB 8700, sección 3.5 del manual) y que NO aplican a todos los ABB.
// ============================================================
const MODEL_EJE_EXTRAS = [
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
function getModelEjeExtras(modeloNombre) {
    for (const m of MODEL_EJE_EXTRAS)
        if (m.match.test(modeloNombre))
            return m.ejes;
    return {};
}
function getControllerProfile(marca, generacion) {
    if (marca === 'ABB') {
        const esS4 = !!generacion && /S4/i.test(generacion);
        return esS4 ? ABB_S4_CONTROLLER : ABB_IRC5_CONTROLLER;
    }
    return KUKA_KRC_CONTROLLER;
}
function getExternalAxisProfile(_marca) {
    return ABB_EXTERNAL_AXIS;
}
//# sourceMappingURL=reportProfiles.js.map