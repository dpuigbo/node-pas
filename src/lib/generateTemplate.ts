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

import { randomUUID } from 'node:crypto';
import {
  getMechanicalProfile,
  getModelEjeExtras,
  getControllerProfile,
  getExternalAxisProfile,
  type Marca,
  type CalibracionTipo,
  type MechanicalProfile,
  type ControllerProfile,
  type ExternalAxisProfile,
} from './reportProfiles';
import { actividadAplicaAModelo } from './planMantenimiento';

// ===== Tipos =====

interface Block { id: string; type: string; config: Record<string, unknown>; }
interface PageConfig { orientation: string; margins: { top: number; right: number; bottom: number; left: number }; fontSize: number; }
export interface TemplateSchema { blocks: Block[]; pageConfig: PageConfig; }

export interface ReductoraRow {
  eje: string;
  tipoSuministro: string;
  aceiteId: number | null;
  unidad: string;
  volumen: string;
  niveles: string[];
  lifetime: boolean;
}

export interface BateriaRow {
  nombre: string;
  referencia: string;
  consumibleId: number | null;
}

// ===== Helpers =====

const uuid = () => randomUUID();
const block = (type: string, config: Record<string, unknown>): Block => ({ id: uuid(), type, config });
const PAGE: PageConfig = { orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 }, fontSize: 10 };

// Estilo de tabla EXACTO de "Informacion general" (personalizado por el cliente en el
// template global): barra de titulo gris #878787, cabecera gris clara #c9c9c9, texto negro.
const TBL = { titleBg: '#878787', titleColor: '#000000', headerBg: '#c9c9c9', headerColor: '#000000', headerPosition: 'top' };

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const componentSection = (contentType: string) => block('component_section', { contentType });
/** Separador de espacio grande y centrado entre elementos. */
const spaceSeparator = () => block('divider', { style: 'space', spacing: 'large', align: 'center' });

/** Separación entre secciones. El TÍTULO de cada sección va DENTRO de la tabla
 *  (barra de título), NO en un bloque section_title aparte (el cliente lo pidió así
 *  para no duplicar el título que ya muestra la tabla). */
function pushH1(b: Block[], _title?: string, _description?: string): void {
  void _title; void _description;
  b.push(spaceSeparator());
}

function ejesDeCinematica(cinematica: string | null): number {
  if (!cinematica) return 6;
  if (cinematica.includes('gantry')) return 4; // portico X/Y/Z (+C opcional), p.ej. IRB 840A
  if (cinematica.includes('5axis')) return 5;
  if (cinematica.includes('4axis')) return 4;
  return 6;
}

/** Tabla de identidad: titulo en barra + cabecera de etiquetas + una fila de valores. */
function infoTable(key: string, title: string, cols: { key: string; label: string; value: string }[]): Block {
  return block('table', {
    key, label: '', title, ...TBL,
    columns: cols.map((c) => ({ key: c.key, label: c.label, type: 'text', width: 'auto' })),
    fixedRows: [Object.fromEntries(cols.map((c) => [c.key, c.value]))],
    allowAddRows: false, minRows: 1, maxRows: 1,
  });
}

/** Tabla de una sola fila con celdas editables (select/number/text), titulo en barra.
 *  Para datos de instalacion/sistema, al estilo de la tabla "Informacion general". */
function fieldsTable(
  key: string,
  title: string,
  fields: { key: string; label: string; type: string; options?: string[]; width?: string }[],
): Block {
  return block('table', {
    key, label: '', title, ...TBL,
    columns: fields.map((f) => ({
      key: f.key, label: f.label, type: f.type, width: f.width || 'auto',
      ...(f.options ? { options: f.options } : {}),
    })),
    fixedRows: [Object.fromEntries(fields.map((f) => [f.key, f.type === 'checkbox' ? false : '']))],
    allowAddRows: false, minRows: 1, maxRows: 1,
  });
}

/** Tabla de inspeccion: titulo en barra + (Operacion | N/A | Bien | Mal | Observaciones). */
function inspectionTable(key: string, title: string, checks: string[]): Block {
  return block('table', {
    key, label: '', title, ...TBL,
    columns: [
      { key: 'operacion', label: 'Operación', type: 'label', width: '38%' },
      { key: 'na', label: 'N/A', type: 'checkbox', width: '8%' },
      { key: 'bien', label: 'Bien', type: 'checkbox', width: '8%' },
      { key: 'mal', label: 'Mal', type: 'checkbox', width: '8%' },
      { key: 'observaciones', label: 'Observaciones', type: 'text', width: '38%' },
    ],
    fixedRows: checks.map((chk) => ({ operacion: chk, na: false, bien: false, mal: false, observaciones: '' })),
    allowAddRows: true, minRows: checks.length, maxRows: checks.length + 10,
  });
}

function calibracionBlock(tipo: CalibracionTipo, nEjes: number, title: string): Block | null {
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

function bateriasTable(key: string, title: string, rows: BateriaRow[]): Block {
  return block('table', {
    key, label: '', title, ...TBL,
    columns: [
      { key: 'bateria', label: 'Pila/Batería', type: 'label', width: 'auto' },
      { key: 'referencia', label: 'Referencia', type: 'label', width: 'auto' },
      { key: 'reemplazado', label: 'Reemplazado', type: 'checkbox', width: '100px' },
      { key: 'fecha', label: 'Fecha de reemplazo', type: 'text', width: '130px' },
    ],
    fixedRows: rows.length === 1
      ? rows.map((b) => ({ bateria: b.nombre, referencia: b.referencia || '', reemplazado: false, fecha: '', consumibleId: b.consumibleId }))
      : [{ bateria: '', referencia: '', reemplazado: false, fecha: '', consumibleId: null }],
    // Opciones para el desplegable (las que nombra el manual del modelo): 1 -> por defecto; varias -> elige.
    opcionesBateria: rows.map((b) => ({ consumibleId: b.consumibleId, nombre: b.nombre, referencia: b.referencia })),
    allowAddRows: true, minRows: 0, maxRows: (rows.length || 1) + 5,
  });
}

function reducerOilsBlock(key: string, title: string, reductoras: ReductoraRow[]): Block {
  return block('reducer_oils', {
    key, label: '', title,
    titleBg: TBL.titleBg, titleColor: TBL.titleColor, headerBg: TBL.headerBg, headerColor: TBL.headerColor, required: false,
    fixedRows: reductoras.map((r) => ({
      eje: r.eje, tipoSuministro: r.tipoSuministro, aceiteId: r.aceiteId,
      unidad: r.unidad, volumen: r.volumen, niveles: r.niveles, lifetime: r.lifetime,
    })),
  });
}

function ejesFrenosTable(nEjes: number, title: string): Block {
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

  // === manipulator_info (identidad en tabla) ===
  b.push(componentSection('manipulator_info'));
  pushH1(b, 'Información del manipulador', 'Identificación del manipulador');
  b.push(infoTable('manipulador_identidad', 'Información del manipulador', [
    { key: 'numero_serie', label: 'Número de serie', value: '{{componente.numero_serie}}' },
    { key: 'tipo', label: 'Tipo de manipulador', value: '{{componente.modelo}}' },
    { key: 'fecha_fabricacion', label: 'Fecha de fabricación', value: '' },
  ]));

  // === manipulator_installation (seccion propia: el template global tiene su placeholder) ===
  b.push(componentSection('manipulator_installation'));
  pushH1(b, 'Instalación del manipulador', 'Datos de instalación');
  b.push(fieldsTable('manipulador_instalacion', 'Instalación del manipulador', [
    { key: 'presencia_cubierta', label: 'Presencia de cubierta y estado', type: 'select', options: ['Sí - Bien', 'Sí - Mal', 'No', 'N/A'] },
    { key: 'tipo_montaje', label: 'Tipo de montaje', type: 'select', options: ['Normal', 'Pared', 'Invertido'] },
    { key: 'altura_base', label: 'Altura de la base (mm)', type: 'number' },
  ]));

  // === mechanical_unit_control ===
  b.push(componentSection('mechanical_unit_control'));
  pushH1(b, 'Control de la unidad mecánica', 'Reductoras, control por eje, frenos y calibración');
  if (reductoras.length > 0) b.push(reducerOilsBlock('reductoras', 'Reductoras del manipulador', reductoras));
  for (let e = 1; e <= nEjes; e++) {
    b.push(spaceSeparator());
    const checks = [...(profile.ejeExtras[e] || []), ...profile.ejeBase];
    b.push(inspectionTable(`eje${e}_control`, `Control eje ${e}`, checks));
  }
  const generales = [...profile.generalChecks];
  if (overhaulHoras) generales.push(`Overhaul completo (cada ${overhaulHoras} h)`);
  if (generales.length > 0) {
    b.push(spaceSeparator());
    b.push(inspectionTable('inspecciones_generales', 'Inspecciones generales del manipulador', generales));
  }
  b.push(spaceSeparator());
  b.push(ejesFrenosTable(nEjes, 'Funcionamiento de ejes y frenos'));
  // La calibracion va DENTRO de la mecanica (como en los informes Word: cada robot
  // completo termina con su tabla de conmutacion/calibracion), no en seccion aparte.
  const cal = calibracionBlock(profile.calibracion, nEjes, 'Valores de conmutación y calibración');
  if (cal) {
    b.push(spaceSeparator());
    b.push(cal);
  }

  // === manipulator_battery (SMB) ===
  if (profile.bateriaMedida === 'smb' && bateriasSMB.length > 0) {
    b.push(componentSection('manipulator_battery'));
    pushH1(b, 'Baterías de medida (SMB)', 'Control de las baterías SMB del manipulador');
    b.push(bateriasTable('baterias_smb', 'Control de baterías SMB', bateriasSMB));
  }

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
  pushH1(b);
  // "Versión del sistema" (y la RAM en KUKA) van como FILAS DE VALOR (texto libre, _valor:true,
  // SIN Bien/Mal/N/A) DENTRO de la tabla "Control general del sistema". El resto son checks.
  const valorLabels: string[] = ['Versión del sistema'];
  if (profile.sistemaConRam) valorLabels.push('Disponibilidad de la RAM', 'Ocupación de la RAM');
  const checkLabels: string[] = [];
  if (profile.sistemaConRam) checkLabels.push('Clonado de disco duro');
  for (const c of profile.sistemaCampos.filter((c) => !/versi/i.test(c))) checkLabels.push(c);
  b.push(block('table', {
    key: 'sistema_checks', label: '', title: 'Control general del sistema', ...TBL,
    columns: [
      { key: 'operacion', label: 'Operación', type: 'label', width: '38%' },
      { key: 'na', label: 'N/A', type: 'checkbox', width: '8%' },
      { key: 'bien', label: 'Bien', type: 'checkbox', width: '8%' },
      { key: 'mal', label: 'Mal', type: 'checkbox', width: '8%' },
      { key: 'observaciones', label: 'Observaciones', type: 'text', width: '38%' },
    ],
    fixedRows: [
      ...valorLabels.map((l) => ({ operacion: l, _valor: true, na: false, bien: false, mal: false, observaciones: '' })),
      ...checkLabels.map((l) => ({ operacion: l, na: false, bien: false, mal: false, observaciones: '' })),
    ],
    allowAddRows: true, minRows: valorLabels.length + checkLabels.length, maxRows: valorLabels.length + checkLabels.length + 10,
  }));

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
  if (reductoras.length > 0) b.push(reducerOilsBlock('reductoras_eje', 'Lubricación del eje externo', reductoras));
  for (let e = 1; e <= nEjes; e++) {
    b.push(spaceSeparator());
    b.push(inspectionTable(`ejeext${e}_control`, `Control eje externo ${e}`, profile.ejeChecks));
  }
  if (profile.generalChecks.length > 0) {
    b.push(spaceSeparator());
    b.push(inspectionTable('eje_inspecciones_generales', 'Inspecciones generales del eje externo', profile.generalChecks));
  }
  // Calibracion DENTRO de la seccion mecanica del eje (mismo criterio que el manipulador).
  const cal = calibracionBlock(profile.calibracion, nEjes, 'Calibración del eje externo');
  if (cal) {
    b.push(spaceSeparator());
    b.push(cal);
  }

  // === manipulator_battery (SMB del eje externo) ===
  if (profile.bateriaMedida === 'smb' && bateriasSMB.length > 0) {
    b.push(componentSection('manipulator_battery'));
    pushH1(b, 'Batería de medida (SMB) del eje externo', 'Control de la batería SMB del eje');
    b.push(bateriasTable('baterias_smb_eje', 'Control de baterías SMB del eje', bateriasSMB));
  }

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

// Baterias que el manual del modelo nombra (via actividad preventiva -> consumible bateria).
async function batteriesForModel(prisma: any, modeloId: number): Promise<BateriaRow[]> {
  const acts = await prisma.actividadPreventiva.findMany({
    where: { consumibles: { some: { consumible: { tipo: 'bateria' } } } },
    select: {
      modelosAplicables: true,
      consumibles: {
        where: { consumible: { tipo: 'bateria' } },
        select: { consumible: { select: { id: true, nombre: true, codigoFabricante: true } } },
      },
    },
  });
  const seen = new Map<number, BateriaRow>();
  for (const a of acts) {
    if (!actividadAplicaAModelo(a, modeloId)) continue;
    for (const ac of a.consumibles) {
      const c = ac.consumible;
      if (c && !seen.has(c.id)) seen.set(c.id, { nombre: c.nombre, referencia: c.codigoFabricante ?? '', consumibleId: c.id });
    }
  }
  return [...seen.values()];
}

// SMB del manipulador: por modelo si el manual lo nombra; si no, todas las SMB+EIB del catalogo.
async function smbForModel(prisma: any, modeloId: number, bateriaMedida: string | null | undefined): Promise<BateriaRow[]> {
  if (bateriaMedida !== 'smb') return [];
  const perModel = await batteriesForModel(prisma, modeloId);
  if (perModel.length > 0) return perModel;
  return batteriesBySubtipo(prisma, ['smb_2pole', 'smb_3pole', 'smb_litio', 'smb_nicd', 'eib']);
}

async function batteriesByCodigo(prisma: any, refs: { nombre: string; codigoInterno?: string }[]): Promise<BateriaRow[]> {
  const codigos = refs.map((r) => r.codigoInterno).filter(Boolean) as string[];
  if (codigos.length === 0) return refs.map((r) => ({ nombre: r.nombre, referencia: '', consumibleId: null }));
  const rows = await prisma.consumibleCatalogo.findMany({
    where: { codigoInterno: { in: codigos } },
    select: { id: true, nombre: true, codigoFabricante: true, codigoInterno: true },
  });
  const byCod = new Map(rows.map((r: any) => [r.codigoInterno, r]));
  return refs.map((r) => {
    const hit: any = r.codigoInterno ? byCod.get(r.codigoInterno) : null;
    return { nombre: r.nombre, referencia: hit?.codigoFabricante ?? '', consumibleId: hit?.id ?? null };
  });
}

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

/** Horas de overhaul SOLO si el plan del modelo lo trae (regla: sin overhaul si el PM no lo trae). */
async function overhaulForModel(prisma: any, modeloId: number): Promise<number | null> {
  const acts = await prisma.actividadPreventiva.findMany({
    where: { tipoActividad: { codigo: 'overhaul' } },
    select: { modelosAplicables: true, intervaloHoras: true },
  });
  for (const a of acts) {
    if (actividadAplicaAModelo(a, modeloId) && a.intervaloHoras) return Number(a.intervaloHoras);
  }
  return null;
}

/** Fusiona los checks extra por eje del perfil con los específicos del modelo (se concatenan). */
function mergeEjeExtras(base: Record<number, string[]>, extra: Record<number, string[]>): Record<number, string[]> {
  const out: Record<number, string[]> = { ...base };
  for (const [k, checks] of Object.entries(extra)) {
    const n = Number(k);
    out[n] = [...(out[n] ?? []), ...checks];
  }
  return out;
}

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
    const baseProfile = getMechanicalProfile(marca, generacion, cinematica);
    const modelExtras = getModelEjeExtras(model.nombre);
    const profile = Object.keys(modelExtras).length
      ? { ...baseProfile, ejeExtras: mergeEjeExtras(baseProfile.ejeExtras, modelExtras) }
      : baseProfile;
    const bateriasSMB = await smbForModel(prisma, modeloId, profile.bateriaMedida);
    const overhaulHoras = await overhaulForModel(prisma, modeloId);
    return buildMechanicalSchema({ nEjes, reductoras, bateriasSMB, overhaulHoras, profile });
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
    const bateriasSMB = await smbForModel(prisma, modeloId, profile.bateriaMedida);
    return buildExternalAxisSchema({ nEjes, reductoras, bateriasSMB, profile });
  }

  return {
    blocks: [
      componentSection('controller_info'),
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
