/**
 * Shared document page layout that replicates the EditorCanvas PageSheet
 * structure for assembled report rendering.
 *
 * Handles:
 * - Splitting blocks by section_separator into separate page sections
 * - page_break blocks create new page containers within a section
 * - Chrome blocks (cover_header, page_header, page_footer, back_cover)
 *   rendered edge-to-edge WITHOUT page margins, repeated on every sub-page
 * - Content blocks rendered WITH page margins
 * - Vertically alignable blocks (intervention_data, client_data) as direct
 *   flex-col children for independent vertical positioning
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

/** Blocks whose vertical alignment is controlled at the page level */
const VERTICALLY_ALIGNABLE = new Set<string>(['intervention_data', 'client_data']);

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

/** A group of normal blocks rendered inside a flex-wrap row */
interface GroupSegment {
  type: 'group';
  blocks: AssembledBlock[];
}

/** A vertically alignable block rendered as a direct flex-col child */
interface AlignableSegment {
  type: 'alignable';
  block: AssembledBlock;
}

type ContentSegment = GroupSegment | AlignableSegment;

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
      if (current.blocks.length > 0 || current.separator) {
        sections.push(current);
      }
      current = { separator: block, blocks: [] };
    } else {
      current.blocks.push(block);
    }
  }

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

/** Split content blocks by page_break into sub-pages */
function splitByPageBreak(content: AssembledBlock[]): AssembledBlock[][] {
  const pages: AssembledBlock[][] = [];
  let current: AssembledBlock[] = [];

  for (const block of content) {
    if (block.type === 'page_break') {
      // page_break ends current page, start a new one
      pages.push(current);
      current = [];
    } else {
      current.push(block);
    }
  }

  // Push final page (even if empty, to ensure at least one page)
  if (current.length > 0 || pages.length === 0) {
    pages.push(current);
  }

  return pages;
}

/**
 * Split content blocks into segments: groups of normal blocks (rendered in
 * flex-wrap rows) interleaved with vertically alignable blocks (direct
 * children of flex-col for independent vertical positioning).
 *
 * Replicates EditorCanvas PageSheet contentSegments logic.
 */
function buildContentSegments(contentBlocks: AssembledBlock[]): ContentSegment[] {
  const result: ContentSegment[] = [];
  let currentGroup: AssembledBlock[] = [];

  for (const b of contentBlocks) {
    if (VERTICALLY_ALIGNABLE.has(b.type)) {
      // Flush current group
      if (currentGroup.length > 0) {
        result.push({ type: 'group', blocks: [...currentGroup] });
        currentGroup = [];
      }
      result.push({ type: 'alignable', block: b });
    } else {
      currentGroup.push(b);
    }
  }

  // Flush remaining group
  if (currentGroup.length > 0) {
    result.push({ type: 'group', blocks: currentGroup });
  }

  return result;
}

/**
 * Render a group of content blocks with component transition indicators.
 * Returns a list of ReactNodes with blue separators between component groups.
 */
function renderGroupWithTransitions(
  groupBlocks: AssembledBlock[],
  renderBlock: (block: AssembledBlock) => React.ReactNode,
  lastComponenteIdRef: { current: number | undefined },
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];

  for (const block of groupBlocks) {
    // Insert component separator when transitioning between components
    if (
      block._source === 'component' &&
      block._componenteInformeId !== undefined &&
      block._componenteInformeId !== lastComponenteIdRef.current
    ) {
      lastComponenteIdRef.current = block._componenteInformeId;
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

// ======================== Page Container ========================

interface PageContainerProps {
  canvasWidth: number;
  canvasHeight: number;
  pageConfig: PageConfig;
  topChrome: AssembledBlock[];
  bottomChrome: AssembledBlock[];
  contentBlocks: AssembledBlock[];
  hasBackCover: boolean;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  renderBlock: (block: AssembledBlock) => React.ReactNode;
  /** Unique key prefix to avoid duplicate React keys when chrome repeats */
  keyPrefix: string;
}

function PageContainer({
  canvasWidth,
  canvasHeight,
  pageConfig,
  topChrome,
  bottomChrome,
  contentBlocks,
  hasBackCover,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  renderBlock,
  keyPrefix,
}: PageContainerProps) {
  const segments = useMemo(
    () => buildContentSegments(contentBlocks),
    [contentBlocks],
  );

  // Track component transitions across all segments
  const lastComponenteIdRef = useMemo(() => ({ current: undefined as number | undefined }), []);

  return (
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
      <div className="flex flex-col" style={{ minHeight: canvasHeight }}>
        {/* ===== Top chrome — edge-to-edge, no margins ===== */}
        {topChrome.length > 0 && (
          <div className={hasBackCover ? 'flex flex-col flex-1' : 'shrink-0'}>
            {topChrome.map((b) => (
              <div
                key={`${keyPrefix}_tc_${b.id}`}
                className={`w-full ${hasBackCover && b.type === 'back_cover' ? 'flex-1 flex flex-col' : ''}`}
              >
                {renderBlock(b)}
              </div>
            ))}
          </div>
        )}

        {/* ===== Content — with page margins, flex-col for alignment ===== */}
        {!hasBackCover && contentBlocks.length > 0 && (
          <div
            style={{
              flex: '1 1 0%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: `${topChrome.length > 0 ? 8 : marginTop}px ${marginRight}px ${bottomChrome.length > 0 ? 8 : marginBottom}px ${marginLeft}px`,
            }}
          >
            {segments.map((seg, si) => {
              if (seg.type === 'group') {
                return (
                  <div
                    key={`${keyPrefix}_grp_${si}`}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      flexShrink: 0,
                    }}
                  >
                    {renderGroupWithTransitions(
                      seg.blocks,
                      renderBlock,
                      lastComponenteIdRef,
                    )}
                  </div>
                );
              }

              // Alignable block — direct child of flex-col with vertical margin
              const align =
                (seg.block.config.verticalAlign as string) || 'top';
              const style: React.CSSProperties = {
                flexShrink: 0,
                width: '100%',
              };
              if (align === 'center') {
                style.marginTop = 'auto';
                style.marginBottom = 'auto';
              } else if (align === 'bottom') {
                style.marginTop = 'auto';
              }

              // Also handle component transition for alignable blocks
              const transitionElements: React.ReactNode[] = [];
              if (
                seg.block._source === 'component' &&
                seg.block._componenteInformeId !== undefined &&
                seg.block._componenteInformeId !== lastComponenteIdRef.current
              ) {
                lastComponenteIdRef.current = seg.block._componenteInformeId;
                transitionElements.push(
                  <div
                    key={`comp-sep-${seg.block._componenteInformeId}`}
                    className="w-full flex items-center gap-2 py-2 px-1 my-1"
                    style={{ flexShrink: 0 }}
                  >
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600">
                      {seg.block._componenteEtiqueta}
                    </span>
                    <div className="flex-1 border-t border-blue-200" />
                  </div>,
                );
              }

              return (
                <React.Fragment key={seg.block.id}>
                  {transitionElements}
                  <div style={style}>{renderBlock(seg.block)}</div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ===== Bottom chrome — edge-to-edge, pinned to bottom ===== */}
        {bottomChrome.length > 0 && (
          <div className="shrink-0 mt-auto">
            {bottomChrome.map((b) => (
              <div key={`${keyPrefix}_bc_${b.id}`} className="w-full">
                {renderBlock(b)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
  const mTop = pageConfig.margins.top * MM_TO_PX;
  const mRight = pageConfig.margins.right * MM_TO_PX;
  const mBottom = pageConfig.margins.bottom * MM_TO_PX;
  const mLeft = pageConfig.margins.left * MM_TO_PX;

  return (
    <div className="flex flex-col items-center gap-8">
      {sections.map((section, si) => {
        const { topChrome, content, bottomChrome, hasBackCover } =
          splitChromeAndContent(section.blocks);

        // Split content by page_break into sub-pages
        const contentPages = splitByPageBreak(content);

        return (
          <div key={si} className="flex flex-col items-center w-full gap-6">
            {/* Section separator label (outside pages) */}
            {section.separator && (
              <div
                className="w-full flex items-center gap-2 py-2"
                style={{ maxWidth: canvasWidth }}
              >
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {SECTION_LABELS[
                    section.separator.config.section as string
                  ] ?? (section.separator.config.section as string)}
                </span>
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              </div>
            )}

            {/* Render a PageContainer for each sub-page */}
            {contentPages.map((pageContent, pi) => (
              <PageContainer
                key={`s${si}_p${pi}`}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                pageConfig={pageConfig}
                topChrome={topChrome}
                bottomChrome={bottomChrome}
                contentBlocks={pageContent}
                hasBackCover={hasBackCover && pi === 0}
                marginTop={mTop}
                marginRight={mRight}
                marginBottom={mBottom}
                marginLeft={mLeft}
                renderBlock={renderBlock}
                keyPrefix={`s${si}_p${pi}`}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
