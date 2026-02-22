/**
 * Shared document page layout that replicates the EditorCanvas PageSheet
 * structure for assembled report rendering.
 *
 * Handles:
 * - Splitting blocks by section_separator into separate page sections
 * - Chrome blocks (cover_header, page_header, page_footer, back_cover)
 *   rendered edge-to-edge WITHOUT page margins
 * - Content blocks rendered WITH page margins
 * - back_cover fills entire page
 * - Component transition indicators between different component blocks
 */

import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { DOCUMENT_CHROME_TYPES, DOCUMENT_CHROME_POSITION } from '@/types/editor';
import type { BlockType } from '@/types/editor';
import type { AssembledBlock } from '@/types/informe';

// ======================== Constants ========================

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const MM_TO_PX = 3.78;

const SECTION_LABELS: Record<string, string> = {
  portada: 'Portada',
  intermedia: 'Contenido',
  contraportada: 'Contraportada',
};

// ======================== Types ========================

interface PageConfig {
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
  fontFamily: string;
}

interface Section {
  separator?: AssembledBlock;
  blocks: AssembledBlock[];
}

interface ChromeSplit {
  topChrome: AssembledBlock[];
  content: AssembledBlock[];
  bottomChrome: AssembledBlock[];
  hasBackCover: boolean;
}

export interface DocumentPageLayoutProps {
  blocks: AssembledBlock[];
  pageConfig: PageConfig;
  /** Render callback for each block. The layout decides WHERE, you decide HOW. */
  renderBlock: (block: AssembledBlock) => React.ReactNode;
}

// ======================== Helpers ========================

/** Split the flat assembled blocks array into sections by section_separator */
function splitIntoSections(blocks: AssembledBlock[]): Section[] {
  const sections: Section[] = [];
  let current: Section = { blocks: [] };

  for (const block of blocks) {
    if (block.type === 'section_separator') {
      // Push current section if it has content or a separator
      if (current.blocks.length > 0 || current.separator) {
        sections.push(current);
      }
      current = { separator: block, blocks: [] };
    } else {
      current.blocks.push(block);
    }
  }

  // Push final section
  if (current.blocks.length > 0 || current.separator) {
    sections.push(current);
  }

  return sections;
}

/** Separate chrome blocks (edge-to-edge) from content blocks (inside margins) */
function splitChromeAndContent(blocks: AssembledBlock[]): ChromeSplit {
  const topChrome: AssembledBlock[] = [];
  const content: AssembledBlock[] = [];
  const bottomChrome: AssembledBlock[] = [];
  let hasBackCover = false;

  for (const block of blocks) {
    if (DOCUMENT_CHROME_TYPES.has(block.type as BlockType)) {
      if (block.type === 'back_cover') hasBackCover = true;
      const pos =
        DOCUMENT_CHROME_POSITION[block.type as keyof typeof DOCUMENT_CHROME_POSITION] ||
        'top';
      if (pos === 'bottom') {
        bottomChrome.push(block);
      } else {
        topChrome.push(block);
      }
    } else {
      content.push(block);
    }
  }

  return { topChrome, content, bottomChrome, hasBackCover };
}

/**
 * Inject component transition indicators into content blocks.
 * Returns a list of ReactNodes with blue separators between component groups.
 */
function renderContentWithTransitions(
  contentBlocks: AssembledBlock[],
  renderBlock: (block: AssembledBlock) => React.ReactNode,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let lastComponenteId: number | undefined;

  for (const block of contentBlocks) {
    // Insert component separator when transitioning between components
    if (
      block._source === 'component' &&
      block._componenteInformeId !== undefined &&
      block._componenteInformeId !== lastComponenteId
    ) {
      lastComponenteId = block._componenteInformeId;
      elements.push(
        <div
          key={`comp-sep-${block._componenteInformeId}`}
          className="w-full flex items-center gap-2 py-2 px-1 my-1"
        >
          <Layers className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-medium text-blue-600">
            {block._componenteEtiqueta}
          </span>
          <div className="flex-1 border-t border-blue-200" />
        </div>,
      );
    }

    elements.push(
      <React.Fragment key={block.id}>{renderBlock(block)}</React.Fragment>,
    );
  }

  return elements;
}

// ======================== Main Component ========================

export function DocumentPageLayout({
  blocks,
  pageConfig,
  renderBlock,
}: DocumentPageLayoutProps) {
  const sections = useMemo(() => splitIntoSections(blocks), [blocks]);

  const isPortrait = pageConfig.orientation === 'portrait';
  const canvasWidth = isPortrait ? A4_WIDTH : A4_HEIGHT;
  const canvasHeight = isPortrait ? A4_HEIGHT : A4_WIDTH;
  const marginTop = pageConfig.margins.top * MM_TO_PX;
  const marginRight = pageConfig.margins.right * MM_TO_PX;
  const marginBottom = pageConfig.margins.bottom * MM_TO_PX;
  const marginLeft = pageConfig.margins.left * MM_TO_PX;

  return (
    <div className="flex flex-col items-center gap-8">
      {sections.map((section, si) => {
        const { topChrome, content, bottomChrome, hasBackCover } =
          splitChromeAndContent(section.blocks);

        return (
          <div key={si} className="flex flex-col items-center w-full gap-3">
            {/* Section separator label (outside page) */}
            {section.separator && (
              <div className="w-full flex items-center gap-2 py-2" style={{ maxWidth: canvasWidth }}>
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {SECTION_LABELS[section.separator.config.section as string] ??
                    (section.separator.config.section as string)}
                </span>
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              </div>
            )}

            {/* Page container — A4 sized */}
            <div
              className="bg-white shadow-lg border overflow-hidden"
              style={{
                width: canvasWidth,
                minHeight: canvasHeight,
                fontSize: `${pageConfig.fontSize}px`,
                fontFamily: pageConfig.fontFamily
                  ? `"${pageConfig.fontFamily}", sans-serif`
                  : undefined,
              }}
            >
              <div
                className="flex flex-col"
                style={{ minHeight: canvasHeight }}
              >
                {/* ===== Top chrome — edge-to-edge, no margins ===== */}
                {topChrome.length > 0 && (
                  <div
                    className={
                      hasBackCover ? 'flex flex-col flex-1' : 'shrink-0'
                    }
                  >
                    {topChrome.map((b) => (
                      <div
                        key={b.id}
                        className={`w-full ${hasBackCover && b.type === 'back_cover' ? 'flex-1 flex flex-col' : ''}`}
                      >
                        {renderBlock(b)}
                      </div>
                    ))}
                  </div>
                )}

                {/* ===== Content — with page margins ===== */}
                {!hasBackCover && content.length > 0 && (
                  <div
                    style={{
                      flex: '1 1 0%',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: `${topChrome.length > 0 ? 8 : marginTop}px ${marginRight}px ${bottomChrome.length > 0 ? 8 : marginBottom}px ${marginLeft}px`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                      }}
                    >
                      {renderContentWithTransitions(content, renderBlock)}
                    </div>
                  </div>
                )}

                {/* ===== Bottom chrome — edge-to-edge, pinned to bottom ===== */}
                {bottomChrome.length > 0 && (
                  <div className="shrink-0 mt-auto">
                    {bottomChrome.map((b) => (
                      <div key={b.id} className="w-full">
                        {renderBlock(b)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
