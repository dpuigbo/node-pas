/**
 * Motor auto-generador de plantillas de informe.
 *
 * Dado un modelo de componente, genera su VersionTemplate.schema combinando:
 *   - el PERFIL de informe (estructura por marca/generación/cinemática) → reportProfiles
 *   - los DATOS del plan de mantenimiento (lubricacion, catálogo de baterías)
 *
 * Las plantillas de componente se dividen en secciones marcadas con bloques
 * `component_section` (contentType), para que la plantilla general (DocumentTemplate)
 * coloque cada sección en su `content_placeholder` correspondiente.
 *
 * Bloques compatibles con initDatos.ts / assembleReport.ts.
 * Layout: un bloque de control POR EJE INDIVIDUAL.
 */

import { randomUUID } from 'node:crypto';
import {
  getMechanicalProfile,
  getControllerProfile,
  getExternalAxisProfile,
  type Marca,
  type CalibracionTipo,
  type MechanicalProfile,
  type ControllerProfile,
  type ExternalAxisProfile,
} from './reportProfiles';

// ===== Tipos =====

interface Block { id: string; type: string; config: Record<string, unknown>; }
interface PageConfig { orientation: string; margins: { top: number; right: number; bottom: number; left: number }; fontSize: number; }
export interface TemplateSchema { blocks: Block[]; pageConfig: PageConfig; }

/** Fila de reductora resuelta desde `lubricacion` + catálogo. */
export interface ReductoraRow {
  eje: string;                // etiqueta del eje (puede ser "4 (primario)")
  tipoSuministro: string;     // nombre del consumible (+ "(de por vida)" si lifetime)
  aceiteId: number | null;    // consumible_catalogo.id
  unidad: string;             // L / ml / g ...
  volumen: string;            // valor
  niveles: string[];          // ['N2_INF'] | ['N2_SUP'] | [] (lifetime)
  lifetime: boolean;
}

/** Batería resuelta desde catálogo. */
export interface BateriaRow {
  nombre: string;
  referencia: string;         // codigo_fabricante (PN)
  consumibleId: number | null;
}

// ===== Helpers =====

const uuid = () => randomUUID();
const block = (type: string, config: Record<string, unknown>): Block => ({ id: uuid(), type, config });
const PAGE: PageConfig = { orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 }, fontSize: 10 };

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Separador de sección de componente (para la plantilla general). */
const componentSection = (contentType: string) => block('component_section', { contentType });
const sectionH1 = (title: string) => block('section_title', { title, description: '', level: 1, color: '#1e293b' });
const sectionH2 = (title: string) => block('section_title', { title, description: '', level: 2, color: '#475569' });
const tri = (key: string, label: string, nivel = 'level1') =>
  block('tristate', { key, label, withObservation: true, required: false, maintenanceLevel: nivel });

/** Nº de ejes del robot según la cinemática (fallback 6). */
function ejesDeCinematica(cinematica: string | null): number {
  if (!cinematica) return 6;
  if (cinematica.includes('5axis')) return 5;
  if (cinematica.includes('4axis')) return 4;
  return 6;
}

/** Tabla de calibración según marca. */
function calibracionBlock(tipo: CalibracionTipo, nEjes: number): Block | null {
  if (tipo === 'abb_conmutacion') {
    return block('table', {
      key: 'conmutacion_calibracion', label: 'Valores de conmutación y calibración',
      columns: [
        { key: 'eje', label: 'Eje', type: 'text', width: '50px' },
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
      key: 'calibracion_angulo', label: 'Verificación de posición de calibración',
      columns: [
        { key: 'eje', label: 'Eje', type: 'text', width: '50px' },
        { key: 'dif_angulo_motor', label: 'Diferencia ángulo motor', type: 'text', width: 'auto' },
        { key: 'dif_posicion_eje', label: 'Diferencia posición eje [º]', type: 'text', width: 'auto' },
      ],
      fixedRows: Array.from({ length: nEjes }, (_, i) => ({ eje: String(i + 1), dif_angulo_motor: '', dif_posicion_eje: '' })),
      allowAddRows: false, minRows: nEjes, maxRows: nEjes,
    });
  }
  return null;
}

/** Tabla de baterías (multi-fila, fiel al Word "Control de pilas y baterías"). */
function bateriasTable(key: string, label: string, rows: BateriaRow[]): Block {
  return block('table', {
    key, label,
    columns: [
      { key: 'bateria', label: 'Pila/Batería', type: 'text', width: 'auto' },
      { key: 'referencia', label: 'Referencia', type: 'text', width: 'auto' },
      { key: 'reemplazado', label: 'Reemplazado', type: 'checkbox', width: '100px' },
      { key: 'fecha', label: 'Fecha de reemplazo', type: 'text', width: '130px' },
    ],
    fixedRows: rows.map(b => ({ bateria: b.nombre, referencia: b.referencia || '-', reemplazado: false, fecha: '' })),
    allowAddRows: true, minRows: rows.length, maxRows: rows.length + 5,
  });
}

function reducerOilsBlock(key: string, label: string, reductoras: ReductoraRow[]): Block {
  return block('reducer_oils', {
    key, label, title: label,
    titleBg: '#1f2937', titleColor: '#ffffff', headerBg: '#f3f4f6', headerColor: '#1f2937', required: false,
    fixedRows: reductoras.map(r => ({
      eje: r.eje, tipoSuministro: r.tipoSuministro, aceiteId: r.aceiteId,
      unidad: r.unidad, volumen: r.volumen, niveles: r.niveles, lifetime: r.lifetime,
    })),
  });
}

function ejesFrenosTable(nEjes: number): Block {
  return block('table', {
    key: 'ejes_frenos', label: 'Funcionamiento de ejes y frenos',
    columns: [
      { key: 'eje', label: 'Eje', type: 'text', width: '60px' },
      { key: 'func_eje', label: 'Funcionamiento eje', type: 'checkbox', width: '120px' },
      { key: 'func_freno', label: 'Funcionamiento freno', type: 'checkbox', width: '120px' },
      { key: 'observaciones', label: 'Observaciones', type: 'text', width: 'auto' },
    ],
    fixedRows: Array.from({ length: nEjes }, (_, i) => ({ eje: String(i + 1), func_eje: false, func_freno: false, observaciones: '' })),
    allowAddRows: false, minRows: nEjes, maxRows: nEjes,
  });
}

// ===== Builders puros =====

export interface MechanicalInput {
  nEjes: number;
  reductoras: ReductoraRow[];
  bateriasSMB: BateriaRow[];
  overhaulHoras: number | null;
  profile: MechanicalProfile;
}

export function buildMechanicalSchema(input: MechanicalInput): TemplateSchema {
  const { nEjes, reductoras, bateriasSMB, overhaulHoras, profile } = input;
  const b: Block[] = [];

  // === manipulator_info ===
  b.push(componentSection('manipulator_info'));
  b.push(sectionH1('Información general'));
  b.push(block('text_field', { key: 'linea_cliente', label: 'Línea cliente', required: false, width: 'third', helpText: '', placeholder: '' }));
  b.push(block('text_field', { key: 'denominacion_cliente', label: 'Denominación cliente', required: false, width: 'third', helpText: '', placeholder: '' }));
  b.push(block('number_field', { key: 'contador_horas', label: 'Contador de horas', required: false, width: 'third', helpText: '', unit: 'h', min: 0, max: null }));
  b.push(block('divider', { style: 'solid', spacing: 'small', color: '#e5e7eb' }));
  b.push(block('text_field', { key: 'manipulador_numero_serie', label: 'Número de serie', required: true, width: 'third', helpText: 'Del sistema: {{componente.numero_serie}}', placeholder: '' }));
  b.push(block('text_field', { key: 'manipulador_tipo', label: 'Tipo de manipulador', required: true, width: 'third', helpText: 'Del sistema: {{componente.modelo}}', placeholder: '' }));
  b.push(block('date_field', { key: 'manipulador_fecha_fabricacion', label: 'Fecha de fabricación', required: false, width: 'third', helpText: '' }));

  // === manipulator_installation ===
  b.push(componentSection('manipulator_installation'));
  b.push(sectionH1('Información de la instalación del manipulador'));
  b.push(block('select_field', {
    key: 'presencia_cubierta', label: 'Presencia de cubierta y estado', required: false, width: 'third', helpText: '',
    options: [
      { value: 'si_bien', label: 'Sí - Bien' }, { value: 'si_mal', label: 'Sí - Mal' },
      { value: 'no', label: 'No' }, { value: 'na', label: 'N/A' },
    ],
  }));
  b.push(block('select_field', {
    key: 'tipo_montaje', label: 'Tipo de montaje', required: false, width: 'third', helpText: '',
    options: [
      { value: 'normal', label: 'Normal' }, { value: 'pared', label: 'Pared' }, { value: 'invertido', label: 'Invertido' },
    ],
  }));
  b.push(block('number_field', { key: 'altura_base', label: 'Altura de la base', required: false, width: 'third', helpText: '', unit: 'mm', min: 0, max: null }));

  // === mechanical_unit_control ===
  b.push(componentSection('mechanical_unit_control'));
  b.push(sectionH1('Control de la unidad mecánica'));
  if (reductoras.length > 0) b.push(reducerOilsBlock('reductoras', 'Reductoras del manipulador', reductoras));
  for (let e = 1; e <= nEjes; e++) {
    b.push(sectionH2(`Eje ${e}`));
    const checks = [...(profile.ejeExtras[e] || []), ...profile.ejeBase];
    for (const chk of checks) b.push(tri(`eje${e}_${slug(chk)}`, chk));
  }
  if (profile.generalChecks.length > 0) {
    b.push(sectionH2('Inspecciones generales del manipulador'));
    for (const it of profile.generalChecks) b.push(tri(slug(it), it));
  }
  b.push(sectionH2('Funcionamiento de ejes y frenos'));
  b.push(ejesFrenosTable(nEjes));
  if (profile.bateriaMedida === 'smb' && bateriasSMB.length > 0) {
    b.push(sectionH2('Baterías de medida (SMB)'));
    b.push(bateriasTable('baterias_smb', 'Control de baterías SMB', bateriasSMB));
  }
  const cal = calibracionBlock(profile.calibracion, nEjes);
  if (cal) { b.push(sectionH2('Valores de conmutación y calibración')); b.push(cal); }
  if (overhaulHoras) b.push(tri('overhaul', `Overhaul completo (cada ${overhaulHoras} h)`, 'level3'));

  return { blocks: b, pageConfig: PAGE };
}

export interface ControllerInput {
  bateriasControlador: BateriaRow[];
  profile: ControllerProfile;
}

export function buildControllerSchema(input: ControllerInput): TemplateSchema {
  const { bateriasControlador, profile } = input;
  const b: Block[] = [];

  // === controller_info ===
  b.push(componentSection('controller_info'));
  b.push(sectionH1('Información de la controladora'));
  b.push(block('text_field', { key: 'controladora_numero_serie', label: 'Número de serie', required: true, width: 'third', helpText: 'Del sistema: {{componente.numero_serie}}', placeholder: '' }));
  b.push(block('text_field', { key: 'controladora_tipo', label: 'Tipo de controlador', required: true, width: 'third', helpText: 'Del sistema: {{componente.modelo}}', placeholder: '' }));
  b.push(block('date_field', { key: 'controladora_fecha_fabricacion', label: 'Fecha de fabricación', required: false, width: 'third', helpText: '' }));

  // === cabinet_control ===
  b.push(componentSection('cabinet_control'));
  b.push(sectionH1('Control del armario'));
  if (profile.armarioExterior.length > 0) {
    b.push(sectionH2('Control general exterior'));
    for (const c of profile.armarioExterior) b.push(tri(`armario_ext_${slug(c)}`, c));
  }
  b.push(sectionH2('Control general interior'));
  for (const c of profile.armarioInterior) b.push(tri(`armario_int_${slug(c)}`, c));
  b.push(sectionH2('Control cableado a robot'));
  for (const c of profile.cableado) b.push(tri(`cableado_${slug(c)}`, c));
  if (bateriasControlador.length > 0) {
    b.push(sectionH2('Control de pilas y baterías'));
    b.push(bateriasTable('baterias_controlador', 'Control de pilas y baterías', bateriasControlador));
  }

  // === programming_unit_control ===
  b.push(componentSection('programming_unit_control'));
  b.push(sectionH1('Control de la unidad de programación'));
  for (const c of profile.teachPendant) b.push(tri(`tp_${slug(c)}`, c));

  // === system_control (incluye intercambio + observaciones + aceptación) ===
  b.push(componentSection('system_control'));
  b.push(sectionH1('Control del sistema'));
  for (const c of profile.sistemaCampos) b.push(tri(`sistema_${slug(c)}`, c, 'general'));
  if (profile.sistemaConRam) {
    b.push(block('text_field', { key: 'sistema_ram_disponible', label: 'Disponibilidad de la RAM', required: false, width: 'half', helpText: '', placeholder: '' }));
    b.push(block('text_field', { key: 'sistema_ram_ocupacion', label: 'Ocupación de la RAM', required: false, width: 'half', helpText: '', placeholder: '' }));
    b.push(tri('sistema_clonado_disco', 'Clonado de disco duro', 'general'));
  }
  b.push(sectionH1('Intercambio de equipos'));
  b.push(block('equipment_exchange', { key: 'intercambio_equipos', label: 'Intercambio de equipos', title: '', titleBg: '#1f2937', titleColor: '#ffffff', defaultRows: 5, headerBg: '#f3f4f6', headerColor: '#92400e', required: false }));
  b.push(sectionH1('Observaciones generales'));
  b.push(block('text_area', { key: 'observaciones_generales', label: 'Observaciones', required: false, width: 'full', helpText: '', rows: 6, placeholder: '' }));
  b.push(sectionH1('Estado y aceptación'));
  b.push(block('select_field', {
    key: 'estado_sistema', label: 'Sistema probado', required: true, width: 'full', helpText: '',
    options: [
      { value: 'manual', label: 'Modo manual' }, { value: 'automatico', label: 'Modo automático' },
      { value: 'produccion', label: 'En producción' }, { value: 'imposible', label: 'Pruebas imposibles' },
    ],
  }));
  b.push(block('signature', { key: 'firma_tecnico', label: 'Fecha y firma técnico de mantenimiento', role: 'Técnico de mantenimiento', required: true, width: 'half' }));
  b.push(block('signature', { key: 'firma_cliente', label: 'Fecha y firma de aprobación del cliente', role: 'Responsable cliente', required: true, width: 'half' }));

  return { blocks: b, pageConfig: PAGE };
}

export interface ExternalAxisInput {
  nEjes: number;
  reductoras: ReductoraRow[];
  bateriasSMB: BateriaRow[];
  profile: ExternalAxisProfile;
}

export function buildExternalAxisSchema(input: ExternalAxisInput): TemplateSchema {
  const { nEjes, reductoras, bateriasSMB, profile } = input;
  const b: Block[] = [];

  // === manipulator_info (el eje externo se lista junto a las unidades) ===
  b.push(componentSection('manipulator_info'));
  b.push(sectionH1('Información del eje externo'));
  b.push(block('text_field', { key: 'eje_numero_serie', label: 'Número de serie', required: true, width: 'third', helpText: 'Del sistema: {{componente.numero_serie}}', placeholder: '' }));
  b.push(block('text_field', { key: 'eje_tipo', label: 'Tipo', required: true, width: 'third', helpText: 'Del sistema: {{componente.modelo}}', placeholder: '' }));
  b.push(block('date_field', { key: 'eje_fecha_fabricacion', label: 'Fecha de fabricación', required: false, width: 'third', helpText: '' }));

  // === mechanical_unit_control ===
  b.push(componentSection('mechanical_unit_control'));
  b.push(sectionH1('Control del eje externo'));
  if (reductoras.length > 0) b.push(reducerOilsBlock('reductoras_eje', 'Lubricación del eje externo', reductoras));
  for (let e = 1; e <= nEjes; e++) {
    b.push(sectionH2(`Eje externo ${e}`));
    for (const chk of profile.ejeChecks) b.push(tri(`ejeext${e}_${slug(chk)}`, chk));
  }
  for (const it of profile.generalChecks) b.push(tri(slug(it), it));
  if (profile.bateriaMedida === 'smb' && bateriasSMB.length > 0) {
    b.push(sectionH2('Batería de medida (SMB) del eje externo'));
    b.push(bateriasTable('baterias_smb_eje', 'Control de baterías SMB del eje', bateriasSMB));
  }
  const cal = calibracionBlock(profile.calibracion, nEjes);
  if (cal) { b.push(sectionH2('Calibración del eje externo')); b.push(cal); }

  return { blocks: b, pageConfig: PAGE };
}

// ===== Wrapper Prisma =====

function marcaDe(fabricante: string | undefined): Marca {
  return (fabricante || '').toUpperCase().includes('KUKA') ? 'KUKA' : 'ABB';
}

async function batteriesBySubtipo(prisma: any, subtipos: string[]): Promise<BateriaRow[]> {
  const rows = await prisma.consumibleCatalogo.findMany({
    where: { tipo: 'bateria', subtipo: { in: subtipos }, activo: true },
    select: { id: true, nombre: true, codigoFabricante: true },
    orderBy: { codigoInterno: 'asc' },
  });
  return rows.map((r: any) => ({ nombre: r.nombre, referencia: r.codigoFabricante ?? '', consumibleId: r.id }));
}

async function batteriesByCodigo(prisma: any, refs: { nombre: string; codigoInterno?: string }[]): Promise<BateriaRow[]> {
  const codigos = refs.map(r => r.codigoInterno).filter(Boolean) as string[];
  if (codigos.length === 0) return refs.map(r => ({ nombre: r.nombre, referencia: '', consumibleId: null }));
  const rows = await prisma.consumibleCatalogo.findMany({
    where: { codigoInterno: { in: codigos } },
    select: { id: true, nombre: true, codigoFabricante: true, codigoInterno: true },
  });
  const byCod = new Map(rows.map((r: any) => [r.codigoInterno, r]));
  return refs.map(r => {
    const hit: any = r.codigoInterno ? byCod.get(r.codigoInterno) : null;
    return { nombre: r.nombre, referencia: hit?.codigoFabricante ?? '', consumibleId: hit?.id ?? null };
  });
}

/** Carga las reductoras del modelo desde `lubricacion` (incluye lifetime). */
async function loadReductoras(prisma: any, modeloId: number): Promise<ReductoraRow[]> {
  const rows = await prisma.lubricacion.findMany({
    where: { modeloComponenteId: modeloId },
    include: { consumible: { select: { id: true, nombre: true } }, nivel: { select: { codigo: true } } },
    orderBy: { eje: 'asc' },
  });
  return rows.map((r: any) => {
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

/** Genera la TemplateSchema de un modelo (no persiste). */
export async function generateTemplateForModel(prisma: any, modeloId: number): Promise<TemplateSchema> {
  const model = await prisma.modeloComponente.findUnique({
    where: { id: modeloId },
    include: { fabricante: { select: { nombre: true } }, familiaRel: { select: { tipoCinematica: true } }, generacion: { select: { codigo: true } } },
  });
  if (!model) throw new Error(`Modelo ${modeloId} no encontrado`);

  const marca = marcaDe(model.fabricante?.nombre);
  const generacion: string | null = model.generacion?.codigo ?? null;
  const cinematica: string | null = model.familiaRel?.tipoCinematica ?? null;

  if (model.tipo === 'mechanical_unit') {
    const reductoras = await loadReductoras(prisma, modeloId);
    const nEjes = ejesDeCinematica(cinematica);
    const profile = getMechanicalProfile(marca, generacion, cinematica);
    const bateriasSMB = profile.bateriaMedida === 'smb'
      ? await batteriesBySubtipo(prisma, ['smb_2pole', 'smb_3pole'])
      : [];
    return buildMechanicalSchema({ nEjes, reductoras, bateriasSMB, overhaulHoras: 40000, profile });
  }

  if (model.tipo === 'controller') {
    const profile = getControllerProfile(marca, generacion);
    const bateriasControlador = await batteriesByCodigo(prisma, profile.bateriasControlador);
    return buildControllerSchema({ bateriasControlador, profile });
  }

  if (model.tipo === 'external_axis') {
    const reductoras = await loadReductoras(prisma, modeloId);
    const nEjes = reductoras.length || 1;
    const profile = getExternalAxisProfile(marca);
    const bateriasSMB = profile.bateriaMedida === 'smb'
      ? await batteriesBySubtipo(prisma, ['smb_2pole', 'smb_3pole'])
      : [];
    return buildExternalAxisSchema({ nEjes, reductoras, bateriasSMB, profile });
  }

  // drive_unit u otros: plantilla mínima de identidad bajo controller_info.
  return {
    blocks: [
      componentSection('controller_info'),
      sectionH1('Información del componente'),
      block('text_field', { key: 'numero_serie', label: 'Número de serie', required: true, width: 'third', helpText: 'Del sistema: {{componente.numero_serie}}', placeholder: '' }),
      block('text_field', { key: 'tipo', label: 'Tipo', required: true, width: 'third', helpText: 'Del sistema: {{componente.modelo}}', placeholder: '' }),
      block('date_field', { key: 'fecha_fabricacion', label: 'Fecha de fabricación', required: false, width: 'third', helpText: '' }),
    ],
    pageConfig: PAGE,
  };
}
