import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, FileText, Loader2, Check, ChevronRight, ChevronLeft,
  CheckCircle2, ClipboardCheck, Bot, Cpu, Move, BookOpen, RefreshCw, X, WifiOff,
} from 'lucide-react';
import api from '@/lib/api';
import { useAssembledReport, useUpdateEstadoInforme, useRegenerarInforme } from '@/hooks/useInformes';
import { useAuth } from '@/hooks/useAuth';
import { getBlockEntry } from '@/components/blocks/registry';
import type { BlockType } from '@/types/editor';
import type { AssembledBlock } from '@/types/informe';
import { db } from '@/lib/db';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import '@/components/blocks/register-all';

// ======================== Estilo ========================
const LIME = '#c5f82a';

// ======================== Constantes ========================
const EDITABLE_TYPES = new Set<string>([
  'table', 'tristate', 'checklist', 'reducer_oils',
  'battery_manipulator', 'battery_controller', 'equipment_exchange',
  'text_field', 'number_field', 'date_field', 'select_field', 'signature',
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

  const readOnly = data?.informe?.estado === 'finalizado';

  const sections = useMemo<WizardSection[]>(() => {
    const blocks = data?.assembled?.blocks ?? [];
    const order: number[] = [];
    const map = new Map<number, WizardSection>();
    for (const b of blocks) {
      if (!b._dataKey || !EDITABLE_TYPES.has(b.type) || !b._componenteInformeId) continue;
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
    if (b._componenteInformeId) {
      const cid = b._componenteInformeId;
      setLocalCompDatos((prev) => ({ ...prev, [cid]: { ...(prev[cid] ?? {}), [b._dataKey!]: v } }));
    } else {
      setLocalDocDatos((prev) => ({ ...prev, [b._dataKey!]: v }));
    }
  }, [readOnly]);

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
        alert('Sin conexión. Tus cambios siguen guardados en el dispositivo y no se perderán; vuelve a pulsar Guardar cuando recuperes señal.');
      } else {
        const e = err as { response?: { data?: { error?: string } } };
        alert(e?.response?.data?.error ?? 'Error al guardar');
      }
    } finally { setIsSaving(false); }
  }, [hasDirty, isSaving, localCompDatos, localDocDatos, informeId, queryClient]);

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
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
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
              <Chip>{sections.length} componentes</Chip>
            </div>
          </div>
          {!finalizado && totals.total > 0 && totals.done === totals.total && (
            <button onClick={onFinalizar} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Finalizar
            </button>
          )}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: `${LIME}30`, backgroundColor: `${LIME}0d`, color: LIME }}>
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>La sección de <strong>Intervención</strong> (cliente, técnico, fechas y horas) se rellena automáticamente.</span>
        </div>
      </div>

      {/* Tarjetas de componente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((s) => {
          const { done, total } = countPoints(s);
          const complete = total > 0 && done === total;
          const Icon = compIcon(s.label);
          return (
            <div key={s.key} className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
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
          <ControlBlock key={b.id} block={b} readOnly={readOnly} value={blockValue(b)} onChange={(v) => onBlockChange(b, v)} />
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
  if (block.type === 'table') return <DarkTable block={block} value={value} readOnly={readOnly} onChange={onChange} />;
  if (['text_field', 'number_field', 'date_field', 'select_field'].includes(block.type)) return <DarkField block={block} value={value} readOnly={readOnly} onChange={onChange} />;
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
function DarkTable({ block, value, readOnly, onChange }: { block: AssembledBlock; value: unknown; readOnly: boolean; onChange: (v: unknown) => void }) {
  const cols = (block.config.columns as Col[]) || [];
  const rows = (value as Row[]) || [];
  const title = (block.config.title as string) || (block.config.label as string) || '';
  const update = (ri: number, key: string, v: unknown) => onChange(rows.map((r, i) => (i === ri ? { ...r, [key]: v } : r)));
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      {title && <div className="border-b border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200">{title}</div>}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>{cols.map((c) => <col key={c.key} style={c.width ? { width: c.width } : undefined} />)}</colgroup>
          <thead>
            <tr className="text-left">{cols.map((c) => <th key={c.key} className="px-3 py-2 text-xs font-medium text-neutral-500">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.length === 0
              ? <tr><td colSpan={Math.max(cols.length, 1)} className="px-3 py-4 text-center text-xs text-neutral-600">Sin filas</td></tr>
              : rows.map((row, ri) => (
                <tr key={ri}>{cols.map((c) => <td key={c.key} className="px-3 py-2 align-top">{darkCell(c, row[c.key], (v) => update(ri, c.key, v), readOnly)}</td>)}</tr>
              ))}
          </tbody>
        </table>
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
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200">{title}</div>
      <div className="overflow-x-auto">
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
                <td className="px-3 py-2 align-top"><AutoTextarea value={typeof row.observaciones === 'string' ? row.observaciones : ''} readOnly={readOnly} onChange={(v) => update(ri, 'observaciones', v)} placeholder="—" className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none" /></td>
              </tr>
            ))}
          </tbody>
        </table>
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
      {block.type === 'select_field' && opts
        ? <select value={String(value ?? '')} disabled={readOnly} onChange={(e) => onChange(e.target.value || null)} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"><option value="">—</option>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : <input type={block.type === 'number_field' ? 'number' : block.type === 'date_field' ? 'date' : 'text'} value={String(value ?? '')} disabled={readOnly} onChange={(e) => onChange(e.target.value || null)} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none" />}
    </div>
  );
}

// ======================== Punto de control (fila con control segmentado) ========================
function InspectionPointRow({
  label, row, readOnly, onChange,
}: { label: string; row: Row; readOnly: boolean; onChange: (next: Row) => void; }) {
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
    </div>
  );
}
