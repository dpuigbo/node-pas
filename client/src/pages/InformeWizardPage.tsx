import { useState, useMemo, useCallback, useRef, useEffect, Fragment, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, FileText, Loader2, Check, ChevronRight, ChevronLeft,
  CheckCircle2, ClipboardCheck, Bot, Cpu, Move, BookOpen, RefreshCw, X, WifiOff, Camera, Image as ImageIcon, Plus, Trash2, FileUp, Info, ChevronDown,
} from 'lucide-react';
import api from '@/lib/api';
import { useAssembledReport, useUpdateEstadoInforme, useRegenerarInforme } from '@/hooks/useInformes';
import { useConsumibles } from '@/hooks/useCatalogos';
import { useAuth } from '@/hooks/useAuth';
import { getBlockEntry } from '@/components/blocks/registry';
import type { BlockType } from '@/types/editor';
import type { AssembledBlock } from '@/types/informe';
import { db } from '@/lib/db';
import { setOpenInforme } from '@/lib/syncDrafts';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import '@/components/blocks/register-all';

// ======================== Estilo ========================
const LIME = '#c5f82a';

// ======================== Constantes ========================
const EDITABLE_TYPES = new Set<string>([
  'table', 'tristate', 'checklist', 'reducer_oils',
  'battery_manipulator', 'battery_controller', 'equipment_exchange',
  'text_field', 'number_field', 'date_field', 'select_field', 'signature', 'image', 'text_area',
  'intervention_data',
]);

// ======================== Tipos / helpers ========================
type Row = Record<string, unknown>;
interface WizardSection { key: string; label: string; componenteInformeId?: number; blocks: AssembledBlock[]; }

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
function rowDone(row: Row): boolean { return row?.na === true || row?.bien === true || row?.mal === true; }
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
function countPoints(s: WizardSection, getValue: (b: AssembledBlock) => unknown): { done: number; total: number } {
  let done = 0, total = 0;
  for (const b of s.blocks) {
    if (isInspectionTable(b)) {
      const rows = (getValue(b) as Row[]) || [];
      for (const r of rows) { total++; if (rowDone(r)) done++; }
    } else { total++; if (isFilled(getValue(b))) done++; }
  }
  return { done, total };
}
function compIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('general')) return FileText;
  if (l.includes('controlad') || l.includes('irc') || l.includes('omnicore') || l.includes('s4') || l.includes('s3')) return Cpu;
  if (l.includes('eje') || l.includes('irbt') || l.includes('irbp') || l.includes('posicion') || l.includes('track') || l.includes('irt')) return Move;
  return Bot;
}

interface ManualRef { nombre: string; ruta: string; general?: boolean }

/** Abre un PDF de manual en otra pestaña. La cookie de sesión viaja sola (withCredentials),
 *  así que el navegador lo sirve por streaming nativo (rápido) en vez de descargar el blob entero. */
function openManualBlob(componenteInformeId: number, ruta: string): void {
  const url = `/api/v1/componentes-informe/${componenteInformeId}/manual?ruta=${encodeURIComponent(ruta)}`;
  window.open(url, '_blank');
}

// ======================== Selector de manuales ========================
function ManualPickerModal({ picker, onClose }: { picker: { componenteId: number; modelo: string; manuales: ManualRef[] }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full overflow-auto rounded-t-2xl border border-neutral-800 bg-neutral-900 p-4 sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0" style={{ color: LIME }} />
            <span className="truncate text-sm font-semibold text-neutral-100">Manuales · {picker.modelo}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800" title="Cerrar"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-3 text-xs text-neutral-500">{picker.manuales.length} documentos. Toca uno para abrirlo en otra pestaña.</p>
        <div className="space-y-1.5">
          {picker.manuales.map((m) => (
            <button key={m.ruta} onClick={() => openManualBlob(picker.componenteId, m.ruta)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-left transition-colors hover:border-neutral-600">
              <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
              <span className="flex-1 text-sm leading-snug text-neutral-200">{m.nombre.replace(/\.pdf$/i, '')}</span>
              {m.general && <Chip>general</Chip>}
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ======================== Chip ========================
function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'lime' | 'green' }) {
  const cls = tone === 'lime'
    ? 'border-transparent' : tone === 'green'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-neutral-700 bg-neutral-800/60 text-neutral-300';
  const style = tone === 'lime' ? { backgroundColor: `${LIME}1a`, color: LIME } : undefined;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cls}`} style={style}>{children}</span>;
}

// ======================== Página ========================
export default function InformeWizardPage() {
  const { id } = useParams<{ id: string }>();
  const informeId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data, isLoading } = useAssembledReport(informeId || undefined);
  const intervencionId = (data?.informe as { intervencion?: { id?: number } } | undefined)?.intervencion?.id;
  const updateEstado = useUpdateEstadoInforme(informeId, intervencionId ?? 0);
  const regenerar = useRegenerarInforme(informeId);

  const [localCompDatos, setLocalCompDatos] = useState<Record<number, Record<string, unknown>>>({});
  const [localDocDatos, setLocalDocDatos] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'overview' | string>('overview');
  const [manualPicker, setManualPicker] = useState<{ componenteId: number; modelo: string; manuales: ManualRef[] } | null>(null);
  const online = useOnlineStatus();
  const draftHydrated = useRef(false);

  // Restaurar borrador local (cambios sin guardar) al abrir el informe.
  useEffect(() => {
    draftHydrated.current = false;
    let active = true;
    db.drafts.get(informeId).then((d) => {
      if (!active) return;
      if (d?.compDatos && Object.keys(d.compDatos).length) setLocalCompDatos(d.compDatos);
      if (d?.docDatos && Object.keys(d.docDatos).length) setLocalDocDatos(d.docDatos);
      draftHydrated.current = true;
    }).catch(() => { draftHydrated.current = true; });
    return () => { active = false; };
  }, [informeId]);

  // Persistir borrador local en el dispositivo (debounce). Sobrevive a cerrar la app o quedarse sin conexion.
  useEffect(() => {
    if (!draftHydrated.current) return;
    const t = setTimeout(() => {
      const dirty =
        Object.values(localCompDatos).some((d) => d && Object.keys(d).length > 0) ||
        Object.keys(localDocDatos).length > 0;
      if (dirty) {
        db.drafts.put({ informeId, compDatos: localCompDatos, docDatos: localDocDatos, updatedAt: Date.now() }).catch(() => {});
      } else {
        db.drafts.delete(informeId).catch(() => {});
      }
    }, 500);
    return () => clearTimeout(t);
  }, [localCompDatos, localDocDatos, informeId]);

  // Marcar este informe como "abierto" para que el sync global no lo pise (lo gestiona el wizard).
  useEffect(() => {
    setOpenInforme(informeId);
    return () => setOpenInforme(null);
  }, [informeId]);

  const readOnly = data?.informe?.estado === 'finalizado';

  const sections = useMemo<WizardSection[]>(() => {
    const blocks = data?.assembled?.blocks ?? [];
    const order: number[] = [];
    const map = new Map<number, WizardSection>();
    const generalBlocks: AssembledBlock[] = [];
    for (const b of blocks) {
      if (!b._dataKey || !EDITABLE_TYPES.has(b.type)) continue;
      if (b._componenteInformeId) {
        let g = map.get(b._componenteInformeId);
        if (!g) {
          g = { key: `c${b._componenteInformeId}`, label: b._componenteEtiqueta || `Componente ${b._componenteInformeId}`, componenteInformeId: b._componenteInformeId, blocks: [] };
          map.set(b._componenteInformeId, g);
          order.push(b._componenteInformeId);
        }
        g.blocks.push(b);
      } else {
        // Bloques doc-level editables (observaciones generales, intercambio de equipos, pruebas/aceptación…) → sección General.
        generalBlocks.push(b);
      }
    }
    const result = order.map((cid) => map.get(cid)!);
    if (generalBlocks.length > 0) {
      // Orden de la General (modo tecnico): intervencion -> datos -> intercambio ->
      // pruebas -> estado -> observaciones -> firmas. (El PDF mantiene el orden de plantilla.)
      const prio = (b: AssembledBlock): number => {
        const k = (b.config.key as string) || '';
        const lab = ((b.config.label as string) || '').toLowerCase();
        if (b.type === 'intervention_data') return 1;
        if (k === 'table_1') return 2;
        if (b.type === 'equipment_exchange') return 3;
        if (b.type === 'checklist') return lab.includes('probado') ? 4 : 5;
        if (k === 'observaciones_tabla' || b.type === 'text_area') return 6;
        if (b.type === 'signature') return 7;
        return 5.5;
      };
      const sorted = [...generalBlocks].sort((a, b) => prio(a) - prio(b));
      // La General va PRIMERO (cabecera del informe), antes que los componentes.
      result.unshift({ key: 'general', label: 'General del informe', blocks: sorted });
    }
    return result;
  }, [data]);

  const blockValue = useCallback((b: AssembledBlock): unknown => {
    if (!b._dataKey) return null;
    if (b._componenteInformeId) {
      const local = localCompDatos[b._componenteInformeId];
      return local && b._dataKey in local ? local[b._dataKey] : (b._dataValue ?? null);
    }
    return b._dataKey in localDocDatos ? localDocDatos[b._dataKey] : (b._dataValue ?? null);
  }, [localCompDatos, localDocDatos]);

  const onBlockChange = useCallback((b: AssembledBlock, v: unknown) => {
    if (readOnly || !b._dataKey) return;
    const key = b._dataKey;
    const nextComp = b._componenteInformeId
      ? { ...localCompDatos, [b._componenteInformeId]: { ...(localCompDatos[b._componenteInformeId] ?? {}), [key]: v } }
      : localCompDatos;
    let nextDoc = !b._componenteInformeId ? { ...localDocDatos, [key]: v } : localDocDatos;
    // Intercambio AUTOMATICO: al marcar un cambio de aceite o una bateria reemplazada,
    // se recalculan sus filas en la tabla de intercambio (las manuales se conservan).
    if (esFuenteIntercambio(b)) {
      const blocks = data?.assembled?.blocks ?? [];
      const inter = blocks.find((x) => x.type === 'equipment_exchange' && !x._componenteInformeId);
      if (inter?._dataKey) {
        const getVal = (blk: AssembledBlock): unknown => {
          if (!blk._dataKey) return null;
          if (blk._componenteInformeId) {
            const loc = nextComp[blk._componenteInformeId];
            return loc && blk._dataKey in loc ? loc[blk._dataKey] : (blk._dataValue ?? null);
          }
          return blk._dataKey in nextDoc ? nextDoc[blk._dataKey] : (blk._dataValue ?? null);
        };
        const desired = filasAutoIntercambio(blocks, getVal);
        const currentRv = getVal(inter);
        const current = Array.isArray(currentRv) ? (currentRv as EqRow[]) : [];
        nextDoc = { ...nextDoc, [inter._dataKey]: reconciliarIntercambio(current, desired) };
      }
    }
    setLocalCompDatos(nextComp);
    setLocalDocDatos(nextDoc);
  }, [readOnly, localCompDatos, localDocDatos, data]);

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
      setLocalCompDatos({}); setLocalDocDatos({});
      db.drafts.delete(informeId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['informes', informeId, 'assembled'] });
    } catch (err) {
      if (!navigator.onLine) {
        alert('Sin conexión. Tus cambios quedan guardados en el dispositivo y se subirán automáticamente cuando recuperes la conexión.');
      } else {
        const e = err as { response?: { data?: { error?: string } } };
        alert(e?.response?.data?.error ?? 'Error al guardar');
      }
    } finally { setIsSaving(false); }
  }, [hasDirty, isSaving, localCompDatos, localDocDatos, informeId, queryClient]);

  // Auto-sincronizar el borrador de ESTE informe al recuperar la conexion (offline -> online).
  const wasOnline = useRef(online);
  useEffect(() => {
    const reconnected = online && !wasOnline.current;
    wasOnline.current = online;
    if (reconnected && hasDirty && !isSaving && !readOnly) {
      const t = setTimeout(() => { void handleSave(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [online, hasDirty, isSaving, readOnly, handleSave]);

  const handleFinalizar = useCallback(async () => {
    if (hasDirty) { alert('Guarda los cambios antes de finalizar.'); return; }
    if (!window.confirm('¿Finalizar el informe? Quedará cerrado y no se podrá editar.')) return;
    try {
      await updateEstado.mutateAsync('finalizado');
      queryClient.invalidateQueries({ queryKey: ['informes', informeId, 'assembled'] });
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e?.response?.data?.error ?? 'Error al finalizar');
    }
  }, [hasDirty, updateEstado, queryClient, informeId]);

  const handleRegenerar = useCallback(async () => {
    if (!window.confirm('¿Regenerar las plantillas desde el plan? Trae el último formato y corrige datos (NaN del eje, colores, tablas). Se conservan los valores ya introducidos cuyos campos sigan existiendo.')) return;
    try {
      const res = (await regenerar.mutateAsync({ desdePlan: true })) as { fallosPlan?: { modeloId: number; error: string }[] };
      queryClient.invalidateQueries({ queryKey: ['informes', informeId, 'assembled'] });
      const fallos = res?.fallosPlan ?? [];
      if (fallos.length) {
        alert(
          `Atención: ${fallos.length} componente(s) NO se pudieron regenerar desde el plan ` +
          `(se mantuvo la plantilla anterior, así que un NaN o un campo que falte seguirá ahí):\n\n` +
          fallos.map((f) => `· modelo ${f.modeloId}: ${f.error}`).join('\n'),
        );
      } else {
        alert('Plantillas actualizadas desde el plan.');
      }
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e?.response?.data?.error ?? 'Error al actualizar plantillas');
    }
  }, [regenerar, queryClient, informeId]);

  const handleManual = useCallback(async (componenteInformeId: number) => {
    try {
      const { data: m } = await api.get(`/v1/componentes-informe/${componenteInformeId}/manuales`);
      const manuales: ManualRef[] = m?.manuales || [];
      const first = manuales[0];
      if (!first) { alert('No hay manual disponible para este componente todavía.'); return; }
      if (manuales.length === 1) { await openManualBlob(componenteInformeId, first.ruta); return; }
      setManualPicker({ componenteId: componenteInformeId, modelo: m?.modelo || '', manuales });
    } catch {
      alert('No se pudo abrir el manual.');
    }
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-neutral-950"><Loader2 className="h-8 w-8 animate-spin" style={{ color: LIME }} /></div>;
  }
  if (!data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-4 text-center text-neutral-300">
        <p>No se pudo cargar el informe.</p>
        <button onClick={() => navigate(-1)} className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800">Volver</button>
      </div>
    );
  }

  const { informe } = data;
  const finalizado = informe.estado === 'finalizado';
  const estadoLabel = finalizado ? 'Finalizado' : informe.estado === 'activo' ? 'En curso' : 'Borrador';
  const activeIdx = sections.findIndex((s) => s.key === view);
  const activeSection = activeIdx >= 0 ? sections[activeIdx] : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* ===== Barra superior ===== */}
      <header className="flex items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-900 px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => (activeSection ? setView('overview') : navigate(-1))} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100" title="Volver">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${LIME}1a` }}>
            <ClipboardCheck className="h-4 w-4" style={{ color: LIME }} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate text-sm leading-tight">{informe.sistema?.nombre ?? 'Informe'}</div>
            <div className="flex items-center gap-1.5">
              <Chip tone={finalizado ? 'green' : 'neutral'}>{estadoLabel}</Chip>
              {!online && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                  <WifiOff className="h-3 w-3" /> Sin conexión
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate(`/informes/${informeId}/preview`)} className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800">
            <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Vista previa</span>
          </button>
          {!finalizado && (
            <button onClick={handleSave} disabled={!hasDirty || isSaving}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold text-neutral-900 transition-opacity disabled:opacity-40"
              style={{ backgroundColor: LIME }}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Guardar</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
        {activeSection ? (
          <SectionView section={activeSection} sections={sections} activeIdx={activeIdx} readOnly={readOnly}
            blockValue={blockValue} onBlockChange={onBlockChange} onNavigate={setView}
            countPoints={(s) => countPoints(s, blockValue)} onManual={handleManual} />
        ) : (
          <OverviewView totals={totals} sections={sections} finalizado={finalizado} isAdmin={isAdmin}
            countPoints={(s) => countPoints(s, blockValue)} onOpen={setView} onFinalizar={handleFinalizar}
            onAdvanced={() => navigate(`/informes/${informeId}/documento`)}
            onRegenerar={handleRegenerar} regenerating={regenerar.isPending} onManual={handleManual} />
        )}
      </main>

      {manualPicker && <ManualPickerModal picker={manualPicker} onClose={() => setManualPicker(null)} />}
    </div>
  );
}

// ======================== Visión general ========================
function OverviewView({
  totals, sections, finalizado, isAdmin, countPoints, onOpen, onFinalizar, onAdvanced, onRegenerar, regenerating, onManual,
}: {
  totals: { done: number; total: number; pct: number };
  sections: WizardSection[]; finalizado: boolean; isAdmin: boolean;
  countPoints: (s: WizardSection) => { done: number; total: number };
  onOpen: (key: string) => void; onFinalizar: () => void; onAdvanced: () => void;
  onRegenerar: () => void; regenerating: boolean; onManual: (componenteInformeId: number) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-4">
      {/* Tarjeta de progreso global */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-center gap-4">
          <ProgressRing pct={totals.pct} />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-tight">Mantenimiento</h1>
            <p className="text-sm text-neutral-400">{totals.done} de {totals.total} puntos de control completados</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip tone="lime">{totals.pct}% completado</Chip>
              <Chip>{sections.filter((s) => s.componenteInformeId).length} componentes</Chip>
            </div>
          </div>
          {!finalizado && totals.total > 0 && totals.done === totals.total && (
            <button onClick={onFinalizar} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Finalizar
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de componente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((s) => {
          const { done, total } = countPoints(s);
          const complete = total > 0 && done === total;
          const Icon = compIcon(s.label);
          return (
            <div key={s.key} className={`flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 ${s.key === 'general' ? 'sm:col-span-2 border-neutral-700' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: complete ? `${LIME}1a` : '#1f1f1f' }}>
                  <Icon className="h-5 w-5" style={{ color: complete ? LIME : '#a3a3a3' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate leading-tight">{s.label}</div>
                </div>
                <Chip tone={complete ? 'lime' : 'neutral'}>{complete ? 'Completo' : 'Pendiente'}</Chip>
              </div>
              <div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: complete ? LIME : '#60a5fa' }} />
                </div>
                <div className="mt-1.5 text-xs text-neutral-500">{done}/{total} puntos</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onOpen(s.key)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-700 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800">
                  Rellenar <ChevronRight className="h-4 w-4" />
                </button>
                {s.componenteInformeId && (
                  <button onClick={() => onManual(s.componenteInformeId!)} title="Ver manuales" className="flex items-center justify-center gap-1 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800">
                    <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Manual</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {sections.length === 0 && (
          <div className="col-span-full rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
            No hay puntos de control para rellenar en este informe.
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <button onClick={onRegenerar} disabled={regenerating}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 disabled:opacity-50">
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Actualizar plantillas desde el plan
          </button>
          <button className="text-[11px] text-neutral-600 underline hover:text-neutral-400" onClick={onAdvanced}>Abrir el documento (avanzado)</button>
        </div>
      )}
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#262626" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={LIME} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</span>
    </div>
  );
}

// ======================== Vista de sección ========================
function SectionView({
  section, sections, activeIdx, readOnly, blockValue, onBlockChange, onNavigate, countPoints, onManual,
}: {
  section: WizardSection; sections: WizardSection[]; activeIdx: number; readOnly: boolean;
  blockValue: (b: AssembledBlock) => unknown; onBlockChange: (b: AssembledBlock, v: unknown) => void;
  onNavigate: (key: string) => void; countPoints: (s: WizardSection) => { done: number; total: number };
  onManual: (componenteInformeId: number) => void;
}) {
  const { done, total } = countPoints(section);
  const prev = activeIdx > 0 ? sections[activeIdx - 1] : null;
  const next = activeIdx < sections.length - 1 ? sections[activeIdx + 1] : null;
  const Icon = compIcon(section.label);

  return (
    <div className="mx-auto max-w-3xl p-3 sm:p-5">
      {/* Cabecera de sección */}
      <div className="sticky top-0 z-10 -mx-3 sm:-mx-5 mb-3 border-b border-neutral-800 bg-neutral-950/95 px-3 sm:px-5 py-2.5 backdrop-blur">
        <button onClick={() => onNavigate('overview')} className="mb-1.5 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-200">
          <ChevronLeft className="h-3.5 w-3.5" /> Visión general
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 shrink-0"><Icon className="h-4 w-4 text-neutral-300" /></div>
          <h2 className="text-base font-bold truncate flex-1">{section.label}</h2>
          <Chip tone={done === total && total > 0 ? 'lime' : 'neutral'}>{done}/{total}</Chip>
          {section.componenteInformeId && (
            <button onClick={() => onManual(section.componenteInformeId!)} title="Ver manuales"
              className="flex items-center gap-1 rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800">
              <BookOpen className="h-3.5 w-3.5" /> Manual
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {section.blocks.map((b) => (
          <div key={b.id} className="space-y-2">
            <BlockTip block={b} />
            <ControlBlock block={b} readOnly={readOnly} value={blockValue(b)} onChange={(v) => onBlockChange(b, v)} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <button disabled={!prev} onClick={() => prev && onNavigate(prev.key)}
          className="flex items-center gap-1 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 disabled:opacity-30 hover:bg-neutral-800">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        {next
          ? <button onClick={() => onNavigate(next.key)} className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-neutral-900" style={{ backgroundColor: LIME }}>Siguiente <ChevronRight className="h-4 w-4" /></button>
          : <button onClick={() => onNavigate('overview')} className="flex items-center gap-1 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Terminar <Check className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}

// Tips por punto comun del informe (clave de bloque -> ayuda). Cliente, sin regen; ampliar el mapa.
const COMMON_TIPS: Record<string, { title: string; body: string }> = {
  conmutacion_calibracion: {
    title: 'Cómo ver la conmutación en el controlador',
    body: 'Menú → Control panel → Configuration (modo manual) → Topics: Motion → Motor Calibration → Show all → seleccionar eje + Edit → Commutator Offset.',
  },
};

function BlockTip({ block }: { block: AssembledBlock }) {
  const [open, setOpen] = useState(false);
  const tip = COMMON_TIPS[(block.config.key as string) || ''];
  if (!tip) return null;
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-amber-200/90">
        <Info className="h-4 w-4 shrink-0" />
        <span className="flex-1">{tip.title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-2.5 pl-9 text-xs leading-relaxed text-amber-100/80">{tip.body}</div>}
    </div>
  );
}

// ======================== Bloque de control ========================
function ControlBlock({
  block, value, readOnly, onChange,
}: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void; }) {
  if (isInspectionTable(block)) {
    const rows = (value as Row[]) || [];
    const opKey = labelKey(block);
    const title = (block.config.title as string) || '';
    const doneN = rows.filter((r) => rowDone(r)).length;
    const setRow = (i: number, next: Row) => onChange(rows.map((r, idx) => (idx === i ? next : r)));
    return (
      <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
        {title && (
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
            <Chip tone={doneN === rows.length && rows.length > 0 ? 'lime' : 'neutral'}>{doneN}/{rows.length}</Chip>
          </div>
        )}
        <div className="divide-y divide-neutral-800">
          {rows.map((row, i) => (
            <InspectionPointRow key={i} label={String(row[opKey] ?? '')} row={row} readOnly={readOnly} onChange={(n) => setRow(i, n)} />
          ))}
        </div>
      </section>
    );
  }
  // Resto de bloques en OSCURO (reductoras, baterías, calibración, identidad, montaje…)
  if (block.type === 'reducer_oils') return <DarkReducerOils value={value} readOnly={readOnly} onChange={onChange} title={(block.config.title as string) || 'Reductoras'} />;
  if (block.type === 'table') {
    // Tabla de calibración ABB: barra para importar la "Calibración sistema" desde el MOC.cfg.
    if (block.config.key === 'conmutacion_calibracion') {
      return (
        <div className="space-y-3">
          <CalibracionImport rows={(value as Row[]) || []} readOnly={readOnly} onChange={onChange} />
          <DarkTable block={block} value={value} readOnly={readOnly} onChange={onChange} />
        </div>
      );
    }
    // Tablas de baterías (SMB/EIB o controlador): desplegable del catálogo que autorrellena.
    if (typeof block.config.key === 'string' && block.config.key.startsWith('baterias_')) {
      return <DarkBatteryTable block={block} value={value} readOnly={readOnly} onChange={onChange} />;
    }
    return <DarkTable block={block} value={value} readOnly={readOnly} onChange={onChange} />;
  }
  if (['text_field', 'number_field', 'date_field', 'select_field', 'text_area'].includes(block.type)) return <DarkField block={block} value={value} readOnly={readOnly} onChange={onChange} />;
  if (block.type === 'image') return <DarkImage value={value} readOnly={readOnly} onChange={onChange} label={(block.config.label as string) || 'Fotos'} />;
  if (block.type === 'checklist') return <DarkChecklist block={block} value={value} readOnly={readOnly} onChange={onChange} />;
  if (block.type === 'signature') return <DarkSignature block={block} value={value} readOnly={readOnly} onChange={onChange} />;
  if (block.type === 'equipment_exchange') return <DarkEquipmentExchange block={block} value={value} readOnly={readOnly} onChange={onChange} />;
  if (block.type === 'intervention_data') return <DarkInterventionData block={block} value={value} readOnly={readOnly} onChange={onChange} />;
  // Fallback (raro): FormField clásico en tarjeta clara legible.
  const entry = getBlockEntry(block.type as BlockType);
  const FormFieldComp = entry?.FormField;
  if (!FormFieldComp) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-100 p-3 text-neutral-900">
      <FormFieldComp block={block as never} value={value} onChange={onChange} readOnly={readOnly} />
    </div>
  );
}

// ===== Textarea que crece con el contenido (multilínea, envuelve, sin scroll) =====
// Las observaciones deben envolver y crecer en alto (no scroll horizontal) para que el PDF salga bien.
function AutoTextarea({ value, onChange, readOnly, placeholder, className }: {
  value: string; onChange: (v: string) => void; readOnly?: boolean; placeholder?: string; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`;
  }, []);
  useEffect(() => { resize(); }, [value, resize]);
  return (
    <textarea
      ref={ref} rows={1} value={value} disabled={readOnly} placeholder={placeholder}
      onChange={(e) => { onChange(e.target.value); resize(); }}
      className={`block w-full resize-none overflow-hidden whitespace-pre-wrap break-words ${className ?? ''}`}
    />
  );
}

// ===== Celda oscura =====
type Col = { key: string; label: string; type: string; options?: string[]; width?: string };
function darkCell(col: Col, value: unknown, onChange: (v: unknown) => void, readOnly: boolean) {
  if (col.type === 'label') return <span className="text-neutral-300">{String(value ?? '') || '—'}</span>;
  if (col.type === 'checkbox') return (
    <input type="checkbox" checked={value === true || value === 'true'} disabled={readOnly}
      onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 rounded border-neutral-600 bg-neutral-800" style={{ accentColor: LIME }} />
  );
  if (col.type === 'select') return (
    <select value={String(value ?? '')} disabled={readOnly} onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none">
      <option value="">—</option>
      {(col.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (col.type === 'number' || col.type === 'date') return (
    <input type={col.type === 'number' ? 'number' : 'date'}
      value={String(value ?? '')} disabled={readOnly} onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />
  );
  // Texto → multilínea que envuelve y crece (no scroll horizontal).
  return (
    <AutoTextarea value={String(value ?? '')} readOnly={readOnly} onChange={(v) => onChange(v || null)}
      className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />
  );
}

// ===== Tabla genérica en oscuro =====
// ===== Importar calibración ABB: arrastrar MOC.cfg → columna "Calibración sistema" =====
function CalibracionImport({ rows, readOnly, onChange }: { rows: Row[]; readOnly: boolean; onChange: (v: unknown) => void }) {
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [proposal, setProposal] = useState<Record<string, string> | null>(null);
  const ejes = rows.map((r) => String(r.eje));

  // Sección MOTOR_CALIB del MOC.cfg: por eje  -name "rob1_N" ... -cal_offset <valor>.
  // El lookahead (?!-name) impide cruzar a otro registro (p.ej. ARM/ARM_CALIB no traen cal_offset).
  const parseMoc = (text: string): Record<number, string> => {
    const out: Record<number, string> = {};
    // Troceamos por -name "..."; cada trozo es un registro. En los que tengan -cal_offset
    // sacamos el numero de eje del nombre (rob1_3 -> 3). Robusto al orden y a otras secciones.
    for (const ch of text.split(/-name\s+/)) {
      const nm = ch.match(/^"([^"]*)"/);
      const off = ch.match(/-cal_offset\s+(-?\d+(?:[.,]\d+)?)/);
      const ax = nm?.[1]?.match(/(\d+)\s*$/);
      const val = off?.[1];
      if (ax?.[1] && val) out[Number(ax[1])] = val.replace(',', '.');
    }
    return out;
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const offsets = parseMoc(text);
      const n = Object.keys(offsets).length;
      if (n === 0) {
        const hint = /cal_offset/i.test(text)
          ? 'El archivo tiene cal_offset pero no en el formato esperado. Mándame este MOC.cfg y lo ajusto.'
          : /MOTOR_CALIB/i.test(text)
            ? 'Veo MOTOR_CALIB pero sin valores de cal_offset (¿robot sin calibrar?).'
            : 'No parece un MOC.cfg de ABB IRC5 (sin MOTOR_CALIB). Si es OmniCore u otro formato, dímelo.';
        setMsg({ ok: false, text: hint });
        return;
      }
      const next = rows.map((r) => {
        const axis = Number(r.eje);
        return offsets[axis] != null ? { ...r, cal_sistema: offsets[axis] } : r;
      });
      onChange(next);
      setMsg({ ok: true, text: `Rellenados ${n} eje(s) en "Calibración sistema" desde el MOC.cfg.` });
    } catch {
      setMsg({ ok: false, text: 'No se ha podido leer el archivo.' });
    }
  };

  // --- Foto de la etiqueta → OCR (Tesseract.js, en el dispositivo) → "Calibración etiqueta" ---
  const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
    const im = new window.Image(); im.onload = () => res(im); im.onerror = rej; im.src = src;
  });
  const rotate180 = (img: HTMLImageElement): string => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d'); if (!ctx) return '';
    ctx.translate(c.width, c.height); ctx.rotate(Math.PI); ctx.drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  };
  // Empareja "<eje 1-6> ... <valor 0-6 con 4 decimales>". Mapea por numero de eje (no posicional),
  // asi un robot de 4 ejes con huecos no descuadra. Los seriales (sin decimales) no producen falsos.
  const parseLabel = (text: string): Record<number, string> => {
    const out: Record<number, string> = {};
    const re = /(?:^|[^\d.])([1-6])[^\d]{1,4}([0-6][.,]\d{3,4})/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(text)) !== null) {
      const a = Number(mm[1]); const v = mm[2];
      if (a && v && out[a] == null) out[a] = v.replace(',', '.');
    }
    return out;
  };
  // Reduce la imagen (max lado) a JPEG base64 para no enviar fotos enormes a la nube.
  const downscale = (img: HTMLImageElement, max: number): string => {
    let w = img.naturalWidth, h = img.naturalHeight;
    if (Math.max(w, h) > max) { const s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); if (!ctx) return img.src;
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.85);
  };
  // Fallback offline: Tesseract en el dispositivo (prueba 0° y, si pocos ejes, 180°).
  const tesseractRead = async (dataUrl: string): Promise<Record<number, string>> => {
    const T: any = await import('tesseract.js');
    const recognize = T.recognize ?? T.default?.recognize;
    const rec = async (src: string): Promise<string> => {
      const { data } = await recognize(src, 'eng', {
        logger: (lg: { status: string; progress: number }) => {
          if (lg.status === 'recognizing text') setOcrProgress(Math.round(lg.progress * 100));
        },
      });
      return (data?.text as string) ?? '';
    };
    let best = parseLabel(await rec(dataUrl));
    if (Object.keys(best).length < 4) {
      const rotated = rotate180(await loadImage(dataUrl));
      if (rotated) {
        const alt = parseLabel(await rec(rotated));
        if (Object.keys(alt).length > Object.keys(best).length) best = alt;
      }
    }
    return best;
  };
  const runOcr = async (file: File) => {
    setOcrBusy(true); setOcrProgress(0); setMsg(null); setProposal(null);
    // 1) Cargar y reducir a un JPEG autocontenido (data URL), valido para nube y para Tesseract.
    let dataUrl = '';
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      dataUrl = downscale(img, 1568);
    } catch {
      setMsg({ ok: false, text: 'No se pudo abrir la imagen. Si es HEIC (iPhone), haz la foto en JPG o subela convertida.' });
      setOcrBusy(false);
      return;
    } finally {
      URL.revokeObjectURL(url);
    }
    // 2) OCR: nube primero (vision), Tesseract local de fallback.
    try {
      let best: Record<number, string> = {};
      let local = false;
      let cloudErr = '';
      try {
        const { data } = await api.post('/v1/ocr/calibracion-label', { image: dataUrl });
        const axes = (data?.axes ?? {}) as Record<string, unknown>;
        for (const k of Object.keys(axes)) {
          const v = axes[k];
          if (v != null && String(v).trim()) best[Number(k)] = String(v).trim();
        }
      } catch (e) {
        const ee = e as { response?: { data?: { error?: string; message?: string } }; message?: string };
        cloudErr = ee?.response?.data?.error || ee?.response?.data?.message || ee?.message || 'sin respuesta';
      }
      if (Object.keys(best).length === 0) { local = true; best = await tesseractRead(dataUrl); }
      const n = Object.keys(best).length;
      if (n === 0) { setMsg({ ok: false, text: `No se han leido valores${cloudErr ? ` (nube: ${cloudErr})` : ''}. Repite la foto mas recta/enfocada o rellenalos a mano.` }); return; }
      const init: Record<string, string> = {};
      for (const e of ejes) init[e] = best[Number(e)] ?? '';
      setProposal(init);
      setMsg({ ok: true, text: `${n} valor(es) detectado(s)${local ? ` (lectura local${cloudErr ? `; nube fallo: ${cloudErr}` : ''})` : ''}. Revisa, corrige y confirma.` });
    } catch {
      setMsg({ ok: false, text: 'Error leyendo la etiqueta. Intentalo otra vez o rellena a mano.' });
    } finally {
      setOcrBusy(false);
    }
  };
  const applyProposal = () => {
    if (!proposal) return;
    const next = rows.map((r) => {
      const v = proposal[String(r.eje)];
      return v != null && v !== '' ? { ...r, cal_etiqueta: v } : r;
    });
    onChange(next);
    setProposal(null);
    setMsg({ ok: true, text: 'Valores aplicados a "Calibración etiqueta".' });
  };

  if (readOnly) return null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
      <div className="mb-2 text-xs font-medium text-neutral-400">
        Importar la <span className="text-neutral-200">calibración del sistema</span> desde el backup (<span className="font-mono">MOC.cfg</span>)
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        style={drag ? { borderColor: LIME, backgroundColor: 'rgba(197,248,42,0.10)' } : undefined}
        className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 px-4 py-5 text-center transition-colors hover:border-neutral-600 hover:bg-neutral-800/50"
      >
        <FileUp className="h-6 w-6 text-neutral-500" />
        <div className="text-sm text-neutral-300">Arrastra aquí el <span className="font-mono">MOC.cfg</span> o haz clic para elegirlo</div>
        <div className="text-[11px] text-neutral-500">Rellena "Calibración sistema" por eje. La conmutación se introduce a mano (solo se ve en el controlador).</div>
      </div>
      <input ref={inputRef} type="file" accept=".cfg,text/plain" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />

      {/* Foto de la etiqueta → OCR → "Calibración etiqueta" */}
      <div className="mt-3 border-t border-neutral-800 pt-3">
        <div className="mb-2 text-xs font-medium text-neutral-400">
          Leer la <span className="text-neutral-200">calibración de la etiqueta</span> con una foto (OCR en el dispositivo)
        </div>
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          disabled={ocrBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-700 px-3 py-2.5 text-sm text-neutral-200 transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {ocrBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Leyendo…{ocrProgress > 0 ? ` ${ocrProgress}%` : ''}</> : <><Camera className="h-4 w-4" /> Foto de la etiqueta</>}
        </button>
        <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) runOcr(f); e.target.value = ''; }} />
        {proposal && (
          <div className="mt-2 rounded-xl border border-neutral-700 bg-neutral-800/40 p-2.5">
            <div className="mb-1.5 text-xs text-neutral-400">Propuesta del OCR — revisa, corrige y confirma:</div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {ejes.map((e) => (
                <label key={e} className="flex items-center gap-1.5 text-sm">
                  <span className="w-9 shrink-0 text-neutral-500">Eje {e}</span>
                  <input
                    value={proposal[e] ?? ''}
                    inputMode="decimal"
                    onChange={(ev) => setProposal({ ...proposal, [e]: ev.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-100 outline-none focus:border-neutral-500"
                  />
                </label>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={applyProposal} className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-900" style={{ backgroundColor: LIME }}>
                Aplicar a "Calibración etiqueta"
              </button>
              <button type="button" onClick={() => setProposal(null)} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {msg && <div className="mt-2 text-xs" style={{ color: msg.ok ? LIME : '#f87171' }}>{msg.text}</div>}
    </div>
  );
}

function DarkTable({ block, value, readOnly, onChange }: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const cols = (block.config.columns as Col[]) || [];
  const rows = (value as Row[]) || [];
  const title = (block.config.title as string) || (block.config.label as string) || '';
  const rowPhotos = !!block.config.rowPhotos;
  // Tabla dinámica (añadir/eliminar filas): flag explícito `dynamicRows`, o tabla doc-level
  // sin `fixedRows` (p.ej. observaciones). Las de componente o con fixedRows son fijas.
  const dynamic = block.config.dynamicRows === true || (!block._componenteInformeId && !((block.config.fixedRows as unknown[] | undefined)?.length));
  const addLabel = (block.config.addLabel as string) || 'Añadir fila';
  const update = (ri: number, key: string, v: unknown) => onChange(rows.map((r, i) => (i === ri ? { ...r, [key]: v } : r)));
  const emptyRow = (): Row => {
    const r: Row = {};
    for (const c of cols) r[c.key] = c.type === 'checkbox' ? false : '';
    if (rowPhotos) r.fotos = [];
    return r;
  };
  const addRow = () => onChange([...rows, emptyRow()]);
  const removeRow = (ri: number) => onChange(rows.filter((_, i) => i !== ri));
  const isText = (c: Col) => !['label', 'checkbox', 'select', 'number', 'date'].includes(c.type);
  const compactCols = cols.filter((c) => !isText(c));
  const textCols = cols.filter(isText);
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      {title && <div className="border-b border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200">{title}</div>}
      {/* Escritorio/tablet: tabla */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full table-fixed text-sm">
          <colgroup>{cols.map((c) => <col key={c.key} style={c.width ? { width: c.width } : undefined} />)}{dynamic && !readOnly && <col style={{ width: '44px' }} />}</colgroup>
          <thead>
            <tr className="text-left">{cols.map((c) => <th key={c.key} className="px-3 py-2 text-xs font-medium text-neutral-500">{c.label}</th>)}{dynamic && !readOnly && <th className="px-2 py-2" />}</tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.length === 0
              ? <tr><td colSpan={(cols.length + (dynamic && !readOnly ? 1 : 0)) || 1} className="px-3 py-4 text-center text-xs text-neutral-600">Sin filas</td></tr>
              : rows.map((row, ri) => (
                <Fragment key={ri}>
                  <tr>
                    {cols.map((c) => <td key={c.key} className="px-3 py-2 align-top">{darkCell(c, row[c.key], (v) => update(ri, c.key, v), readOnly)}</td>)}
                    {dynamic && !readOnly && (
                      <td className="px-2 py-2 align-top">
                        <button type="button" onClick={() => removeRow(ri)} title="Eliminar fila" className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                  {rowPhotos && (
                    <tr>
                      <td colSpan={(cols.length + (dynamic && !readOnly ? 1 : 0)) || 1} className="px-3 pb-3">
                        <RowPhotos fotos={(row.fotos as { name: string; data: string }[]) || []} readOnly={readOnly} onChange={(f) => update(ri, 'fotos', f)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
          </tbody>
        </table>
      </div>
      {/* Móvil: tarjeta por fila — datos compactos arriba, columnas de texto (observaciones) a lo ancho debajo */}
      <div className="divide-y divide-neutral-800 sm:hidden">
        {rows.length === 0
          ? <div className="px-4 py-4 text-center text-xs text-neutral-600">Sin filas</div>
          : rows.map((row, ri) => (
            <div key={ri} className="space-y-2 p-3">
              {dynamic && !readOnly && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-600">#{ri + 1}</span>
                  <button type="button" onClick={() => removeRow(ri)} title="Eliminar" className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-800 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              {compactCols.length > 0 && (
                <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                  {compactCols.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">{c.label}</div>
                      {darkCell(c, row[c.key], (v) => update(ri, c.key, v), readOnly)}
                    </div>
                  ))}
                </div>
              )}
              {textCols.map((c) => (
                <div key={c.key}>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">{c.label}</div>
                  {darkCell(c, row[c.key], (v) => update(ri, c.key, v), readOnly)}
                </div>
              ))}
              {rowPhotos && (
                <RowPhotos fotos={(row.fotos as { name: string; data: string }[]) || []} readOnly={readOnly} onChange={(f) => update(ri, 'fotos', f)} />
              )}
            </div>
          ))}
      </div>
      {dynamic && !readOnly && (
        <div className="border-t border-neutral-800 p-2">
          <button type="button" onClick={addRow} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800/50">
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        </div>
      )}
    </section>
  );
}

// ===== checklist en oscuro =====
function DarkChecklist({ block, value, readOnly, onChange }: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const items = (block.config.items as { key: string; label: string }[]) || [];
  const label = (block.config.label as string) || '';
  const layout = (block.config.layout as string) || 'vertical';
  const checked = (value as string[]) ?? [];
  const toggle = (key: string) => {
    if (readOnly) return;
    onChange(checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key]);
  };
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      {label && <div className="border-b border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200">{label}</div>}
      <div className={`p-4 ${layout === 'horizontal' ? 'flex flex-wrap gap-x-5 gap-y-2.5' : 'space-y-2.5'}`}>
        {items.length === 0
          ? <span className="text-xs italic text-neutral-600">Sin items</span>
          : items.map((item) => (
            <label key={item.key} className="flex cursor-pointer select-none items-center gap-2">
              <input type="checkbox" checked={checked.includes(item.key)} disabled={readOnly}
                onChange={() => toggle(item.key)}
                className="h-5 w-5 rounded border-neutral-600 bg-neutral-800" style={{ accentColor: LIME }} />
              <span className="text-sm text-neutral-200">{item.label}</span>
            </label>
          ))}
      </div>
    </section>
  );
}

// ===== firma en oscuro (lienzo blanco para firmar, marco oscuro) =====
function DarkSignature({ block, value, readOnly, onChange }: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const label = (block.config.label as string) || 'Firma';
  const role = (block.config.role as string) || '';
  const required = !!block.config.required;
  const current = (value as string | null) ?? null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const W = 400, H = 180;

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (current) {
      const img = new window.Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, W, H); setHasStrokes(true); };
      img.src = current;
    } else setHasStrokes(false);
  }, [current]);

  const posOf = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current; if (!cv) return { x: 0, y: 0 };
    const r = cv.getBoundingClientRect();
    const sx = W / r.width, sy = H / r.height;
    if ('touches' in e) { const t = e.touches[0] || e.changedTouches[0]; return { x: (t!.clientX - r.left) * sx, y: (t!.clientY - r.top) * sy }; }
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const start = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return; e.preventDefault(); drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
    const p = posOf(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1a1a1a';
  };
  const move = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing.current || readOnly) return; e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
    const p = posOf(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasStrokes(true);
  };
  const end = () => {
    if (!drawing.current) return; drawing.current = false;
    const cv = canvasRef.current; if (!cv) return;
    onChange(cv.toDataURL('image/png'));
  };
  const clear = () => {
    if (readOnly) return;
    const ctx = canvasRef.current?.getContext('2d'); if (ctx) ctx.clearRect(0, 0, W, H);
    setHasStrokes(false); onChange(null);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-neutral-200">
          {label}{required && <span className="text-red-400">*</span>}
          {role && <span className="ml-2 text-xs font-normal text-neutral-500">({role})</span>}
        </h3>
        {!readOnly && hasStrokes && (
          <button type="button" onClick={clear} className="flex items-center gap-1 rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800">
            <X className="h-3.5 w-3.5" /> Borrar
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="overflow-hidden rounded-xl border border-neutral-700 bg-white">
          <canvas ref={canvasRef} width={W} height={H}
            className={`w-full touch-none ${readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-crosshair'}`}
            style={{ maxWidth: '100%', height: 'auto', aspectRatio: `${W}/${H}` }}
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        </div>
        {!readOnly && !hasStrokes && <p className="mt-1.5 text-center text-[10px] text-neutral-500">Dibuja tu firma con el raton o el dedo</p>}
      </div>
    </section>
  );
}

// ===== intercambio de equipos en oscuro (tarjeta por equipo) =====
type EqRow = { unidadesSalida: string; designacionEntrada: string; designacionSalida: string; serieEntrada: string; serieSalida: string; intercambio: boolean; usado: boolean; unidadesUsadas: string; _src?: string };

// ===== Intercambio automatico: filas derivadas de aceites (cambio) y baterias (reemplazado) =====
function esFuenteIntercambio(b: AssembledBlock): boolean {
  return b.type === 'reducer_oils' || (b.type === 'table' && String(b.config.key ?? '').startsWith('baterias_'));
}
function filasAutoIntercambio(blocks: AssembledBlock[], getVal: (b: AssembledBlock) => unknown): EqRow[] {
  const out: EqRow[] = [];
  for (const b of blocks) {
    const rv = getVal(b);
    if (!Array.isArray(rv)) continue;
    const rows = rv as Record<string, unknown>[];
    if (b.type === 'reducer_oils') {
      rows.forEach((r, i) => {
        if (r && r.cambio) {
          const nombre = String(r.tipoSuministro ?? '');
          const vol = r.volumen != null ? String(r.volumen) : '';
          out.push({ _src: `oil:${b._componenteInformeId}:${String(r.eje ?? i)}`, designacionEntrada: nombre, designacionSalida: nombre, unidadesSalida: vol, unidadesUsadas: vol, serieEntrada: '', serieSalida: '', intercambio: true, usado: false });
        }
      });
    } else if (b.type === 'table' && String(b.config.key ?? '').startsWith('baterias_')) {
      rows.forEach((r, i) => {
        if (r && r.reemplazado) {
          const nombre = String(r.bateria ?? '');
          out.push({ _src: `bat:${b._componenteInformeId ?? 'doc'}:${String(b.config.key)}:${i}`, designacionEntrada: nombre, designacionSalida: nombre, unidadesSalida: '', unidadesUsadas: '', serieEntrada: '', serieSalida: '', intercambio: true, usado: false });
        }
      });
    }
  }
  return out;
}
function reconciliarIntercambio(current: EqRow[], desired: EqRow[]): EqRow[] {
  const manual = current.filter((r) => !r._src);
  const prevAuto = new Map(current.filter((r) => r._src).map((r) => [r._src as string, r]));
  // Mantiene la fila auto existente (con ediciones del tecnico) si su origen sigue; si no, la nueva.
  const auto = desired.map((d) => prevAuto.get(d._src as string) ?? d);
  return [...auto, ...manual];
}
// ===== Tabla de baterías (SMB/EIB o controlador): desplegable del catálogo que autorrellena =====
type BatOpt = { id: number; nombre: string; subtipo: string | null; codigoFabricante: string | null; activo: boolean };
type BatRow = { consumibleId?: number | null; bateria?: string; referencia?: string; reemplazado?: boolean; fecha?: string };
function DarkBatteryTable({ block, value, readOnly, onChange }: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const title = (block.config.title as string) || (block.config.label as string) || 'Baterías';
  const key = (block.config.key as string) || '';
  const isSmb = key.includes('smb');
  const { data: allBat } = useConsumibles({ tipo: 'bateria' });
  // Opciones por modelo (las que nombra el manual) si vienen en la plantilla; si no, todo el catalogo.
  const cfgOpts = ((block.config.opcionesBateria as { consumibleId: number | null; nombre: string; referencia: string }[]) || [])
    .filter((o) => o.consumibleId != null)
    .map((o) => ({ id: o.consumibleId as number, nombre: o.nombre, codigoFabricante: o.referencia, subtipo: null, activo: true } as BatOpt));
  const opciones = cfgOpts.length > 0 ? cfgOpts : ((allBat as BatOpt[]) || []).filter((b) => b.activo && (isSmb
    ? (b.subtipo?.startsWith('smb_') || b.subtipo === 'eib')
    : (b.subtipo === 'cmos_rtc' || b.subtipo === 'memory_backup' || b.subtipo === null)));
  const single = cfgOpts.length === 1; // el manual nombra 1 tipo -> por defecto, sin desplegable
  const rows = (value as BatRow[]) || [];
  const update = (ri: number, patch: Partial<BatRow>) => { if (readOnly) return; onChange(rows.map((r, i) => (i === ri ? { ...r, ...patch } : r))); };
  const pick = (ri: number, id: string) => {
    const o = opciones.find((b) => b.id === Number(id));
    update(ri, { consumibleId: o?.id ?? null, bateria: o?.nombre ?? '', referencia: o?.codigoFabricante ?? '' });
  };
  const selId = (r: BatRow): number | '' => r.consumibleId ?? (opciones.find((o) => o.nombre === r.bateria)?.id ?? '');
  const add = () => { if (readOnly) return; onChange([...rows, { consumibleId: null, bateria: '', referencia: '', reemplazado: false, fecha: '' }]); };
  const remove = (ri: number) => { if (readOnly) return; onChange(rows.filter((_, i) => i !== ri)); };
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200">{title}</div>
      <div className="divide-y divide-neutral-800">
        {rows.length === 0
          ? <div className="px-4 py-4 text-center text-xs text-neutral-600">Sin baterías. Añade una abajo.</div>
          : rows.map((row, ri) => (
            <div key={ri} className="space-y-2 p-3">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">Pila / Batería</div>
                  {single
                    ? <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 px-2 py-1.5 text-sm text-neutral-100">{row.bateria || opciones[0]?.nombre || '—'}</div>
                    : <select value={selId(row)} disabled={readOnly} onChange={(e) => pick(ri, e.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none">
                        <option value="">— Seleccionar batería —</option>
                        {opciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                      </select>}
                </div>
                {!readOnly && (
                  <button type="button" onClick={() => remove(ri)} title="Quitar" className="mb-1.5 shrink-0 text-neutral-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">Referencia</div>
                  <div className="truncate rounded-lg border border-neutral-800 bg-neutral-800/40 px-2 py-1.5 text-sm text-neutral-300" title={row.referencia || ''}>{row.referencia || '—'}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">Fecha de reemplazo</div>
                  <div className="flex gap-1">
                    <input value={row.fecha ?? ''} disabled={readOnly} onChange={(e) => update(ri, { fecha: e.target.value })} placeholder="DD/MM/AAAA"
                      className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none" />
                    {!readOnly && <button type="button" onClick={() => update(ri, { fecha: new Date().toLocaleDateString('es-ES') })} title="Poner la fecha de hoy" className="shrink-0 rounded-lg border border-neutral-700 px-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800">Hoy</button>}
                  </div>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-0.5 text-sm text-neutral-200">
                <input type="checkbox" checked={!!row.reemplazado} disabled={readOnly} onChange={(e) => update(ri, { reemplazado: e.target.checked })}
                  className="h-5 w-5 rounded border-neutral-600 bg-neutral-800" style={{ accentColor: LIME }} /> Reemplazado
              </label>
            </div>
          ))}
      </div>
      {!readOnly && (
        <div className="border-t border-neutral-800 p-3">
          <button type="button" onClick={add} className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
            <Plus className="h-4 w-4" /> Añadir batería
          </button>
        </div>
      )}
    </section>
  );
}

function DarkEquipmentExchange({ block, value, readOnly, onChange }: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const title = (block.config.title as string) || (block.config.label as string) || 'Intercambio de equipos';
  const defaultRows = (block.config.defaultRows as number) || 0;
  const empty = (): EqRow => ({ unidadesSalida: '', designacionEntrada: '', designacionSalida: '', serieEntrada: '', serieSalida: '', intercambio: false, usado: false, unidadesUsadas: '' });
  const rows = ((value as EqRow[]) ?? (defaultRows ? Array.from({ length: defaultRows }, empty) : [])) as EqRow[];
  const update = (ri: number, field: keyof EqRow, v: unknown) => { if (readOnly) return; onChange(rows.map((r, i) => (i === ri ? { ...r, [field]: v } : r))); };
  const add = () => { if (readOnly) return; onChange([...rows, empty()]); };
  const remove = (ri: number) => { if (readOnly) return; onChange(rows.filter((_, i) => i !== ri)); };
  const inp = (ri: number, field: keyof EqRow, type = 'text') => (
    <input type={type} value={String(rows[ri]?.[field] ?? '')} disabled={readOnly}
      onChange={(e) => update(ri, field, e.target.value)}
      className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />
  );
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200">{title}</div>
      <div className="divide-y divide-neutral-800">
        {rows.length === 0
          ? <div className="px-4 py-4 text-center text-xs text-neutral-600">Sin equipos. Anade uno abajo.</div>
          : rows.map((row, ri) => (
            <div key={ri} className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Equipo {ri + 1}</span>
                {!readOnly && (
                  <button type="button" onClick={() => remove(ri)} className="text-neutral-500 hover:text-red-400" title="Quitar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><div className="mb-0.5 text-[10px] text-neutral-500">Designacion entrada</div>{inp(ri, 'designacionEntrada')}</div>
                <div><div className="mb-0.5 text-[10px] text-neutral-500">Designacion salida</div>{inp(ri, 'designacionSalida')}</div>
                <div><div className="mb-0.5 text-[10px] text-neutral-500">S/N entrada</div>{inp(ri, 'serieEntrada')}</div>
                <div><div className="mb-0.5 text-[10px] text-neutral-500">S/N salida</div>{inp(ri, 'serieSalida')}</div>
                <div><div className="mb-0.5 text-[10px] text-neutral-500">Uds. salida</div>{inp(ri, 'unidadesSalida', 'number')}</div>
                <div><div className="mb-0.5 text-[10px] text-neutral-500">Uds. usadas</div>{inp(ri, 'unidadesUsadas', 'number')}</div>
              </div>
              <div className="flex items-center gap-5 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-200">
                  <input type="checkbox" checked={!!row.intercambio} disabled={readOnly} onChange={(e) => update(ri, 'intercambio', e.target.checked)}
                    className="h-5 w-5 rounded border-neutral-600 bg-neutral-800" style={{ accentColor: LIME }} /> Intercambio
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-200">
                  <input type="checkbox" checked={!!row.usado} disabled={readOnly} onChange={(e) => update(ri, 'usado', e.target.checked)}
                    className="h-5 w-5 rounded border-neutral-600 bg-neutral-800" style={{ accentColor: LIME }} /> Usado
                </label>
              </div>
            </div>
          ))}
      </div>
      {!readOnly && (
        <div className="border-t border-neutral-800 p-3">
          <button type="button" onClick={add} className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
            <Plus className="h-4 w-4" /> Anadir equipo
          </button>
        </div>
      )}
    </section>
  );
}

// ===== intervencion (datos doc-level) en oscuro =====
const INTERV_SECTIONS: { title: string; fields: [string, string, string][] }[] = [
  { title: 'Intervención', fields: [['Actividad', 'actividad', 'Nivel 1'], ['Horas', 'horas', '2:30'], ['N. trabajo', 'ordenTrabajo', 'OT26-XXXXX'], ['Fecha', 'fecha', 'DD/MM/YYYY'], ['Hora inicio', 'horaInicio', 'HH:MM'], ['Hora fin', 'horaFin', 'HH:MM']] },
  { title: 'Personal', fields: [['Tecnico PAS', 'tecnicoPas', 'Nombre'], ['Tecnico cliente', 'tecnicoCliente', 'Nombre'], ['Tel. tecnico', 'telTecnico', '+34'], ['Tel. contacto', 'telContacto', '+34'], ['Email tecnico', 'emailTecnico', 'email@empresa.com'], ['Email contacto', 'emailContacto', 'email@cliente.com']] },
];
function DarkInterventionData({ block, value, readOnly, onChange }: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const data = (value as Record<string, string>) || {};
  const title = (block.config.title as string) || 'Intervención';
  const set = (k: string, v: string) => { if (readOnly) return; onChange({ ...data, [k]: v }); };
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200">{title}</div>
      <div className="space-y-3 p-3">
        {INTERV_SECTIONS.map((sec) => (
          <div key={sec.title}>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: LIME }}>{sec.title}</div>
            <div className="grid grid-cols-2 gap-2">
              {sec.fields.map(([label, key, ph]) => (
                <div key={key}>
                  <div className="mb-0.5 text-[10px] text-neutral-500">{label}</div>
                  <input type="text" value={data[key] || ''} placeholder={ph} disabled={readOnly}
                    onChange={(e) => set(key, e.target.value)}
                    className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ===== reducer_oils en oscuro =====
function DarkReducerOils({ value, readOnly, onChange, title }: { value: unknown; readOnly: boolean; onChange: (v: unknown) => void; title: string }) {
  const rows = (value as Row[]) || [];
  const update = (ri: number, key: string, v: unknown) => onChange(rows.map((r, i) => (i === ri ? { ...r, [key]: v } : r)));
  const chk = (ri: number, key: string, checked: boolean) => (
    <input type="checkbox" checked={checked} disabled={readOnly} onChange={(e) => update(ri, key, e.target.checked)} className="h-5 w-5 rounded border-neutral-600 bg-neutral-800" style={{ accentColor: LIME }} />
  );
  const obs = (ri: number, row: Row) => (
    <AutoTextarea value={typeof row.observaciones === 'string' ? row.observaciones : ''} readOnly={readOnly} onChange={(v) => update(ri, 'observaciones', v)} placeholder="—" className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none" />
  );
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200">{title}</div>
      {/* Escritorio/tablet: tabla */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: '9%' }} /><col style={{ width: '22%' }} /><col style={{ width: '11%' }} />
            <col style={{ width: '9%' }} /><col style={{ width: '9%' }} /><col style={{ width: '40%' }} />
          </colgroup>
          <thead>
            <tr className="text-left text-xs font-medium text-neutral-500">
              <th className="px-3 py-2">Eje</th><th className="px-3 py-2">Lubricante</th><th className="px-3 py-2">Vol.</th>
              <th className="px-3 py-2 text-center">Control</th><th className="px-3 py-2 text-center">Cambio</th><th className="px-3 py-2">Observaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td className="px-3 py-2 whitespace-nowrap text-neutral-300">{String(row.eje ?? '')}</td>
                <td className="px-3 py-2 text-neutral-300">{String(row.tipoSuministro ?? '')}</td>
                <td className="px-3 py-2 whitespace-nowrap text-neutral-400">{String(row.volumen ?? '')} {String(row.unidad ?? '')}</td>
                <td className="px-3 py-2 text-center">{chk(ri, 'control', row.control === true)}</td>
                <td className="px-3 py-2 text-center">{chk(ri, 'cambio', row.cambio === true)}</td>
                <td className="px-3 py-2 align-top">{obs(ri, row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Móvil: tarjeta por eje — datos arriba, Observaciones a lo ancho debajo */}
      <div className="divide-y divide-neutral-800 sm:hidden">
        {rows.map((row, ri) => (
          <div key={ri} className="space-y-2 p-3">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2 text-sm">
              <div><div className="text-[10px] uppercase text-neutral-500">Eje</div><div className="text-neutral-200">{String(row.eje ?? '')}</div></div>
              <div className="min-w-0"><div className="text-[10px] uppercase text-neutral-500">Lubricante</div><div className="text-neutral-200">{String(row.tipoSuministro ?? '')}</div></div>
              <div><div className="text-[10px] uppercase text-neutral-500">Vol.</div><div className="text-neutral-400">{String(row.volumen ?? '')} {String(row.unidad ?? '')}</div></div>
              <div className="text-center"><div className="text-[10px] uppercase text-neutral-500">Control</div>{chk(ri, 'control', row.control === true)}</div>
              <div className="text-center"><div className="text-[10px] uppercase text-neutral-500">Cambio</div>{chk(ri, 'cambio', row.cambio === true)}</div>
            </div>
            <div>
              <div className="mb-0.5 text-[10px] uppercase text-neutral-500">Observaciones</div>
              {obs(ri, row)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ===== Campo simple en oscuro =====
function DarkField({ block, value, readOnly, onChange }: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const c = block.config;
  const label = (c.label as string) || '';
  const opts = (c.options as { value: string; label: string }[] | undefined);
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
      {label && <div className="mb-1.5 text-sm font-medium text-neutral-200">{label}</div>}
      {block.type === 'text_area'
        ? <AutoTextarea value={typeof value === 'string' ? value : ''} readOnly={readOnly} onChange={(v) => onChange(v)} placeholder="Escribe aquí…" className="min-h-[72px] rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />
        : block.type === 'select_field' && opts
        ? <select value={String(value ?? '')} disabled={readOnly} onChange={(e) => onChange(e.target.value || null)} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"><option value="">—</option>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : <input type={block.type === 'number_field' ? 'number' : block.type === 'date_field' ? 'date' : 'text'} value={String(value ?? '')} disabled={readOnly} onChange={(e) => onChange(e.target.value || null)} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />}
    </div>
  );
}

// ===== Fotos (camara) en oscuro =====
function DarkImage({ value, readOnly, onChange, label }: { value: unknown; readOnly: boolean; onChange: (v: unknown) => void; label: string }) {
  const images = (value as { name: string; data: string }[]) ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const maxSizeMB = 8;
  const add = (files: FileList | null) => {
    if (!files || readOnly) return;
    for (const file of Array.from(files)) {
      if (file.size > maxSizeMB * 1024 * 1024) { alert(`"${file.name}" supera ${maxSizeMB} MB.`); continue; }
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => onChange([...images, { name: file.name, data: reader.result as string }]);
      reader.readAsDataURL(file);
    }
    if (inputRef.current) inputRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  };
  const remove = (i: number) => { if (!readOnly) onChange(images.filter((_, idx) => idx !== i)); };
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
      {label && <div className="mb-2 text-sm font-medium text-neutral-200">{label}</div>}
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg border border-neutral-700" style={{ width: 110, height: 84 }}>
              <img src={img.data} alt={img.name} className="h-full w-full object-cover" />
              {!readOnly && <button type="button" onClick={() => remove(i)} className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white"><X className="h-3 w-3" /></button>}
            </div>
          ))}
        </div>
      )}
      {!readOnly && (
        <div className="flex gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-neutral-900" style={{ backgroundColor: LIME }}>
            <Camera className="h-4 w-4" /> Hacer foto
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-700 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800">
            <ImageIcon className="h-4 w-4" /> Galería
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e) => add(e.target.files)} className="hidden" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => add(e.target.files)} className="hidden" />
      {readOnly && images.length === 0 && <div className="text-xs text-neutral-500">Sin fotos</div>}
    </div>
  );
}

// ===== Fotos dentro de una observacion (compacto: camara + galeria + miniaturas) =====
function RowPhotos({ fotos, readOnly, onChange }: { fotos: { name: string; data: string }[]; readOnly: boolean; onChange: (f: { name: string; data: string }[]) => void }) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const add = (files: FileList | null) => {
    if (!files || readOnly) return;
    for (const file of Array.from(files)) {
      if (file.size > 8 * 1024 * 1024) { alert(`"${file.name}" supera 8 MB.`); continue; }
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => onChange([...fotos, { name: file.name, data: reader.result as string }]);
      reader.readAsDataURL(file);
    }
    if (camRef.current) camRef.current.value = '';
    if (galRef.current) galRef.current.value = '';
  };
  const remove = (i: number) => { if (!readOnly) onChange(fotos.filter((_, idx) => idx !== i)); };
  return (
    <div className="mt-2 space-y-1.5">
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fotos.map((f, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg border border-neutral-700" style={{ width: 76, height: 58 }}>
              <img src={f.data} alt={f.name} className="h-full w-full object-cover" />
              {!readOnly && <button type="button" onClick={() => remove(i)} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"><X className="h-2.5 w-2.5" /></button>}
            </div>
          ))}
        </div>
      )}
      {!readOnly && (
        <div className="flex gap-2">
          <button type="button" onClick={() => camRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"><Camera className="h-3.5 w-3.5" /> Foto</button>
          <button type="button" onClick={() => galRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"><ImageIcon className="h-3.5 w-3.5" /> Galería</button>
        </div>
      )}
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={(e) => add(e.target.files)} className="hidden" />
      <input ref={galRef} type="file" accept="image/*" multiple onChange={(e) => add(e.target.files)} className="hidden" />
    </div>
  );
}

// ======================== Punto de control (fila con control segmentado) ========================
function InspectionPointRow({
  label, row, readOnly, onChange,
}: { label: string; row: Row; readOnly: boolean; onChange: (next: Row) => void; }) {
  if (row._valor) {
    // Fila de VALOR (p.ej. Versión del sistema): solo texto libre, sin Bien/Mal/N/A.
    return (
      <div className="p-3">
        <div className="mb-1.5 text-sm font-medium leading-snug text-neutral-100">{label}</div>
        <AutoTextarea value={typeof row.observaciones === 'string' ? row.observaciones : ''}
          onChange={(v) => onChange({ ...row, observaciones: v })}
          placeholder="Escribe aquí..." readOnly={readOnly}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />
      </div>
    );
  }
  const state: 'bien' | 'mal' | 'na' | null =
    row.bien === true ? 'bien' : row.mal === true ? 'mal' : row.na === true ? 'na' : null;
  const dot = state === 'bien' ? '#10b981' : state === 'mal' ? '#ef4444' : state === 'na' ? '#737373' : '#f59e0b';
  const pick = (val: 'bien' | 'mal' | 'na') => {
    if (readOnly) return;
    const same = state === val;
    onChange({ ...row, bien: !same && val === 'bien', mal: !same && val === 'mal', na: !same && val === 'na' });
  };
  const seg = (val: 'bien' | 'mal' | 'na', active: string, last = false) =>
    `flex-1 py-2.5 text-sm font-semibold transition-colors ${last ? '' : 'border-r border-neutral-700'} ${
      state === val ? active : 'bg-neutral-800/40 text-neutral-400 hover:bg-neutral-800'
    } ${readOnly ? 'cursor-default' : ''}`;
  return (
    <div className="p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
        <span className="text-sm font-medium leading-snug text-neutral-100">{label}</span>
      </div>
      <div className="flex overflow-hidden rounded-lg border border-neutral-700">
        <button type="button" disabled={readOnly} onClick={() => pick('bien')} className={seg('bien', 'bg-emerald-500 text-white')}>Bien</button>
        <button type="button" disabled={readOnly} onClick={() => pick('mal')} className={seg('mal', 'bg-red-500 text-white')}>Mal</button>
        <button type="button" disabled={readOnly} onClick={() => pick('na')} className={seg('na', 'bg-neutral-600 text-white', true)}>N/A</button>
      </div>
      {(!readOnly || (typeof row.observaciones === 'string' && row.observaciones)) && (
        <AutoTextarea value={typeof row.observaciones === 'string' ? row.observaciones : ''}
          onChange={(v) => onChange({ ...row, observaciones: v })}
          placeholder="Observaciones" readOnly={readOnly}
          className="mt-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />
      )}
      {(!readOnly || (Array.isArray(row.fotos) && row.fotos.length > 0)) && (
        <RowPhotos
          fotos={(Array.isArray(row.fotos) ? row.fotos : []) as { name: string; data: string }[]}
          readOnly={readOnly}
          onChange={(f) => onChange({ ...row, fotos: f })}
        />
      )}
    </div>
  );
}
