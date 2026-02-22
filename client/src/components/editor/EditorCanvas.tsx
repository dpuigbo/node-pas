import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GripVertical, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/useEditorStore';
import { getBlockEntry } from '@/components/blocks/registry';
import { FIELD_WIDTH_CSS, BLOCK_ALIGN_CSS, DOCUMENT_CHROME_TYPES, DOCUMENT_CHROME_POSITION, type FieldWidth, type BlockAlign } from '@/types/editor';
import type { Block, PageConfig } from '@/types/editor';
import { usePagination } from '@/hooks/usePagination';

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Local arrayMove utility (safe across @dnd-kit versions)
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  const [item] = newArray.splice(from, 1);
  if (item !== undefined) newArray.splice(to, 0, item);
  return newArray;
}

// A4 dimensions at 96 DPI: 794 x 1123 px
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// mm to px conversion factor
const MM_TO_PX = 3.78;

// Block types that are always full-width
const ALWAYS_FULL_TYPES = new Set([
  'header', 'section_title', 'divider',
  'tristate', 'checklist', 'table',
  'section_separator', 'table_of_contents',
  'cover_header', 'page_header', 'page_footer', 'back_cover',
  'page_break', 'content_placeholder', 'intervention_data', 'client_data',
]);

/** Blocks whose vertical alignment is controlled at the page level */
const VERTICALLY_ALIGNABLE = new Set(['intervention_data', 'client_data']);

/** Get the width CSS class for a block based on its type and config */
function getBlockWidthClass(block: Block): string {
  if (ALWAYS_FULL_TYPES.has(block.type)) {
    return 'w-full';
  }
  const width = (block.config.width as FieldWidth) || 'full';
  return FIELD_WIDTH_CSS[width] || 'w-full';
}

// ======================== BlockWrapper (Sortable) ========================

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
  const isChrome = DOCUMENT_CHROME_TYPES.has(block.type);
  const isBackCover = block.type === 'back_cover';
  const entry = getBlockEntry(block.type);
  const widthClass = getBlockWidthClass(block);
  const isFullWidth = widthClass === 'w-full';

  const [hovered, setHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // dnd-kit sortable — disabled for section separators
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    disabled: isSectionSeparator || isChrome,
  });

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // Combined ref: wrapperRef (ResizeObserver) + setNodeRef (dnd-kit)
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

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
      <div ref={combinedRef} style={sortableStyle} className={cn(widthClass, 'p-0.5')}>
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
        ref={combinedRef}
        style={sortableStyle}
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
      ref={combinedRef}
      style={{ ...sortableStyle, padding: isBackCover ? undefined : '1px' }}
      className={cn(widthClass, 'relative group', isBackCover && 'flex-1 flex flex-col')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          'relative rounded-sm transition-all cursor-pointer',
          isBackCover && 'flex-1 flex flex-col',
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
            {/* Drag handle */}
            <button
              className="rounded p-1 text-muted-foreground cursor-grab active:cursor-grabbing"
              title="Arrastrar"
              {...attributes}
              {...listeners}
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
        <div className={cn(
          BLOCK_ALIGN_CSS[(block.config.align as BlockAlign) || 'left'],
          isBackCover && 'flex-1 flex flex-col',
        )}>
          <Preview block={block} isSelected={isSelected} />
        </div>
      </div>
    </div>
  );
}

// ======================== DragPreview ========================

function DragPreview({ block }: { block: Block }) {
  const entry = getBlockEntry(block.type);
  if (!entry) return null;

  const Preview = entry.EditorPreview;
  return (
    <div
      className="bg-white rounded-md shadow-lg border-2 border-primary/30 p-1 max-w-[600px] pointer-events-none"
      style={{ opacity: 0.85 }}
    >
      <Preview block={block} isSelected={false} />
    </div>
  );
}

// ======================== PageSheet ========================

function PageSheet({
  blockIds,
  sectionChromeIds,
  allBlocks,
  pageConfig,
  scale,
  onBlockHeightChange,
}: {
  blockIds: string[];
  sectionChromeIds: string[];
  allBlocks: Block[];
  pageConfig: PageConfig;
  scale: number;
  onBlockHeightChange: (id: string, height: number) => void;
}) {
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const allBlocksCount = allBlocks.length;

  const isPortrait = pageConfig.orientation === 'portrait';
  const canvasWidth = isPortrait ? A4_WIDTH : A4_HEIGHT;
  const canvasHeight = isPortrait ? A4_HEIGHT : A4_WIDTH;

  const marginTop = pageConfig.margins.top * MM_TO_PX;
  const marginRight = pageConfig.margins.right * MM_TO_PX;
  const marginBottom = pageConfig.margins.bottom * MM_TO_PX;
  const marginLeft = pageConfig.margins.left * MM_TO_PX;

  // Build block map for lookups
  const blockMap = useMemo(
    () => new Map(allBlocks.map((b) => [b.id, b])),
    [allBlocks],
  );

  // Find blocks physically on this page
  const pageBlocks = useMemo(
    () => blockIds.map((id) => blockMap.get(id)).filter(Boolean) as Block[],
    [blockIds, blockMap],
  );

  // Find section chrome blocks to inject
  const injectedChromeBlocks = useMemo(
    () => sectionChromeIds.map((id) => blockMap.get(id)).filter(Boolean) as Block[],
    [sectionChromeIds, blockMap],
  );

  // Check if this page has a back_cover (full-page block)
  const hasBackCover = useMemo(
    () => pageBlocks.some((b) => b.type === 'back_cover'),
    [pageBlocks],
  );

  // Split blocks into top-chrome, content, and bottom-chrome
  // Chrome comes from BOTH physical page blocks AND injected section chrome
  const { topChrome, contentBlocks, bottomChrome } = useMemo(() => {
    const top: { block: Block; isInjected: boolean }[] = [];
    const content: Block[] = [];
    const bottom: { block: Block; isInjected: boolean }[] = [];
    const seenIds = new Set<string>();

    // First: injected chrome blocks from the section (these repeat on non-first pages)
    for (const block of injectedChromeBlocks) {
      if (seenIds.has(block.id)) continue;
      seenIds.add(block.id);
      const pos = DOCUMENT_CHROME_POSITION[block.type] || 'top';
      if (pos === 'bottom') {
        bottom.push({ block, isInjected: true });
      } else {
        top.push({ block, isInjected: true });
      }
    }

    // Then: physical blocks on this page
    for (const block of pageBlocks) {
      if (seenIds.has(block.id)) continue;
      seenIds.add(block.id);
      if (DOCUMENT_CHROME_TYPES.has(block.type)) {
        const pos = DOCUMENT_CHROME_POSITION[block.type] || 'top';
        if (pos === 'bottom') {
          bottom.push({ block, isInjected: false });
        } else {
          top.push({ block, isInjected: false });
        }
      } else {
        content.push(block);
      }
    }
    return { topChrome: top, contentBlocks: content, bottomChrome: bottom };
  }, [pageBlocks, injectedChromeBlocks]);

  // Compute global index for each block (for move up/down disabled state)
  const globalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allBlocks.forEach((b, i) => map.set(b.id, i));
    return map;
  }, [allBlocks]);

  // Determine vertical alignment for the content area
  // If any content block has verticalAlign set, use it for the content zone
  const contentVerticalAlign = useMemo(() => {
    for (const b of contentBlocks) {
      if (VERTICALLY_ALIGNABLE.has(b.type)) {
        const align = (b.config.verticalAlign as string) || 'top';
        if (align !== 'top') return align;
      }
    }
    return 'top';
  }, [contentBlocks]);

  // Map vertical alignment to justify-content for the inner flex column wrapper
  const contentJustify =
    contentVerticalAlign === 'center'
      ? 'justify-center'
      : contentVerticalAlign === 'bottom'
        ? 'justify-end'
        : 'justify-start';

  const renderBlock = (block: Block) => {
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
  };

  /** Render a chrome block — either as full BlockWrapper (physical) or simple preview (injected) */
  const renderChromeEntry = (entry: { block: Block; isInjected: boolean }) => {
    if (!entry.isInjected) {
      // Physical — use BlockWrapper for height measurement, selection, toolbar
      return renderBlock(entry.block);
    }
    // Injected — render just the preview (no sortable, no toolbar)
    const blockEntry = getBlockEntry(entry.block.type);
    if (!blockEntry) return null;
    const Preview = blockEntry.EditorPreview;
    return (
      <div key={`injected-${entry.block.id}`} className="w-full">
        <Preview block={entry.block} isSelected={false} />
      </div>
    );
  };

  return (
    <div
      className="bg-white shadow-lg border relative shrink-0 overflow-hidden"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        fontSize: `${pageConfig.fontSize}px`,
        fontFamily: pageConfig.fontFamily ? `"${pageConfig.fontFamily}", sans-serif` : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(null);
      }}
    >
      {pageBlocks.length === 0 && injectedChromeBlocks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-full text-muted-foreground/50"
          style={{ padding: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px` }}
        >
          <p className="text-lg font-medium">Canvas vacio</p>
          <p className="text-sm mt-1">
            Haz clic en un bloque de la paleta para empezar
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Top chrome blocks — edge-to-edge, fixed height (not stretchy) */}
          {topChrome.length > 0 && (
            <div className={hasBackCover ? 'flex flex-col flex-1' : 'shrink-0'}>
              {topChrome.map(renderChromeEntry)}
            </div>
          )}

          {/* Content blocks — with page margins */}
          {!hasBackCover && (
            <div
              className={cn(
                'flex-1 flex flex-col overflow-hidden',
                contentJustify,
              )}
              style={{
                padding: `${topChrome.length > 0 ? 8 : marginTop}px ${marginRight}px ${bottomChrome.length > 0 ? 8 : marginBottom}px ${marginLeft}px`,
              }}
            >
              <div className="flex flex-wrap items-start">
                {contentBlocks.map(renderBlock)}
              </div>
            </div>
          )}

          {/* Bottom chrome blocks — edge-to-edge, pinned to bottom */}
          {bottomChrome.length > 0 && (
            <div className="shrink-0 mt-auto">
              {bottomChrome.map(renderChromeEntry)}
            </div>
          )}
        </div>
      )}

      {/* Page number indicator removed — page numbers are handled by the page_footer block */}
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
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);

  // dnd-kit sensors — distance constraint avoids triggering drag on click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

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

  // Get the section "zone" for a block (between section separators)
  const getSectionZone = useCallback(
    (blockId: string): number => {
      let zone = 0;
      for (const b of blocks) {
        if (b.id === blockId) return zone;
        if (b.type === 'section_separator') zone++;
      }
      return zone;
    },
    [blocks],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const activeBlock = blocks.find((b) => b.id === active.id);
      if (!activeBlock || activeBlock.type === 'section_separator') return;

      // Cannot drop on a section separator
      const overBlock = blocks.find((b) => b.id === over.id);
      if (overBlock?.type === 'section_separator') return;

      // Check source and destination are in the same section zone
      const activeZone = getSectionZone(active.id as string);
      const overZone = getSectionZone(over.id as string);
      if (activeZone !== overZone) return;

      // Compute new order
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      reorderBlocks(newBlocks.map((b) => b.id));
    },
    [blocks, getSectionZone, reorderBlocks],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Compute pages
  const { pages } = usePagination({ blocks, pageConfig, blockHeights });

  const isPortrait = pageConfig.orientation === 'portrait';
  const canvasHeight = isPortrait ? A4_HEIGHT : A4_WIDTH;

  // Active block for DragOverlay
  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  // All block IDs for the single SortableContext
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-muted/40 p-8"
      onClick={() => selectBlock(null)}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={blockIds}
          strategy={verticalListSortingStrategy}
        >
          <div
            className="flex flex-col items-center"
            style={{ gap: `${Math.max(24 * scale, 12)}px` }}
          >
            {pages.map((page) => {
              // Find the separator block if this page starts a section
              const sepBlock = page.sectionSeparatorId
                ? blocks.find((b) => b.id === page.sectionSeparatorId)
                : null;

              return (
                <div key={page.pageIndex} className="flex flex-col items-center w-full" style={{ gap: `${Math.max(16 * scale, 8)}px` }}>
                  {/* Section separator rendered OUTSIDE the page */}
                  {sepBlock && (
                    <BlockWrapper
                      block={sepBlock}
                      index={blocks.findIndex((b) => b.id === sepBlock.id)}
                      totalBlocks={blocks.length}
                      onHeightChange={handleBlockHeightChange}
                    />
                  )}
                  {/* The actual page */}
                  <div
                    style={{
                      height: canvasHeight * scale,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <PageSheet
                      blockIds={page.blockIds}
                      sectionChromeIds={page.sectionChromeIds}
                      allBlocks={blocks}
                      pageConfig={pageConfig}
                      scale={scale}
                      onBlockHeightChange={handleBlockHeightChange}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SortableContext>

        {/* Drag overlay — lightweight preview of the dragged block */}
        <DragOverlay>
          {activeBlock ? <DragPreview block={activeBlock} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
