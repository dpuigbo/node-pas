import { useRef, useEffect, useState, useCallback } from 'react';
import { GripVertical, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/useEditorStore';
import { getBlockEntry } from '@/components/blocks/registry';
import { FIELD_WIDTH_CSS, BLOCK_ALIGN_CSS, type FieldWidth, type BlockAlign } from '@/types/editor';
import type { Block } from '@/types/editor';

// A4 dimensions at 96 DPI: 794 x 1123 px
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// Block types that are always full-width
const ALWAYS_FULL_TYPES = new Set([
  'header', 'section_title', 'divider',
  'tristate', 'checklist', 'table',
]);

/** Get the width CSS class for a block based on its type and config */
function getBlockWidthClass(block: Block): string {
  if (ALWAYS_FULL_TYPES.has(block.type)) {
    return 'w-full';
  }
  const width = (block.config.width as FieldWidth) || 'full';
  return FIELD_WIDTH_CSS[width] || 'w-full';
}

function BlockWrapper({
  block,
  index,
  totalBlocks,
}: {
  block: Block;
  index: number;
  totalBlocks: number;
}) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);

  const isSelected = selectedBlockId === block.id;
  const entry = getBlockEntry(block.type);
  const widthClass = getBlockWidthClass(block);
  const isFullWidth = widthClass === 'w-full';

  const [hovered, setHovered] = useState(false);

  if (!entry) {
    return (
      <div className={cn(widthClass, 'p-0.5')}>
        <div className="rounded border border-dashed border-destructive bg-destructive/5 p-4 text-sm text-destructive">
          Bloque desconocido: {block.type}
        </div>
      </div>
    );
  }

  const Preview = entry.EditorPreview;

  return (
    <div
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

export function EditorCanvas() {
  const blocks = useEditorStore((s) => s.blocks);
  const pageConfig = useEditorStore((s) => s.pageConfig);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-scale canvas to fit container
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    // Leave space for padding
    const availableWidth = containerWidth - 80;
    const newScale = Math.min(availableWidth / A4_WIDTH, 1);
    setScale(newScale);
  }, []);

  useEffect(() => {
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateScale]);

  const isPortrait = pageConfig.orientation === 'portrait';
  const canvasWidth = isPortrait ? A4_WIDTH : A4_HEIGHT;
  const canvasMinHeight = isPortrait ? A4_HEIGHT : A4_WIDTH;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-muted/40 p-8"
      onClick={() => selectBlock(null)}
    >
      <div className="flex justify-center">
        <div
          className="bg-white shadow-lg border relative"
          style={{
            width: canvasWidth,
            minHeight: canvasMinHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: `${(canvasMinHeight * scale - canvasMinHeight) * -1}px`,
            padding: `${pageConfig.margins.top * 3.78}px ${pageConfig.margins.right * 3.78}px ${pageConfig.margins.bottom * 3.78}px ${pageConfig.margins.left * 3.78}px`,
            fontSize: `${pageConfig.fontSize}px`,
          }}
        >
          {/* Page break indicator */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-red-200 pointer-events-none z-20"
            style={{ top: canvasMinHeight }}
          >
            <span className="absolute right-2 -top-4 text-[10px] text-red-300 bg-white px-1">
              Corte de pagina
            </span>
          </div>

          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/50">
              <p className="text-lg font-medium">Canvas vacio</p>
              <p className="text-sm mt-1">
                Haz clic en un bloque de la paleta para empezar
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-start pt-2">
              {blocks.map((block, i) => (
                <BlockWrapper
                  key={block.id}
                  block={block}
                  index={i}
                  totalBlocks={blocks.length}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
