import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  FileText,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  CircleCheck,
  CircleDashed,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useAssembledReport } from '@/hooks/useInformes';
import { getBlockEntry } from '@/components/blocks/registry';
import type { BlockType } from '@/types/editor';
import type { AssembledBlock } from '@/types/informe';

import '@/components/blocks/register-all';

// ======================== Constantes ========================

const ESTADO_BADGE: Record<string, string> = {
  inactivo: 'bg-gray-100 text-gray-700', activo: 'bg-blue-100 text-blue-700', finalizado: 'bg-green-100 text-green-700',
};
const ESTADO_LABEL: Record<string, string> = { inactivo: 'Inactivo', activo: 'Activo', finalizado: 'Finalizado' };

/** Bloques editables (puntos de control) que el técnico rellena. */
const EDITABLE_TYPES = new Set<string>([
  'table', 'tristate', 'checklist', 'reducer_oils',
  'battery_manipulator', 'battery_controller', 'equipment_exchange',
  'text_field', 'number_field', 'date_field', 'select_field', 'signature',
]);

// ======================== Tipos / helpers ========================

type Row = Record<string, unknown>;

interface WizardSection {
  key: string;
  label: string;
  componenteInformeId?: number;
  blocks: AssembledBlock[];
}

/** Tabla de inspección = tiene columnas N/A, Bien, Mal y una columna etiqueta. */
function isInspectionTable(b: AssembledBlock): boolean {
  if (b.type !== 'table') return false;
  const cols = (b.config.columns as { key: string; type: string }[]) || [];
  const keys = new Set(cols.map((c) => c.key));
  return keys.has('na') && keys.has('bien') && keys.has('mal') && cols.some((c) => c.type === 'label');
}

function labelKey(b: AssembledBlock): string {
  const cols = (b.config.columns as { key: string; type: string }[]) || [];
  return cols.find((c) => c.type === 'label')?.key ?? 'operacion';
}

function rowDone(row: Row): boolean {
  return row?.na === true || row?.bien === true || row?.mal === true;
}

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) {
    return value.some((row) => {
      if (!row || typeof row !== 'object') return false;
      return Object.entries(row as Row).some(([k, v]) => {
        if (['eje', 'operacion', 'bateria', 'referencia', 'tipoSuministro', 'unidad', 'volumen', 'niveles'].includes(k)) return false;
        if (v === true) return true;
        if (typeof v === 'string') return v.trim() !== '';
        return false;
      });
    });
  }
  if (typeof value === 'object') return Object.values(value as Row).some((v) => isFilled(v));
  return Boolean(value);
}

/** Cuenta "puntos de control": cada fila de inspección es 1 punto; los demás bloques, 1. */
function countPoints(s: WizardSection, getValue: (b: AssembledBlock) => unknown): { done: number; total: number } {
  let done = 0, total = 0;
  for (const b of s.blocks) {
    if (isInspectionTable(b)) {
      const rows = (getValue(b) as Row[]) || [];
      for (const r of rows) { total++; if (rowDone(r)) done++; }
    } else {
      total++; if (isFilled(getValue(b))) done++;
    }
  }
  return { done, total };
}

// ======================== Página ========================

export default function InformeWizardPage() {
  const { id } = useParams<{ id: string }>();
  const informeId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAssembledReport(informeId || undefined);

  const [localCompDatos, setLocalCompDatos] = useState<Record<number, Record<string, unknown>>>({});
  const [localDocDatos, setLocalDocDatos] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'overview' | string>('overview');

  const readOnly = data?.informe?.estado === 'finalizado' || data?.informe?.estado === 'inactivo';

  // Secciones: una por componente. La Intervención (datos de documento) se
  // rellena automáticamente, así que NO es una sección a rellenar por el técnico.
  const sections = useMemo<WizardSection[]>(() => {
    const blocks = data?.assembled?.blocks ?? [];
    const order: number[] = [];
    const map = new Map<number, WizardSection>();
    for (const b of blocks) {
      if (!b._dataKey || !EDITABLE_TYPES.has(b.type)) continue;
      if (!b._componenteInformeId) continue;
      let g = map.get(b._componenteInformeId);
      if (!g) {
        g = { key: `c${b._componenteInformeId}`, label: b._componenteEtiqueta || `Componente ${b._componenteInformeId}`, componenteInformeId: b._componenteInformeId, blocks: [] };
        map.set(b._componenteInformeId, g);
        order.push(b._componenteInformeId);
      }
      g.blocks.push(b);
    }
    return order.map((cid) => map.get(cid)!);
  }, [data]);

  const blockValue = useCallback(
    (b: AssembledBlock): unknown => {
      if (!b._dataKey) return null;
      if (b._componenteInformeId) {
        const local = localCompDatos[b._componenteInformeId];
        return local && b._dataKey in local ? local[b._dataKey] : (b._dataValue ?? null);
      }
      return b._dataKey in localDocDatos ? localDocDatos[b._dataKey] : (b._dataValue ?? null);
    },
    [localCompDatos, localDocDatos],
  );

  const onBlockChange = useCallback(
    (b: AssembledBlock, v: unknown) => {
      if (readOnly || !b._dataKey) return;
      if (b._componenteInformeId) {
        const cid = b._componenteInformeId;
        setLocalCompDatos((prev) => ({ ...prev, [cid]: { ...(prev[cid] ?? {}), [b._dataKey!]: v } }));
      } else {
        setLocalDocDatos((prev) => ({ ...prev, [b._dataKey!]: v }));
      }
    },
    [readOnly],
  );

  const totals = useMemo(() => {
    let done = 0, total = 0;
    for (const s of sections) { const p = countPoints(s, blockValue); done += p.done; total += p.total; }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [sections, blockValue]);

  const hasDirty =
    Object.values(localCompDatos).some((d) => d && Object.keys(d).length > 0) ||
    Object.keys(localDocDatos).length > 0;

  const handleSave = useCallback(async () => {
    if (!hasDirty || isSaving) return;
    setIsSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const [cid, datos] of Object.entries(localCompDatos)) {
        if (datos && Object.keys(datos).length > 0) promises.push(api.patch(`/v1/componentes-informe/${cid}/datos`, { datos }));
      }
      if (Object.keys(localDocDatos).length > 0) promises.push(api.patch(`/v1/informes/${informeId}/datos-documento`, { datos: localDocDatos }));
      await Promise.all(promises);
      setLocalCompDatos({});
      setLocalDocDatos({});
      queryClient.invalidateQueries({ queryKey: ['informes', informeId, 'assembled'] });
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e?.response?.data?.error ?? 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }, [hasDirty, isSaving, localCompDatos, localDocDatos, informeId, queryClient]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-muted-foreground">No se pudo cargar el informe.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const { informe } = data;
  const activeIdx = sections.findIndex((s) => s.key === view);
  const activeSection = activeIdx >= 0 ? sections[activeIdx] : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* ===== Barra superior ===== */}
      <header className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => (activeSection ? setView('overview') : navigate(`/informes/${informeId}`))} title="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="font-semibold truncate text-sm">{informe.sistema?.nombre ?? 'Informe'}</div>
            <Badge className={`${ESTADO_BADGE[informe.estado] ?? ''} text-[10px]`}>{ESTADO_LABEL[informe.estado] ?? informe.estado}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/informes/${informeId}/preview`)}>
            <FileText className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Documento</span>
          </Button>
          {!readOnly && (
            <Button size="sm" onClick={handleSave} disabled={!hasDirty || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin sm:mr-1" /> : <Save className="h-4 w-4 sm:mr-1" />}
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          )}
        </div>
      </header>

      {/* ===== Cuerpo ===== */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {activeSection ? (
          <SectionView
            section={activeSection}
            sections={sections}
            activeIdx={activeIdx}
            readOnly={readOnly}
            blockValue={blockValue}
            onBlockChange={onBlockChange}
            onNavigate={(key) => setView(key)}
            countPoints={(s) => countPoints(s, blockValue)}
          />
        ) : (
          <OverviewView
            totals={totals}
            sections={sections}
            countPoints={(s) => countPoints(s, blockValue)}
            onOpen={(key) => setView(key)}
          />
        )}
      </main>
    </div>
  );
}

// ======================== Visión general ========================

function OverviewView({
  totals, sections, countPoints, onOpen,
}: {
  totals: { done: number; total: number; pct: number };
  sections: WizardSection[];
  countPoints: (s: WizardSection) => { done: number; total: number };
  onOpen: (key: string) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-5">
      {/* Progreso global */}
      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <ProgressRing pct={totals.pct} />
          <div className="min-w-0">
            <h1 className="text-lg font-bold">Mantenimiento</h1>
            <p className="text-sm text-muted-foreground">
              {totals.done} de {totals.total} puntos de control completados
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          La sección de <strong>Intervención</strong> (cliente, técnico, fechas y horas) se rellena automáticamente.
        </div>
      </div>

      {/* Tarjetas de componente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((s) => {
          const { done, total } = countPoints(s);
          const complete = total > 0 && done === total;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onOpen(s.key)}
              className="flex items-center gap-3 rounded-xl border bg-background p-4 text-left shadow-sm transition-colors hover:bg-muted/40 active:bg-muted"
            >
              {complete
                ? <CircleCheck className="h-7 w-7 text-green-500 shrink-0" />
                : <CircleDashed className="h-7 w-7 text-muted-foreground shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{s.label}</div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${complete ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{done}/{total} puntos</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>
          );
        })}
        {sections.length === 0 && (
          <div className="col-span-full rounded-xl border bg-background p-8 text-center text-muted-foreground">
            <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-40" />
            No hay puntos de control para rellenar en este informe.
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          className={pct === 100 ? 'text-green-500' : 'text-primary'}
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</span>
    </div>
  );
}

// ======================== Vista de sección ========================

function SectionView({
  section, sections, activeIdx, readOnly, blockValue, onBlockChange, onNavigate, countPoints,
}: {
  section: WizardSection;
  sections: WizardSection[];
  activeIdx: number;
  readOnly: boolean;
  blockValue: (b: AssembledBlock) => unknown;
  onBlockChange: (b: AssembledBlock, v: unknown) => void;
  onNavigate: (key: string) => void;
  countPoints: (s: WizardSection) => { done: number; total: number };
}) {
  const { done, total } = countPoints(section);
  const prev = activeIdx > 0 ? sections[activeIdx - 1] : null;
  const next = activeIdx < sections.length - 1 ? sections[activeIdx + 1] : null;

  return (
    <div className="mx-auto max-w-3xl p-3 sm:p-5">
      {/* Cabecera de sección con progreso */}
      <div className="sticky top-0 z-10 -mx-3 sm:-mx-5 mb-3 border-b bg-gray-50/95 px-3 sm:px-5 py-2 backdrop-blur">
        <button type="button" onClick={() => onNavigate('overview')} className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" /> Visión general
        </button>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold truncate">{section.label}</h2>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${done === total && total > 0 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
            {done}/{total}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {section.blocks.map((b) => (
          <ControlBlock key={b.id} block={b} readOnly={readOnly} value={blockValue(b)} onChange={(v) => onBlockChange(b, v)} />
        ))}
      </div>

      {/* Navegación entre secciones */}
      <div className="mt-6 flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={!prev} onClick={() => prev && onNavigate(prev.key)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        {next
          ? <Button size="sm" onClick={() => onNavigate(next.key)}>Siguiente <ChevronRight className="h-4 w-4 ml-1" /></Button>
          : <Button size="sm" variant="outline" onClick={() => onNavigate('overview')}>Terminar <Check className="h-4 w-4 ml-1" /></Button>}
      </div>
    </div>
  );
}

// ======================== Un bloque de control ========================

function ControlBlock({
  block, value, readOnly, onChange,
}: {
  block: AssembledBlock;
  value: unknown;
  readOnly: boolean;
  onChange: (v: unknown) => void;
}) {
  // Tablas de inspección → tarjetas táctiles (una por punto de control).
  if (isInspectionTable(block)) {
    const rows = (value as Row[]) || [];
    const opKey = labelKey(block);
    const title = (block.config.title as string) || '';
    const setRow = (i: number, next: Row) => {
      onChange(rows.map((r, idx) => (idx === i ? next : r)));
    };
    return (
      <section className="space-y-2">
        {title && <h3 className="px-1 text-sm font-semibold text-gray-700">{title}</h3>}
        {rows.map((row, i) => (
          <InspectionPointCard key={i} label={String(row[opKey] ?? '')} row={row} readOnly={readOnly} onChange={(n) => setRow(i, n)} />
        ))}
      </section>
    );
  }

  // Otros bloques (reductoras, baterías, calibración, campos...) → reutilizar el FormField.
  const entry = getBlockEntry(block.type as BlockType);
  const FormFieldComp = entry?.FormField;
  if (!FormFieldComp) return null;
  return (
    <div className="rounded-xl border bg-background p-3 shadow-sm overflow-x-auto">
      <FormFieldComp block={block as never} value={value} onChange={onChange} readOnly={readOnly} />
    </div>
  );
}

// ======================== Tarjeta táctil de un punto de control ========================

function InspectionPointCard({
  label, row, readOnly, onChange,
}: {
  label: string;
  row: Row;
  readOnly: boolean;
  onChange: (next: Row) => void;
}) {
  const state: 'bien' | 'mal' | 'na' | null =
    row.bien === true ? 'bien' : row.mal === true ? 'mal' : row.na === true ? 'na' : null;

  const pick = (val: 'bien' | 'mal' | 'na') => {
    if (readOnly) return;
    const same = state === val;
    onChange({ ...row, bien: !same && val === 'bien', mal: !same && val === 'mal', na: !same && val === 'na' });
  };

  const btn = (val: 'bien' | 'mal' | 'na', active: string) =>
    `flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
      state === val ? active : 'border-gray-200 bg-white text-gray-500'
    } ${readOnly ? 'cursor-default' : 'active:scale-[0.98]'}`;

  return (
    <div className={`rounded-xl border p-3 shadow-sm ${state ? 'bg-white' : 'bg-amber-50/40 border-amber-200'}`}>
      <div className="mb-2 font-medium leading-snug">{label}</div>
      <div className="flex gap-2">
        <button type="button" disabled={readOnly} onClick={() => pick('bien')} className={btn('bien', 'border-green-500 bg-green-500 text-white')}>Bien</button>
        <button type="button" disabled={readOnly} onClick={() => pick('mal')} className={btn('mal', 'border-red-500 bg-red-500 text-white')}>Mal</button>
        <button type="button" disabled={readOnly} onClick={() => pick('na')} className={btn('na', 'border-gray-500 bg-gray-500 text-white')}>N/A</button>
      </div>
      {(state === 'mal' || (typeof row.observaciones === 'string' && row.observaciones)) && (
        <Input
          value={typeof row.observaciones === 'string' ? row.observaciones : ''}
          onChange={(e) => onChange({ ...row, observaciones: e.target.value })}
          placeholder="Observaciones"
          readOnly={readOnly}
          className="mt-2 text-sm"
        />
      )}
    </div>
  );
}
