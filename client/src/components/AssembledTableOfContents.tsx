/**
 * Table of Contents component for assembled reports.
 *
 * The editor's table_of_contents EditorPreview uses useEditorStore + usePagination
 * which only works inside the editor context. This standalone component scans
 * the assembled blocks array for section_title blocks and renders the ToC
 * without needing the editor store.
 *
 * Since the assembled report view doesn't paginate by block heights, page
 * numbers correspond to section pages (portada=1, intermedia=2+, etc.) rather
 * than physical A4 overflow pages.
 */

import { useMemo } from 'react';
import { List } from 'lucide-react';
import type { AssembledBlock } from '@/types/informe';

interface AssembledTableOfContentsProps {
  /** The table_of_contents block (for config like title) */
  block: AssembledBlock;
  /** All assembled blocks — scanned for section_title entries */
  allBlocks: AssembledBlock[];
}

interface TocEntry {
  label: string;
  title: string;
  level: number;
  pageNumber: number;
}

export function AssembledTableOfContents({
  block,
  allBlocks,
}: AssembledTableOfContentsProps) {
  const title = (block.config.title as string) || 'Tabla de contenidos';

  const entries = useMemo(() => {
    const result: TocEntry[] = [];
    let pageNumber = 1;
    let c1 = 0, c2 = 0, c3 = 0;
    let lastH1Title = '';

    for (const b of allBlocks) {
      // section_separator and page_break advance the page count
      if (b.type === 'section_separator' || b.type === 'page_break') {
        pageNumber++;
        continue;
      }

      if (b.type === 'section_title') {
        const level = (b.config.level as number) || 1;
        let label: string;
        if (level <= 1) { c1++; c2 = 0; c3 = 0; label = `${c1}`; lastH1Title = (b.config.title as string) || ''; }
        else if (level === 2) { c2++; c3 = 0; label = `${c1}.${c2}`; }
        else { c3++; label = `${c1}.${c2}.${c3}`; }
        result.push({
          label,
          title: (b.config.title as string) || '',
          level,
          pageNumber,
        });
      } else if ((b.type === 'table' || b.type === 'reducer_oils') && b.config.title) {
        // El titulo de la tabla actua como subseccion (X.1, X.2...), salvo que
        // coincida con el H1 inmediatamente anterior (evita el duplicado).
        const tTitle = (b.config.title as string) || '';
        if (tTitle && tTitle !== lastH1Title) {
          c2++; c3 = 0;
          result.push({ label: `${c1}.${c2}`, title: tTitle, level: 2, pageNumber });
        }
      }
    }

    return result;
  }, [allBlocks]);

  return (
    <div className="py-4 px-2">
      {/* Title */}
      <h3 className="text-base font-bold mb-4">{title}</h3>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <List className="h-4 w-4" />
          <p className="text-xs italic">
            No hay titulos de seccion en el documento
          </p>
        </div>
      ) : (
        <div className="space-y-2 pl-4 pr-2">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-baseline gap-2"
              style={{
                paddingLeft: entry.level > 1 ? `${(entry.level - 1) * 16}px` : 0,
              }}
            >
              <span className="font-semibold text-sm shrink-0 w-8 text-right">
                {entry.label}
              </span>
              <span className="font-medium text-sm truncate">
                {entry.title}
              </span>
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
