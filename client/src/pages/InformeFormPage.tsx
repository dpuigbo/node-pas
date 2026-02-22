import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Circle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import {
  useAssembledReport,
  useUpdateEstadoInforme,
} from '@/hooks/useInformes';
import { useAuth } from '@/hooks/useAuth';
import { getBlockEntry } from '@/components/blocks/registry';
import { FIELD_WIDTH_CSS, BLOCK_ALIGN_CSS } from '@/types/editor';
import type { BlockType, FieldWidth, BlockAlign } from '@/types/editor';
import type { AssembledBlock } from '@/types/informe';
import { DocumentPageLayout } from '@/components/DocumentPageLayout';

// Ensure all blocks are registered
import '@/components/blocks/register-all';

// ======================== Constants ========================

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

/** Blocks that always render full-width */
const ALWAYS_FULL_TYPES = new Set<string>([
  'header', 'section_title', 'divider', 'section_separator',
  'tristate', 'checklist', 'table', 'equipment_exchange',
  'cover_header', 'page_header', 'page_footer', 'back_cover',
  'table_of_contents', 'page_break', 'intervention_data', 'client_data',
]);

/** Structure blocks rendered via EditorPreview (read-only) */
const STRUCTURE_BLOCKS = new Set<string>([
  'header', 'section_title', 'divider', 'section_separator',
  'cover_header', 'page_header', 'page_footer', 'back_cover',
  'table_of_contents', 'page_break', 'content_placeholder',
  'intervention_data', 'client_data', 'component_section',
]);

// ======================== Main Component ========================

export default function InformeFormPage() {
  const { id } = useParams<{ id: string }>();
  const informeId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useAssembledReport(informeId || undefined);

  // Local dirty datos per componenteInforme id
  const [localDatos, setLocalDatos] = useState<Record<number, Record<string, unknown>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const readOnly = data?.informe?.estado !== 'borrador';

  // Check if any component has unsaved changes
  const hasDirtyChanges = useMemo(
    () => Object.values(localDatos).some((d) => d && Object.keys(d).length > 0),
    [localDatos],
  );

  // Get unique dirty component IDs
  const dirtyComponentIds = useMemo(
    () => Object.entries(localDatos)
      .filter(([, d]) => d && Object.keys(d).length > 0)
      .map(([id]) => Number(id)),
    [localDatos],
  );

  // Handle field change: routes to correct componenteInforme
  const handleFieldChange = useCallback(
    (componenteInformeId: number, key: string, value: unknown) => {
      if (readOnly) return;
      setLocalDatos((prev) => ({
        ...prev,
        [componenteInformeId]: {
          ...(prev[componenteInformeId] ?? {}),
          [key]: value,
        },
      }));
    },
    [readOnly],
  );

  // Save all dirty component datos in parallel
  const handleSaveAll = useCallback(async () => {
    if (!hasDirtyChanges || isSaving) return;
    setIsSaving(true);
    try {
      const promises = dirtyComponentIds.map(async (compId) => {
        const datos = localDatos[compId];
        if (!datos || Object.keys(datos).length === 0) return;
        await api.patch(`/v1/componentes-informe/${compId}/datos`, { datos });
      });
      await Promise.all(promises);
      setLocalDatos({});
      // Refresh assembled report to get updated datos
      queryClient.invalidateQueries({ queryKey: ['informes', informeId, 'assembled'] });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al guardar';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  }, [hasDirtyChanges, isSaving, dirtyComponentIds, localDatos, queryClient, informeId]);

  // Block render callback for DocumentPageLayout
  const renderBlock = useCallback(
    (block: AssembledBlock) => {
      return (
        <FormBlockRenderer
          block={block}
          localDatos={localDatos}
          readOnly={readOnly}
          onFieldChange={handleFieldChange}
        />
      );
    },
    [localDatos, readOnly, handleFieldChange],
  );

  // ======================== Loading & error states ========================

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          {(error as Error)?.message || 'No se pudo cargar el informe'}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  const { informe, assembled, documentTemplate } = data;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex h-14 items-center justify-between border-b bg-background px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/intervenciones/${informe.intervencion.id}`)}
            title="Volver a intervencion"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{informe.sistema.nombre}</span>
            <Badge className="bg-blue-100 text-blue-800">
              {documentTemplate.nombre}
            </Badge>
            <Badge className={ESTADO_BADGE[informe.estado] ?? 'bg-gray-100 text-gray-700'}>
              {ESTADO_LABEL[informe.estado] ?? informe.estado}
            </Badge>
            {hasDirtyChanges && (
              <span className="text-xs text-amber-600 font-medium">
                <Circle className="inline h-2 w-2 fill-amber-500 text-amber-500 mr-1" />
                Sin guardar
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/informes/${informeId}/preview`)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            Vista previa
          </Button>

          {!readOnly && (
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={!hasDirtyChanges || isSaving}
              className="gap-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
              {dirtyComponentIds.length > 0 && ` (${dirtyComponentIds.length})`}
            </Button>
          )}

          {isAdmin && informe.estado === 'borrador' && (
            <FinalizarButton
              informeId={informeId}
              intervencionId={informe.intervencion.id}
              disabled={hasDirtyChanges}
            />
          )}
        </div>
      </div>

      {/* Assembled document form — uses proper page layout */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="py-8 px-4">
          <DocumentPageLayout
            blocks={assembled.blocks}
            pageConfig={assembled.pageConfig}
            renderBlock={renderBlock}
          />
        </div>
      </div>
    </div>
  );
}

// ======================== Block Renderer ========================

interface FormBlockRendererProps {
  block: AssembledBlock;
  localDatos: Record<number, Record<string, unknown>>;
  readOnly: boolean;
  onFieldChange: (componenteInformeId: number, key: string, value: unknown) => void;
}

function FormBlockRenderer({
  block,
  localDatos,
  readOnly,
  onFieldChange,
}: FormBlockRendererProps) {
  const entry = getBlockEntry(block.type as BlockType);
  if (!entry) return null;

  const widthClass = getFormBlockWidthClass(block);
  const alignClass = BLOCK_ALIGN_CSS[(block.config.align as BlockAlign) || 'left'];

  // Structure blocks → render EditorPreview as static
  if (STRUCTURE_BLOCKS.has(block.type)) {
    const Preview = entry.EditorPreview;
    return (
      <div className={`${widthClass} ${alignClass} pointer-events-none`}>
        <Preview block={block as any} isSelected={false} />
      </div>
    );
  }

  // Data blocks from components → editable FormField
  const FormFieldComp = entry.FormField;
  if (FormFieldComp && block._dataKey && block._componenteInformeId) {
    // Get current value: local override > assembled value (from server datos + resolved)
    const compLocalDatos = localDatos[block._componenteInformeId];
    const value = compLocalDatos?.[block._dataKey] !== undefined
      ? compLocalDatos[block._dataKey]
      : block._dataValue ?? null;

    return (
      <div className={`${widthClass} ${alignClass}`}>
        <FormFieldComp
          block={block as any}
          value={value}
          onChange={(v: unknown) =>
            onFieldChange(block._componenteInformeId!, block._dataKey!, v)
          }
          readOnly={readOnly}
        />
      </div>
    );
  }

  // Fallback: render EditorPreview
  const Preview = entry.EditorPreview;
  return (
    <div className={`${widthClass} ${alignClass} pointer-events-none`}>
      <Preview block={block as any} isSelected={false} />
    </div>
  );
}

// ======================== Helpers ========================

function getFormBlockWidthClass(block: AssembledBlock): string {
  if (ALWAYS_FULL_TYPES.has(block.type)) return 'w-full';
  const width = (block.config.width as FieldWidth) || 'full';
  return FIELD_WIDTH_CSS[width] || 'w-full';
}

// ======================== Finalizar Button ========================

function FinalizarButton({
  informeId,
  intervencionId,
  disabled,
}: {
  informeId: number;
  intervencionId: number;
  disabled: boolean;
}) {
  const mutation = useUpdateEstadoInforme(informeId, intervencionId);

  const handleFinalizar = async () => {
    if (
      !window.confirm(
        'Una vez finalizado, los datos del informe no se podran modificar. \u00bfContinuar?',
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
      disabled={mutation.isPending || disabled}
      variant="default"
      className="gap-1"
      title={disabled ? 'Guarda los cambios antes de finalizar' : undefined}
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Finalizar
    </Button>
  );
}
