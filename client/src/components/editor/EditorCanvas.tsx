import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GripVertical, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/useEditorStore';
import { getBlockEntry } from '@/components/blocks/registry';
import { FIELD_WIDTH_CSS, BLOCK_ALIGN_CSS, type FieldWidth, type BlockAlign } from '@/types/editor';
import type { Block } from '@/types/editor';
import { usePagination } from '@/hooks/usePagination';

// A4 dimensions at 96 DPI: 794 x 1123 px
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// mm to px conversion factor
const MM_TO_PX = 3.78;

// Block types that are always full-width
const ALWAYS_FULL_TYPES = new Set([
  'header', 'section_title', 'divider',
  'tristate', 'checklist', 'table',
  'section_separator',
]);

/** Get the width CSS class for a block based on its type and config */
function getBlockWidthClass(block: Block): string {
  if (ALWAYS_FULL_TYPES.has(block.type)) {
    return 'w-full';
  }
  const width = (block.config.width as FieldWidth) || 'full';
  return FIELD_WIDTH_CSS[width] || 'w-full';
}

// ======================== BlockWrapper ========================

function BlockWrapper({
  block,
  index,
  totalBlocks,
  onHeightChange,
}: {
  block: Block;
  index: number;
  totalBlocks: number;
  onHeightChange: (id: string, height: number) => void;
}) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);

  const isSelected = selectedBlockId === block.id;
  const isSectionSeparator = block.type === 'section_separator';
  const entry = getBlockEntry(block.type);
  const widthClass = getBlockWidthClass(block);
  const isFullWidth = widthClass === 'w-full';

  const [hovered, setHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Measure block height and report to parent
  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const e of entries) {
        onHeightChange(block.id, e.contentRect.height);
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [block.id, onHeightChange]);

  if (!entry) {
    return (
      <div ref={wrapperRef} className={cn(widthClass, 'p-0.5')}>
        <div className="rounded border border-dashed border-destructive bg-destructive/5 p-4 text-sm text-destructive">
          Bloque desconocido: {block.type}
        </div>
      </div>
    );
  }

  const Preview = entry.EditorPreview;

  // Section separator: special rendering, no toolbar, but selectable
  if (isSectionSeparator) {
    return (
      <div
        ref={wrapperRef}
        className={cn(
          'w-full cursor-pointer rounded-sm transition-all',
          isSelected && 'ring-2 ring-primary ring-offset-1',
        )}
        onClick={(e) => {
          e.stopPropagation();
          selectBlock(block.id);
        }}
      >
        <Preview block={block} isSelected={isSelected} />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(widthClass, 'relative group')}
      style={{ padding: '1px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          'relative rounded-sm transition-all cursor-pointer',
          isSelected && 'ring-2 ring-primary ring-offset-1',
          !isSelected && hovered && 'ring-1 ring-primary/30',
        )}
        onClick={(e) => {
          e.stopPropagation();
          selectBlock(block.id);
        }}
      >
        {/* Floating toolbar on hover/selected */}
        {(hovered || isSelected) && (
          <div
            className={cn(
              'absolute z-20 flex items-center gap-0.5 rounded-md border bg-background/95 shadow-sm backdrop-blur-sm px-1 py-0.5',
              isFullWidth
                ? '-top-7 right-2'
                : '-top-7 left-1/2 -translate-x-1/2',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="rounded p-1 hover:bg-accent text-muted-foreground disabled:opacity-30"
              onClick={() => moveBlock(block.id, 'up')}
              disabled={index === 0}
              title="Mover arriba"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              className="rounded p-1 text-muted-foreground cursor-grab"
              title="Arrastrar"
            >
              <GripVertical className="h-3 w-3" />
            </button>
            <button
              className="rounded p-1 hover:bg-accent text-muted-foreground disabled:opacity-30"
              onClick={() => moveBlock(block.id, 'down')}
              disabled={index === totalBlocks - 1}
              title="Mover abajo"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <button
              className="rounded p-1 hover:bg-accent text-muted-foreground"
              onClick={() => duplicateBlock(block.id)}
              title="Duplicar"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              className="rounded p-1 hover:bg-destructive/10 text-destructive"
              onClick={() => removeBlock(block.id)}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Block preview with alignment */}
        <div className={BLOCK_ALIGN_CSS[(block.config.align as BlockAlign) || 'left']}>
          <Preview block={block} isSelected={isSelected} />
        </div>
      </div>
    </div>
  );
}

// ======================== PageSheet ========================

function PageSheet({
  pageIndex,
  totalPages,
  blockIds,
  allBlocks,
  pageConfig,
  scale,
  onBlockHeightChange,
}: {
  pageIndex: number;
  totalPages: number;
  blockIds: string[];
  allBlocks: Block[];
  pageConfig: import('@/types/editor').PageConfig;
  scale: number;
  onBlockHeightChange: (id: string, height: number) => void;
}) {
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const allBlocksCount = allBlocks.length;

  const isPortrait = pageConfig.orientation === 'portrait';
  const canvasWidth = isPortrait ? A4_WIDTH : A4_HEIGHT;
  const canvasHeight = isPortrait ? A4_HEIGHT : A4_WIDTH;

  // Find blocks for this page
  const pageBlocks = useMemo(() => {
    const blockMap = new Map(allBlocks.map((b) => [b.id, b]));
    return blockIds.map((id) => blockMap.get(id)).filter(Boolean) as Block[];
  }, [blockIds, allBlocks]);

  // Compute global index for each block (for move up/down disabled state)
  const globalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allBlocks.forEach((b, i) => map.set(b.id, i));
    return map;
  }, [allBlocks]);

  return (
    <div
      className="bg-white shadow-lg border relative shrink-0"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        padding: `${pageConfig.margins.top * MM_TO_PX}px ${pageConfig.margins.right * MM_TO_PX}px ${pageConfig.margins.bottom * MM_TO_PX}px ${pageConfig.margins.left * MM_TO_PX}px`,
        fontSize: `${pageConfig.fontSize}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(null);
      }}
    >
      {pageBlocks.length === 0 && pageIndex === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
          <p className="text-lg font-medium">Canvas vacio</p>
          <p className="text-sm mt-1">
            Haz clic en un bloque de la paleta para empezar
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-start content-start overflow-hidden">
          {pageBlocks.map((block) => {
            const globalIdx = globalIndexMap.get(block.id) ?? 0;
            return (
              <BlockWrapper
                key={block.id}
                block={block}
                index={globalIdx}
                totalBlocks={allBlocksCount}
                onHeightChange={onBlockHeightChange}
              />
            );
          })}
        </div>
      )}

      {/* Page number indicator */}
      <div className="absolute bottom-2 right-4 text-[10px] text-gray-300 pointer-events-none">
        Pagina {pageIndex + 1} / {totalPages}
      </div>
    </div>
  );
}

// ======================== EditorCanvas ========================

export function EditorCanvas() {
  const blocks = useEditorStore((s) => s.blocks);
  const pageConfig = useEditorStore((s) => s.pageConfig);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const blockHeights = useEditorStore((s) => s.blockHeights);
  const setBlockHeight = useEditorStore((s) => s.setBlockHeight);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Height change handler — divide by scale to get unscaled height
  const handleBlockHeightChange = useCallback(
    (id: string, height: number) => {
      const unscaled = scale > 0 ? Math.round(height / scale) : height;
      setBlockHeight(id, unscaled);
    },
    [scale, setBlockHeight],
  );

  // Auto-scale canvas to fit container
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const isPortrait = pageConfig.orientation === 'portrait';
    const canvasWidth = isPortrait ? A4_WIDTH : A4_HEIGHT;
    const availableWidth = containerWidth - 80;
    const newScale = Math.min(availableWidth / canvasWidth, 1);
    setScale(newScale);
  }, [pageConfig.orientation]);

  useEffect(() => {
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateScale]);

  // Compute pages
  const { pages, totalPages } = usePagination({ blocks, pageConfig, blockHeights });

  const isPortrait = pageConfig.orientation === 'portrait';
  const canvasHeight = isPortrait ? A4_HEIGHT : A4_WIDTH;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-muted/40 p-8"
      onClick={() => selectBlock(null)}
    >
      <div
        className="flex flex-col items-center"
        style={{ gap: `${Math.max(24 * scale, 12)}px` }}
      >
        {pages.map((page) => (
          <div
            key={page.pageIndex}
            style={{
              height: canvasHeight * scale,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <PageSheet
              pageIndex={page.pageIndex}
              totalPages={totalPages}
              blockIds={page.blockIds}
              allBlocks={blocks}
              pageConfig={pageConfig}
              scale={scale}
              onBlockHeightChange={handleBlockHeightChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
