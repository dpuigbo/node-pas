import { List } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { useEditorStore } from '@/stores/useEditorStore';
import { usePagination } from '@/hooks/usePagination';

export function EditorPreview({ block }: EditorPreviewProps) {
  const title = (block.config.title as string) || 'Tabla de contenidos';

  // Read blocks and pagination state from the store
  const blocks = useEditorStore((s) => s.blocks);
  const pageConfig = useEditorStore((s) => s.pageConfig);
  const blockHeights = useEditorStore((s) => s.blockHeights);

  // Compute pagination to get page numbers
  const { pages } = usePagination({ blocks, pageConfig, blockHeights });

  // Build a map: blockId -> pageNumber (1-based)
  const blockPageMap = new Map<string, number>();
  for (const page of pages) {
    for (const bid of page.blockIds) {
      blockPageMap.set(bid, page.pageIndex + 1);
    }
  }

  // Collect all section_title blocks in order
  const sectionTitles = blocks
    .filter((b) => b.type === 'section_title')
    .map((b, idx) => ({
      number: idx + 1,
      title: (b.config.title as string) || '',
      level: (b.config.level as number) || 1,
      pageNumber: blockPageMap.get(b.id) ?? '—',
    }));

  return (
    <div className="py-4 px-2">
      {/* Title */}
      <h3 className="text-base font-bold mb-4">{title}</h3>

      {/* Entries */}
      {sectionTitles.length === 0 ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <List className="h-4 w-4" />
          <p className="text-xs italic">
            No hay titulos de seccion en la plantilla
          </p>
        </div>
      ) : (
        <div className="space-y-2 pl-4 pr-2">
          {sectionTitles.map((entry) => (
            <div
              key={entry.number}
              className="flex items-baseline gap-2"
              style={{ paddingLeft: entry.level > 1 ? `${(entry.level - 1) * 16}px` : 0 }}
            >
              <span className="font-semibold text-sm shrink-0 w-5 text-right">
                {entry.number}
              </span>
              <span className="font-medium text-sm truncate">{entry.title}</span>
              <span className="flex-1 border-b border-dotted border-gray-300 min-w-[20px] self-end mb-0.5" />
              <span className="text-sm text-muted-foreground shrink-0 font-medium">
                {entry.pageNumber}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
