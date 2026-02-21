import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInforme, useSaveDatos, useUpdateEstadoInforme } from '@/hooks/useInformes';
import { useAuth } from '@/hooks/useAuth';
import { getBlockEntry } from '@/components/blocks/registry';
import { FIELD_WIDTH_CSS, BLOCK_ALIGN_CSS, type FieldWidth, type BlockAlign } from '@/types/editor';
import type { Block, BlockType } from '@/types/editor';
import type { ComponenteInformeDetalle } from '@/types/informe';

// Ensure all blocks are registered
import '@/components/blocks/register-all';

// ======================== Status badges ========================

const ESTADO_BADGE: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  finalizado: 'bg-amber-100 text-amber-700',
  entregado: 'bg-green-100 text-green-700',
};

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  finalizado: 'Finalizado',
  entregado: 'Entregado',
};

// ======================== Structure block types (no data) ========================

const STRUCTURE_BLOCKS = new Set<BlockType>(['header', 'section_title', 'divider']);

// ======================== Component ========================

export default function InformeFormPage() {
  const { id } = useParams<{ id: string }>();
  const informeId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: informe, isLoading } = useInforme(informeId || undefined);

  // Active tab (componente index)
  const [activeTab, setActiveTab] = useState(0);

  // Local dirty datos per componenteInforme id
  const [localDatos, setLocalDatos] = useState<Record<number, Record<string, unknown>>>({});

  // Track which tabs have unsaved changes
  const dirtyTabs = useMemo(() => {
    const set = new Set<number>();
    if (!informe) return set;
    for (const comp of informe.componentes) {
      if (localDatos[comp.id]) set.add(comp.id);
    }
    return set;
  }, [informe, localDatos]);

  const activeComp: ComponenteInformeDetalle | undefined =
    informe?.componentes?.[activeTab];

  const readOnly = informe?.estado !== 'borrador';

  // Merged datos: server datos + local overrides
  const mergedDatos = useMemo(() => {
    if (!activeComp) return {};
    return {
      ...activeComp.datos,
      ...(localDatos[activeComp.id] ?? {}),
    };
  }, [activeComp, localDatos]);

  // Handle field change
  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      if (!activeComp || readOnly) return;
      setLocalDatos((prev) => ({
        ...prev,
        [activeComp.id]: {
          ...(prev[activeComp.id] ?? {}),
          [key]: value,
        },
      }));
    },
    [activeComp, readOnly],
  );

  // ======================== Loading & error states ========================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!informe) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Informe no encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  const componentes = informe.componentes;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/intervenciones/${informe.intervencionId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">
            {informe.sistema.nombre}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {informe.intervencion.titulo} —{' '}
            {informe.sistema.fabricante.nombre}
          </p>
        </div>
        <Badge
          className={ESTADO_BADGE[informe.estado] ?? 'bg-gray-100 text-gray-700'}
        >
          {ESTADO_LABEL[informe.estado] ?? informe.estado}
        </Badge>
      </div>

      {/* Tabs */}
      {componentes.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b pb-1">
          {componentes.map((comp, idx) => {
            const isActive = idx === activeTab;
            const isDirty = dirtyTabs.has(comp.id);
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-t px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white border border-b-white text-primary shadow-sm -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-gray-50'
                }`}
              >
                {isDirty && (
                  <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                )}
                {comp.etiqueta}
              </button>
            );
          })}
        </div>
      )}

      {/* Active component form */}
      {activeComp && (
        <ComponenteForm
          key={activeComp.id}
          componente={activeComp}
          datos={mergedDatos}
          readOnly={readOnly}
          onFieldChange={handleFieldChange}
          informeId={informeId}
          localDatos={localDatos[activeComp.id]}
          onSaved={() =>
            setLocalDatos((prev) => {
              const next = { ...prev };
              delete next[activeComp.id];
              return next;
            })
          }
        />
      )}

      {/* Admin actions */}
      {isAdmin && informe.estado === 'borrador' && (
        <div className="flex justify-end border-t pt-4">
          <FinalizarButton
            informeId={informeId}
            intervencionId={informe.intervencionId}
          />
        </div>
      )}
    </div>
  );
}

// ======================== Sub-components ========================

interface ComponenteFormProps {
  componente: ComponenteInformeDetalle;
  datos: Record<string, unknown>;
  readOnly: boolean;
  onFieldChange: (key: string, value: unknown) => void;
  informeId: number;
  localDatos: Record<string, unknown> | undefined;
  onSaved: () => void;
}

function ComponenteForm({
  componente,
  datos,
  readOnly,
  onFieldChange,
  informeId,
  localDatos,
  onSaved,
}: ComponenteFormProps) {
  const saveMutation = useSaveDatos(componente.id, informeId);
  const hasDirty = !!localDatos && Object.keys(localDatos).length > 0;

  const handleSave = async () => {
    if (!localDatos || !hasDirty) return;
    try {
      await saveMutation.mutateAsync(localDatos);
      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al guardar';
      alert(msg);
    }
  };

  const blocks = componente.schemaCongelado?.blocks ?? [];

  return (
    <div className="space-y-4">
      {/* Component info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">
            {componente.etiqueta}
          </h2>
          <p className="text-xs text-muted-foreground">
            {componente.componenteSistema.modeloComponente.nombre}
            {componente.componenteSistema.numeroSerie &&
              ` · S/N: ${componente.componenteSistema.numeroSerie}`}
          </p>
        </div>
        {!readOnly && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasDirty || saveMutation.isPending}
            className="gap-1"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar
          </Button>
        )}
      </div>

      {/* Render blocks */}
      <div className="flex flex-wrap items-start gap-y-4">
        {blocks.map((block: Block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            datos={datos}
            readOnly={readOnly}
            onFieldChange={onFieldChange}
          />
        ))}
      </div>
    </div>
  );
}

// ======================== Block Renderer ========================

// Block types that are always full-width in the form layout
const ALWAYS_FULL_TYPES = new Set<BlockType>([
  'header', 'section_title', 'divider',
  'tristate', 'checklist', 'table',
]);

/** Get width CSS class for a block in the form layout */
function getFormBlockWidthClass(block: Block): string {
  if (ALWAYS_FULL_TYPES.has(block.type)) return 'w-full';
  const width = (block.config.width as FieldWidth) || 'full';
  return FIELD_WIDTH_CSS[width] || 'w-full';
}

interface BlockRendererProps {
  block: Block;
  datos: Record<string, unknown>;
  readOnly: boolean;
  onFieldChange: (key: string, value: unknown) => void;
}

function BlockRenderer({ block, datos, readOnly, onFieldChange }: BlockRendererProps) {
  const entry = getBlockEntry(block.type);
  if (!entry) return null;

  const widthClass = getFormBlockWidthClass(block);
  const alignClass = BLOCK_ALIGN_CSS[(block.config.align as BlockAlign) || 'left'];

  // Structure blocks → render EditorPreview as static
  if (STRUCTURE_BLOCKS.has(block.type)) {
    const Preview = entry.EditorPreview;
    return (
      <div className={`${widthClass} ${alignClass} pointer-events-none`}>
        <Preview block={block} isSelected={false} />
      </div>
    );
  }

  // Data blocks → render FormField if available
  const key = block.config.key as string | undefined;
  if (!key) return null;

  const FormFieldComp = entry.FormField;
  if (!FormFieldComp) {
    // Fallback: render EditorPreview as readonly
    const Preview = entry.EditorPreview;
    return (
      <div className={`${widthClass} ${alignClass} pointer-events-none opacity-70`}>
        <Preview block={block} isSelected={false} />
      </div>
    );
  }

  return (
    <div className={`${widthClass} ${alignClass}`}>
      <FormFieldComp
        block={block}
        value={datos[key] ?? null}
        onChange={(v: unknown) => onFieldChange(key, v)}
        readOnly={readOnly}
      />
    </div>
  );
}

// ======================== Finalizar Button ========================

function FinalizarButton({
  informeId,
  intervencionId,
}: {
  informeId: number;
  intervencionId: number;
}) {
  const mutation = useUpdateEstadoInforme(informeId, intervencionId);

  const handleFinalizar = async () => {
    if (
      !window.confirm(
        'Una vez finalizado, los datos del informe no se podran modificar. ¿Continuar?',
      )
    )
      return;
    try {
      await mutation.mutateAsync('finalizado');
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al finalizar';
      alert(msg);
    }
  };

  return (
    <Button
      onClick={handleFinalizar}
      disabled={mutation.isPending}
      variant="default"
      className="gap-1"
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Finalizar informe
    </Button>
  );
}
