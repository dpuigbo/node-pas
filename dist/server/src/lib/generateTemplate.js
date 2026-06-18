"use strict";
/**
 * Motor auto-generador de plantillas de informe.
 *
 * Combina el PERFIL (reportProfiles) con los DATOS del plan (lubricacion + catalogo).
 * Cada seccion de inspeccion es una TABLA cuyo TITULO va en una fila propia de la tabla
 * (barra gris), con la cabecera de columnas debajo (estilo informes Word). La columna
 * Operacion es de solo lectura (tipo 'label', envuelve). Los datos de identidad tambien
 * van en tabla. Los titulos de seccion principal (H1) llevan subtitulo y un separador de
 * espacio grande debajo; entre cada elemento hay un separador. Las secciones se marcan
 * con `component_section` (contentType) para la plantilla general.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMechanicalSchema = buildMechanicalSchema;
exports.buildControllerSchema = buildControllerSchema;
exports.buildExternalAxisSchema = buildExternalAxisSchema;
exports.generateTemplateForModel = generateTemplateForModel;
const node_crypto_1 = require("node:crypto");
const reportProfiles_1 = require("./reportProfiles");
// ===== Helpers =====
const uuid = () => (0, node_crypto_1.randomUUID)();
const block = (type, config) => ({ id: uuid(), type, config });
const PAGE = { orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 }, fontSize: 10 };
// Estilo de tabla (como "Informacion general"): barra de titulo gris + cabecera gris clara.
const TBL = { titleBg: '#9ca3af', titleColor: '#111827', headerBg: '#d1d5db', headerColor: '#1f2937', headerPosition: 'top' };
function slug(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
const componentSection = (contentType) => block('component_section', { contentType });
const sectionH1 = (title, description = '') => block('section_title', { title, description, level: 1, color: '#1e293b' });
/** Separador de espacio grande y centrado entre elementos. */
const spaceSeparator = () => block('divider', { style: 'space', spacing: 'large', align: 'center' });
/** Cabecera de seccion principal: titulo + subtitulo + separador grande debajo. */
function pushH1(b, title, description) {
    b.push(sectionH1(title, description));
    b.push(spaceSeparator());
}
function ejesDeCinematica(cinematica) {
    if (!cinematica)
        return 6;
    if (cinematica.includes('5axis'))
        return 5;
    if (cinematica.includes('4axis'))
        return 4;
    return 6;
}
/** Tabla de identidad: titulo en barra + cabecera de etiquetas + una fila de valores. */
function infoTable(key, title, cols) {
    return block('table', {
        key, label: '', title, ...TBL,
        columns: cols.map((c) => ({ key: c.key, label: c.label, type: 'text', width: 'auto' })),
        fixedRows: [Object.fromEntries(cols.map((c) => [c.key, c.value]))],
        allowAddRows: false, minRows: 1, maxRows: 1,
    });
}
/** Tabla de inspeccion: titulo en barra + (Operacion | N/A | Bien | Mal | Observaciones). */
function inspectionTable(key, title, checks) {
    return block('table', {
        key, label: '', title, ...TBL,
        columns: [
            { key: 'operacion', label: 'Operación', type: 'label', width: 'auto' },
            { key: 'na', label: 'N/A', type: 'checkbox', width: '55px' },
            { key: 'bien', label: 'Bien', type: 'checkbox', width: '55px' },
            { key: 'mal', label: 'Mal', type: 'checkbox', width: '55px' },
            { key: 'observaciones', label: 'Observaciones', type: 'text', width: 'auto' },
        ],
        fixedRows: checks.map((chk) => ({ operacion: chk, na: false, bien: false, mal: false, observaciones: '' })),
        allowAddRows: true, minRows: checks.length, maxRows: checks.length + 10,
    });
}
function calibracionBlock(tipo, nEjes, title) {
    if (tipo === 'abb_conmutacion') {
        return block('table', {
            key: 'conmutacion_calibracion', label: '', title, ...TBL,
            columns: [
                { key: 'eje', label: 'Eje', type: 'label', width: '50px' },
                { key: 'conm_orig', label: 'Conmutación original', type: 'text', width: 'auto' },
                { key: 'conm_real', label: 'Conmutación real', type: 'text', width: 'auto' },
                { key: 'cal_etiqueta', label: 'Calibración etiqueta', type: 'text', width: 'auto' },
                { key: 'cal_sistema', label: 'Calibración sistema', type: 'text', width: 'auto' },
            ],
            fixedRows: Array.from({ length: nEjes }, (_, i) => ({ eje: String(i + 1), conm_orig: '', conm_real: '', cal_etiqueta: '', cal_sistema: '' })),
            allowAddRows: false, minRows: nEjes, maxRows: nEjes,
        });
    }
    if (tipo === 'kuka_angulo') {
        return block('table', {
            key: 'calibracion_angulo', label: '', title, ...TBL,
            columns: [
                { key: 'eje', label: 'Eje', type: 'label', width: '50px' },
                { key: 'dif_angulo_motor', label: 'Diferencia ángulo motor', type: 'text', width: 'auto' },
                { key: 'dif_posicion_eje', label: 'Diferencia posición eje [º]', type: 'text', width: 'auto' },
            ],
            fixedRows: Array.from({ length: nEjes }, (_, i) => ({ eje: String(i + 1), dif_angulo_motor: '', dif_posicion_eje: '' })),
            allowAddRows: false, minRows: nEjes, maxRows: nEjes,
        });
    }
    return null;
}
function bateriasTable(key, title, rows) {
    return block('table', {
        key, label: '', title, ...TBL,
        columns: [
            { key: 'bateria', label: 'Pila/Batería', type: 'label', width: 'auto' },
            { key: 'referencia', label: 'Referencia', type: 'label', width: 'auto' },
            { key: 'reemplazado', label: 'Reemplazado', type: 'checkbox', width: '100px' },
            { key: 'fecha', label: 'Fecha de reemplazo', type: 'text', width: '130px' },
        ],
        fixedRows: rows.map((b) => ({ bateria: b.nombre, referencia: b.referencia || '-', reemplazado: false, fecha: '' })),
        allowAddRows: true, minRows: rows.length, maxRows: rows.length + 5,
    });
}
function reducerOilsBlock(key, title, reductoras) {
    return block('reducer_oils', {
        key, label: '', title,
        titleBg: TBL.titleBg, titleColor: TBL.titleColor, headerBg: TBL.headerBg, headerColor: TBL.headerColor, required: false,
        fixedRows: reductoras.map((r) => ({
            eje: r.eje, tipoSuministro: r.tipoSuministro, aceiteId: r.aceiteId,
            unidad: r.unidad, volumen: r.volumen, niveles: r.niveles, lifetime: r.lifetime,
        })),
    });
}
function ejesFrenosTable(nEjes, title) {
    return block('table', {
        key: 'ejes_frenos', label: '', title, ...TBL,
        columns: [
            { key: 'eje', label: 'Eje', type: 'label', width: '60px' },
            { key: 'func_eje', label: 'Funcionamiento eje', type: 'checkbox', width: '120px' },
            { key: 'func_freno', label: 'Funcionamiento freno', type: 'checkbox', width: '120px' },
            { key: 'observaciones', label: 'Observaciones', type: 'text', width: 'auto' },
        ],
        fixedRows: Array.from({ length: nEjes }, (_, i) => ({ eje: String(i + 1), func_eje: false, func_freno: false, observaciones: '' })),
        allowAddRows: false, minRows: nEjes, maxRows: nEjes,
    });
}
function buildMechanicalSchema(input) {
    const { nEjes, reductoras, bateriasSMB, overhaulHoras, profile } = input;
    const b = [];
    // === manipulator_info (identidad en tabla + instalacion) ===
    b.push(componentSection('manipulator_info'));
    pushH1(b, 'Información del manipulador', 'Identificación e instalación del manipulador');
    b.push(infoTable('manipulador_identidad', 'Información del manipulador', [
        { key: 'numero_serie', label: 'Número de serie', value: '{{componente.numero_serie}}' },
        { key: 'tipo', label: 'Tipo de manipulador', value: '{{componente.modelo}}' },
        { key: 'fecha_fabricacion', label: 'Fecha de fabricación', value: '' },
    ]));
    b.push(spaceSeparator());
    b.push(block('select_field', {
        key: 'presencia_cubierta', label: 'Presencia de cubierta y estado', required: false, width: 'third', helpText: '',
        options: [{ value: 'si_bien', label: 'Sí - Bien' }, { value: 'si_mal', label: 'Sí - Mal' }, { value: 'no', label: 'No' }, { value: 'na', label: 'N/A' }],
    }));
    b.push(block('select_field', {
        key: 'tipo_montaje', label: 'Tipo de montaje', required: false, width: 'third', helpText: '',
        options: [{ value: 'normal', label: 'Normal' }, { value: 'pared', label: 'Pared' }, { value: 'invertido', label: 'Invertido' }],
    }));
    b.push(block('number_field', { key: 'altura_base', label: 'Altura de la base', required: false, width: 'third', helpText: '', unit: 'mm', min: 0, max: null }));
    // === mechanical_unit_control ===
    b.push(componentSection('mechanical_unit_control'));
    pushH1(b, 'Control de la unidad mecánica', 'Reductoras, control por eje, frenos y calibración');
    if (reductoras.length > 0)
        b.push(reducerOilsBlock('reductoras', 'Reductoras del manipulador', reductoras));
    for (let e = 1; e <= nEjes; e++) {
        b.push(spaceSeparator());
        const checks = [...(profile.ejeExtras[e] || []), ...profile.ejeBase];
        b.push(inspectionTable(`eje${e}_control`, `Control eje ${e}`, checks));
    }
    const generales = [...profile.generalChecks];
    if (overhaulHoras)
        generales.push(`Overhaul completo (cada ${overhaulHoras} h)`);
    if (generales.length > 0) {
        b.push(spaceSeparator());
        b.push(inspectionTable('inspecciones_generales', 'Inspecciones generales del manipulador', generales));
    }
    b.push(spaceSeparator());
    b.push(ejesFrenosTable(nEjes, 'Funcionamiento de ejes y frenos'));
    // === manipulator_battery (SMB) ===
    if (profile.bateriaMedida === 'smb' && bateriasSMB.length > 0) {
        b.push(componentSection('manipulator_battery'));
        pushH1(b, 'Baterías de medida (SMB)', 'Control de las baterías SMB del manipulador');
        b.push(bateriasTable('baterias_smb', 'Control de baterías SMB', bateriasSMB));
    }
    // === calibration ===
    const cal = calibracionBlock(profile.calibracion, nEjes, 'Valores de conmutación y calibración');
    if (cal) {
        b.push(componentSection('calibration'));
        pushH1(b, 'Valores de conmutación y calibración', 'Offsets de conmutación y valores de calibración');
        b.push(cal);
    }
    return { blocks: b, pageConfig: PAGE };
}
function buildControllerSchema(input) {
    const { bateriasControlador, profile } = input;
    const b = [];
    // === controller_info ===
    b.push(componentSection('controller_info'));
    pushH1(b, 'Información de la controladora', 'Identificación de la controladora');
    b.push(infoTable('controladora_identidad', 'Información de la controladora', [
        { key: 'numero_serie', label: 'Número de serie', value: '{{componente.numero_serie}}' },
        { key: 'tipo', label: 'Tipo de controlador', value: '{{componente.modelo}}' },
        { key: 'fecha_fabricacion', label: 'Fecha de fabricación', value: '' },
    ]));
    // === cabinet_control ===
    b.push(componentSection('cabinet_control'));
    pushH1(b, 'Control del armario', 'Revisión exterior, interior, cableado y baterías');
    if (profile.armarioExterior.length > 0) {
        b.push(inspectionTable('armario_exterior', 'Control general exterior', profile.armarioExterior));
        b.push(spaceSeparator());
    }
    b.push(inspectionTable('armario_interior', 'Control general interior', profile.armarioInterior));
    b.push(spaceSeparator());
    b.push(inspectionTable('cableado_robot', 'Control cableado a robot', profile.cableado));
    if (bateriasControlador.length > 0) {
        b.push(spaceSeparator());
        b.push(bateriasTable('baterias_controlador', 'Control de pilas y baterías', bateriasControlador));
    }
    // === programming_unit_control ===
    b.push(componentSection('programming_unit_control'));
    pushH1(b, 'Control de la unidad de programación', 'Revisión del teach pendant');
    b.push(inspectionTable('teach_pendant', 'Control de la unidad de programación', profile.teachPendant));
    // === system_control ===
    b.push(componentSection('system_control'));
    pushH1(b, 'Control del sistema', 'Versión, copia de seguridad y supervisión');
    b.push(block('text_field', { key: 'sistema_version', label: 'Versión del sistema', required: false, width: 'half', helpText: '', placeholder: '' }));
    if (profile.sistemaConRam) {
        b.push(block('text_field', { key: 'sistema_ram_disponible', label: 'Disponibilidad de la RAM', required: false, width: 'half', helpText: '', placeholder: '' }));
        b.push(block('text_field', { key: 'sistema_ram_ocupacion', label: 'Ocupación de la RAM', required: false, width: 'half', helpText: '', placeholder: '' }));
    }
    const sistemaChecks = profile.sistemaCampos.filter((c) => !/versi/i.test(c));
    if (profile.sistemaConRam)
        sistemaChecks.push('Clonado de disco duro');
    b.push(inspectionTable('sistema_checks', 'Control general del sistema', sistemaChecks));
    return { blocks: b, pageConfig: PAGE };
}
function buildExternalAxisSchema(input) {
    const { nEjes, reductoras, bateriasSMB, profile } = input;
    const b = [];
    // === manipulator_info ===
    b.push(componentSection('manipulator_info'));
    pushH1(b, 'Información del eje externo', 'Identificación del eje externo');
    b.push(infoTable('eje_identidad', 'Información del eje externo', [
        { key: 'numero_serie', label: 'Número de serie', value: '{{componente.numero_serie}}' },
        { key: 'tipo', label: 'Tipo', value: '{{componente.modelo}}' },
        { key: 'fecha_fabricacion', label: 'Fecha de fabricación', value: '' },
    ]));
    // === mechanical_unit_control ===
    b.push(componentSection('mechanical_unit_control'));
    pushH1(b, 'Control del eje externo', 'Lubricación, control por eje, baterías y calibración');
    if (reductoras.length > 0)
        b.push(reducerOilsBlock('reductoras_eje', 'Lubricación del eje externo', reductoras));
    for (let e = 1; e <= nEjes; e++) {
        b.push(spaceSeparator());
        b.push(inspectionTable(`ejeext${e}_control`, `Control eje externo ${e}`, profile.ejeChecks));
    }
    if (profile.generalChecks.length > 0) {
        b.push(spaceSeparator());
        b.push(inspectionTable('eje_inspecciones_generales', 'Inspecciones generales del eje externo', profile.generalChecks));
    }
    // === manipulator_battery (SMB del eje externo) ===
    if (profile.bateriaMedida === 'smb' && bateriasSMB.length > 0) {
        b.push(componentSection('manipulator_battery'));
        pushH1(b, 'Batería de medida (SMB) del eje externo', 'Control de la batería SMB del eje');
        b.push(bateriasTable('baterias_smb_eje', 'Control de baterías SMB del eje', bateriasSMB));
    }
    // === calibration ===
    const cal = calibracionBlock(profile.calibracion, nEjes, 'Calibración del eje externo');
    if (cal) {
        b.push(componentSection('calibration'));
        pushH1(b, 'Calibración del eje externo', 'Offsets de conmutación y calibración');
        b.push(cal);
    }
    return { blocks: b, pageConfig: PAGE };
}
// ===== Wrapper Prisma =====
function marcaDe(fabricante) {
    return (fabricante || '').toUpperCase().includes('KUKA') ? 'KUKA' : 'ABB';
}
async function batteriesBySubtipo(prisma, subtipos) {
    const rows = await prisma.consumibleCatalogo.findMany({
        where: { tipo: 'bateria', subtipo: { in: subtipos }, activo: true },
        select: { id: true, nombre: true, codigoFabricante: true },
        orderBy: { codigoInterno: 'asc' },
    });
    return rows.map((r) => ({ nombre: r.nombre, referencia: r.codigoFabricante ?? '', consumibleId: r.id }));
}
async function batteriesByCodigo(prisma, refs) {
    const codigos = refs.map((r) => r.codigoInterno).filter(Boolean);
    if (codigos.length === 0)
        return refs.map((r) => ({ nombre: r.nombre, referencia: '', consumibleId: null }));
    const rows = await prisma.consumibleCatalogo.findMany({
        where: { codigoInterno: { in: codigos } },
        select: { id: true, nombre: true, codigoFabricante: true, codigoInterno: true },
    });
    const byCod = new Map(rows.map((r) => [r.codigoInterno, r]));
    return refs.map((r) => {
        const hit = r.codigoInterno ? byCod.get(r.codigoInterno) : null;
        return { nombre: r.nombre, referencia: hit?.codigoFabricante ?? '', consumibleId: hit?.id ?? null };
    });
}
async function loadReductoras(prisma, modeloId) {
    const rows = await prisma.lubricacion.findMany({
        where: { modeloComponenteId: modeloId },
        include: { consumible: { select: { id: true, nombre: true } }, nivel: { select: { codigo: true } } },
        orderBy: { eje: 'asc' },
    });
    return rows.map((r) => {
        const lifetime = !!r.lifetime;
        const nombre = r.consumible?.nombre ?? '';
        return {
            eje: String(r.eje),
            tipoSuministro: nombre ? (lifetime ? `${nombre} (de por vida)` : nombre) : (lifetime ? 'Lubricado de por vida' : ''),
            aceiteId: r.consumibleId ?? null,
            unidad: r.cantidadUnidad === 'l' ? 'L' : (r.cantidadUnidad ?? ''),
            volumen: r.cantidadValor != null ? String(Number(r.cantidadValor)) : '',
            niveles: lifetime ? [] : (r.nivel?.codigo ? [r.nivel.codigo] : []),
            lifetime,
        };
    });
}
async function generateTemplateForModel(prisma, modeloId) {
    const model = await prisma.modeloComponente.findUnique({
        where: { id: modeloId },
        include: { fabricante: { select: { nombre: true } }, familiaRel: { select: { tipoCinematica: true } }, generacion: { select: { codigo: true } } },
    });
    if (!model)
        throw new Error(`Modelo ${modeloId} no encontrado`);
    const marca = marcaDe(model.fabricante?.nombre);
    const generacion = model.generacion?.codigo ?? null;
    const cinematica = model.familiaRel?.tipoCinematica ?? null;
    if (model.tipo === 'mechanical_unit') {
        const reductoras = await loadReductoras(prisma, modeloId);
        const nEjes = ejesDeCinematica(cinematica);
        const profile = (0, reportProfiles_1.getMechanicalProfile)(marca, generacion, cinematica);
        const bateriasSMB = profile.bateriaMedida === 'smb' ? await batteriesBySubtipo(prisma, ['smb_2pole', 'smb_3pole']) : [];
        return buildMechanicalSchema({ nEjes, reductoras, bateriasSMB, overhaulHoras: 40000, profile });
    }
    if (model.tipo === 'controller') {
        const profile = (0, reportProfiles_1.getControllerProfile)(marca, generacion);
        const bateriasControlador = await batteriesByCodigo(prisma, profile.bateriasControlador);
        return buildControllerSchema({ bateriasControlador, profile });
    }
    if (model.tipo === 'external_axis') {
        const reductoras = await loadReductoras(prisma, modeloId);
        const nEjes = reductoras.length || 1;
        const profile = (0, reportProfiles_1.getExternalAxisProfile)(marca);
        const bateriasSMB = profile.bateriaMedida === 'smb' ? await batteriesBySubtipo(prisma, ['smb_2pole', 'smb_3pole']) : [];
        return buildExternalAxisSchema({ nEjes, reductoras, bateriasSMB, profile });
    }
    return {
        blocks: [
            componentSection('controller_info'),
            sectionH1('Información del componente'),
            spaceSeparator(),
            infoTable('componente_identidad', 'Información del componente', [
                { key: 'numero_serie', label: 'Número de serie', value: '{{componente.numero_serie}}' },
                { key: 'tipo', label: 'Tipo', value: '{{componente.modelo}}' },
                { key: 'fecha_fabricacion', label: 'Fecha de fabricación', value: '' },
            ]),
        ],
        pageConfig: PAGE,
    };
}
//# sourceMappingURL=generateTemplate.js.map