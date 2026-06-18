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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useAssembledReport } from '@/hooks/useInformes';
import { getBlockEntry } from '@/components/blocks/registry';
import type { BlockType } from '@/types/editor';
import type { AssembledBlock } from '@/types/informe';

// Ensure all blocks are registered
import '@/components/blocks/register-all';

// ======================== Constants ========================

const ESTADO_BADGE: Record<string, string> = {
  inactivo: 'bg-gray-100 text-gray-700',
  activo: 'bg-blue-100 text-blue-700',
  finalizado: 'bg-green-100 text-green-700',
};
const ESTADO_LABEL: Record<string, string> = {
  inactivo: 'Inactivo', activo: 'Activo', finalizado: 'Finalizado',
};

/** Bloques editables (puntos de control) que el técnico rellena. */
const EDITABLE_TYPES = new Set<string>([
  'table', 'tristate', 'checklist', 'reducer_oils',
  'battery_manipulator', 'battery_controller', 'equipment_exchange',
  'text_field', 'number_field', 'date_field', 'select_field',
  'intervention_data', 'client_data', 'signature',
]);

// ======================== Types ========================

interface WizardSection {
  key: string;
  label: string;
  componenteInformeId?: number;
  blocks: AssembledBlock[];
}

// ======================== Helpers ========================

/** ¿El bloque tiene un valor "relleno" (distinto de vacío/inicial)? Heurística para el progreso. */
function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) {
    // Tablas/listas: relleno si alguna fila tiene algún check/valor de usuario.
    return value.some((row) => {
      if (!row || typeof row !== 'object') return false;
      return Object.entries(row as Record<string, unknown>).some(([k, v]) => {
        if (['eje', 'operacion', 'bateria', 'referencia', 'tipoSuministro', 'unidad', 'volumen', 'niveles'].includes(k)) return false;
        if (v === true) return true;
        if (typeof v === 'string') return v.trim() !== '';
        return false;
      });
    });
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((v) => isFilled(v));
  }
  return Boolean(value);
}

// ======================== Main Component ========================

export default function InformeWizardPage() {
  const { id } = useParams<{ id: string }>();
  const informeId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAssembledReport(informeId || undefined);

  const [localCompDatos, setLocalCompDatos] = useState<Record<number, Record<string, unknown>>>({});
  const [localDocDatos, setLocalDocDatos] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const readOnly =
    data?.informe?.estado === 'finalizado' || data?.informe?.estado === 'inactivo';

  // Agrupa los bloques editables por componente (+ una sección de Intervención).
  const sections = useMemo<WizardSection[]>(() => {
    const blocks = data?.assembled?.blocks ?? [];
    const docBlocks: AssembledBlock[] = [];
    const compOrder: number[] = [];
    const compMap = new Map<number, WizardSection>();

    for (const b of blocks) {
      if (!b._dataKey || !EDITABLE_TYPES.has(b.type)) continue;
      if (b._componenteInformeId) {
        let g = compMap.get(b._componenteInformeId);
        if (!g) {
          g = {
            key: `c${b._componenteInformeId}`,
            label: b._componenteEtiqueta || `Componente ${b._componenteInformeId}`,
            componenteInformeId: b._componenteInformeId,
            blocks: [],
          };
          compMap.set(b._componenteInformeId, g);
          compOrder.push(b._componenteInformeId);
        }
        g.blocks.push(b);
      } else if (b._source === 'document') {
        docBlocks.push(b);
      }
    }

    const result: WizardSection[] = [];
    if (docBlocks.length) result.push({ key: 'doc', label: 'Intervención', blocks: docBlocks });
    for (const cid of compOrder) result.push(compMap.get(cid)!);
    return result;
  }, [data]);

  const activeSection =
    sections.find((s) => s.key === activeKey) ?? sections[0] ?? null;

  // Valor actual de un bloque (local pendiente o el del informe).
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

  // Progreso por sección: nº de bloques con valor relleno / total.
  const sectionProgress = useCallback(
    (s: WizardSection): { done: number; total: number } => {
      let done = 0;
      for (const b of s.blocks) if (isFilled(blockValue(b))) done++;
      return { done, total: s.blocks.length };
    },
    [blockValue],
  );

  const hasDirty =
    Object.values(localCompDatos).some((d) => d && Object.keys(d).length > 0) ||
    Object.keys(localDocDatos).length > 0;

  const handleSave = useCallback(async () => {
    if (!hasDirty || isSaving) return;
    setIsSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const [cid, datos] of Object.entries(localCompDatos)) {
        if (datos && Object.keys(datos).length > 0) {
          promises.push(api.patch(`/v1/componentes-informe/${cid}/datos`, { datos }));
        }
      }
      if (Object.keys(localDocDatos).length > 0) {
        promises.push(api.patch(`/v1/informes/${informeId}/datos-documento`, { datos: localDocDatos }));
      }
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

  // ======================== Loading / error ========================

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* ===== Barra superior ===== */}
      <header className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/informes/${informeId}`)} title="Volver al informe">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="font-semibold truncate text-sm">{informe.sistema?.nombre ?? 'Informe'}</div>
            <Badge className={`${ESTADO_BADGE[informe.estado] ?? ''} text-[10px]`}>
              {ESTADO_LABEL[informe.estado] ?? informe.estado}
            </Badge>
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

      {/* ===== Cuerpo: nav de secciones + contenido ===== */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Navegación de secciones (no-lineal) */}
        <nav className="border-b md:border-b-0 md:border-r bg-background md:w-64 md:shrink-0 md:overflow-y-auto">
          <div className="flex md:flex-col gap-1 overflow-x-auto p-2">
            {sections.map((s) => {
              const { done, total } = sectionProgress(s);
              const complete = total > 0 && done === total;
              const isActive = activeSection?.key === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveKey(s.key)}
                  className={`flex items-center gap-2 whitespace-nowrap md:whitespace-normal rounded-md px-3 py-2 text-left text-sm transition-colors shrink-0 md:w-full ${
                    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] shrink-0 ${
                    complete ? 'bg-green-500 text-white' : isActive ? 'bg-primary-foreground/20' : 'bg-muted-foreground/15'
                  }`}>
                    {complete ? <Check className="h-3 w-3" /> : `${done}`}
                  </span>
                  <span className="flex-1 truncate">{s.label}</span>
                  <span className={`text-[10px] ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {done}/{total}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-40 hidden md:block" />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Contenido de la sección activa */}
        <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5">
          {!activeSection ? (
            <div className="text-center text-muted-foreground py-12">
              No hay puntos de control para rellenar en este informe.
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              <h2 className="text-lg font-bold">{activeSection.label}</h2>
              {activeSection.blocks.map((b) => (
                <WizardControl
                  key={b.id}
                  block={b}
                  value={blockValue(b)}
                  readOnly={readOnly}
                  onChange={(v) => onBlockChange(b, v)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ======================== Renderizado de un punto de control ========================

function WizardControl({
  block,
  value,
  readOnly,
  onChange,
}: {
  block: AssembledBlock;
  value: unknown;
  readOnly: boolean;
  onChange: (v: unknown) => void;
}) {
  const entry = getBlockEntry(block.type as BlockType);
  const FormFieldComp = entry?.FormField;
  if (!FormFieldComp) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <FormFieldComp
        block={block as never}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      />
    </div>
  );
}
