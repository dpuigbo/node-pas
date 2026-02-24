import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssembledReport } from '@/hooks/useInformes';
import { getBlockEntry } from '@/components/blocks/registry';
import { FIELD_WIDTH_CSS, BLOCK_ALIGN_CSS } from '@/types/editor';
import type { BlockType, FieldWidth, BlockAlign } from '@/types/editor';
import type { AssembledBlock } from '@/types/informe';
import { DocumentPageLayout } from '@/components/DocumentPageLayout';
import { AssembledTableOfContents } from '@/components/AssembledTableOfContents';

// Ensure all blocks are registered
import '@/components/blocks/register-all';

// ======================== Constants ========================

const ESTADO_BADGE: Record<string, string> = {
  inactivo: 'bg-gray-100 text-gray-700',
  activo: 'bg-blue-100 text-blue-700',
  finalizado: 'bg-green-100 text-green-700',
};

const ESTADO_LABEL: Record<string, string> = {
  inactivo: 'Inactivo',
  activo: 'Activo',
  finalizado: 'Finalizado',
};

/** Structure blocks rendered via EditorPreview */
const STRUCTURE_BLOCKS = new Set<string>([
  'header', 'section_title', 'divider', 'section_separator',
  'cover_header', 'page_header', 'page_footer', 'back_cover',
  'table_of_contents', 'page_break', 'content_placeholder',
  'component_section',
]);

/** Blocks that always render full-width */
const ALWAYS_FULL_TYPES = new Set<string>([
  'header', 'section_title', 'divider', 'section_separator',
  'tristate', 'checklist', 'table', 'equipment_exchange', 'reducer_oils',
  'battery_manipulator', 'battery_controller',
  'cover_header', 'page_header', 'page_footer', 'back_cover',
  'table_of_contents', 'page_break', 'intervention_data', 'client_data',
]);

// ======================== Main Component ========================

export default function InformePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const informeId = Number(id);
  const navigate = useNavigate();

  const { data, isLoading, error } = useAssembledReport(informeId || undefined);

  // Block render callback — all blocks are read-only in preview
  const allBlocks = data?.assembled?.blocks;
  const renderBlock = useCallback(
    (block: AssembledBlock) => {
      // Table of contents uses standalone component (editor store not available)
      if (block.type === 'table_of_contents' && allBlocks) {
        return (
          <div className="w-full pointer-events-none">
            <AssembledTableOfContents block={block} allBlocks={allBlocks} />
          </div>
        );
      }
      return <PreviewBlockRenderer block={block} />;
    },
    [allBlocks],
  );

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
          {(error as Error)?.message || 'No se pudo cargar el informe ensamblado'}
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
            onClick={() => navigate(`/informes/${informeId}`)}
            title="Volver al formulario"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{informe.sistema.nombre}</span>
            <Badge className="bg-blue-100 text-blue-800">
              {documentTemplate.nombre}
            </Badge>
            <Badge className={ESTADO_BADGE[informe.estado] ?? 'bg-gray-100 text-gray-700'}>
              {ESTADO_LABEL[informe.estado] ?? informe.estado}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/informes/${informeId}`)}
          >
            <FileText className="h-4 w-4 mr-1" />
            Formulario
          </Button>
        </div>
      </div>

      {/* Document canvas — uses proper page layout */}
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

// ======================== Block Renderer (read-only) ========================

function PreviewBlockRenderer({ block }: { block: AssembledBlock }) {
  const entry = getBlockEntry(block.type as BlockType);
  if (!entry) return null;

  const widthClass = getBlockWidthClass(block);
  const alignClass = BLOCK_ALIGN_CSS[(block.config.align as BlockAlign) || 'left'];

  const isBackCover = block.type === 'back_cover';
  const flexFill = isBackCover ? 'flex-1 flex flex-col' : '';

  // Structure blocks → render EditorPreview as static
  if (STRUCTURE_BLOCKS.has(block.type)) {
    const Preview = entry.EditorPreview;
    return (
      <div className={`${widthClass} ${alignClass} pointer-events-none ${flexFill}`}>
        <Preview block={block as any} isSelected={false} />
      </div>
    );
  }

  // Data blocks → render FormField with value if available (read-only)
  const FormFieldComp = entry.FormField;
  if (FormFieldComp && block._dataKey) {
    return (
      <div className={`${widthClass} ${alignClass}`}>
        <FormFieldComp
          block={block as any}
          value={block._dataValue ?? null}
          onChange={() => {}} // Read-only, no-op
          readOnly={true}
        />
      </div>
    );
  }

  // Fallback: render EditorPreview
  const Preview = entry.EditorPreview;
  return (
    <div className={`${widthClass} ${alignClass} pointer-events-none ${flexFill}`}>
      <Preview block={block as any} isSelected={false} />
    </div>
  );
}

// ======================== Helpers ========================

function getBlockWidthClass(block: AssembledBlock): string {
  if (ALWAYS_FULL_TYPES.has(block.type)) return 'w-full';
  const width = (block.config.width as FieldWidth) || 'full';
  return FIELD_WIDTH_CSS[width] || 'w-full';
}
