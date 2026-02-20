import { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, GripVertical, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/useEditorStore';
import { getBlockEntry } from '@/components/blocks/registry';
import type { Block } from '@/types/editor';

// A4 dimensions at 96 DPI: 794 x 1123 px
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

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

  const [hovered, setHovered] = useState(false);

  if (!entry) {
    return (
      <div className="rounded border border-dashed border-destructive bg-destructive/5 p-4 text-sm text-destructive">
        Bloque desconocido: {block.type}
      </div>
    );
  }

  const Preview = entry.EditorPreview;

  return (
    <>
      <div
        className={cn(
          'group relative rounded-sm transition-all',
          isSelected && 'ring-2 ring-primary ring-offset-1',
          !isSelected && hovered && 'ring-1 ring-primary/30',
        )}
        onClick={(e) => {
          e.stopPropagation();
          selectBlock(block.id);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Block controls on hover */}
        {(hovered || isSelected) && (
          <div className="absolute -left-10 top-0 flex flex-col gap-0.5 z-10">
            <button
              className="rounded p-1 hover:bg-accent text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
              disabled={index === 0}
              title="Mover arriba"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <div className="rounded p-1 text-muted-foreground cursor-grab">
              <GripVertical className="h-3 w-3" />
            </div>
            <button
              className="rounded p-1 hover:bg-accent text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
              disabled={index === totalBlocks - 1}
              title="Mover abajo"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Block actions on hover */}
        {(hovered || isSelected) && (
          <div className="absolute -right-10 top-0 flex flex-col gap-0.5 z-10">
            <button
              className="rounded p-1 hover:bg-accent text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
              title="Duplicar"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              className="rounded p-1 hover:bg-destructive/10 text-destructive"
              onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Block preview */}
        <Preview block={block} isSelected={isSelected} />
      </div>

      {/* Insert button between blocks */}
      <div className="flex justify-center py-0.5 opacity-0 hover:opacity-100 transition-opacity">
        <button
          className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Insert at next position — will open palette or just add a placeholder
            // For now, we don't auto-add, user uses palette
          }}
          title="Insertar bloque aqui"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </>
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
    // Leave space for block controls (40px each side) + padding
    const availableWidth = containerWidth - 120;
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
            <div className="space-y-0">
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
