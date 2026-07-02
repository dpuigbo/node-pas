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
 * - back_cover fills entire page (fixed height, not minHeight)
 * - Page numbering: injects _pageNumber/_totalPages into chrome blocks
 *
 * Optional `paginate` (read-only views only): measures rendered block heights
 * and splits overflowing content into real A4 pages. Pages whose content holds
 * a vertically alignable block (portada) or a back_cover are NOT split (they
 * keep their single-page layout). The form/editor never passes paginate.
 */

import React, {
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from 'react';
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
  /**
   * When true, content that overflows an A4 page is measured and split into
   * real pages. Only safe for read-only views (it renders each block twice:
   * once hidden to measure, once visible). Defaults to false.
   */
  paginate?: boolean;
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
function splitChromeAndContent(blocks: AssembledBlock[]) {
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
      pages.push(current);
      current = [];
    } else {
      current.push(block);
    }
  }

  if (current.length > 0 || pages.length === 0) {
    pages.push(current);
  }

  return pages;
}

/**
 * Split content blocks into segments: groups of normal blocks (flex-wrap rows)
 * interleaved with vertically alignable blocks (direct flex-col children).
 */
function buildContentSegments(contentBlocks: AssembledBlock[]): ContentSegment[] {
  const result: ContentSegment[] = [];
  let currentGroup: AssembledBlock[] = [];

  for (const b of contentBlocks) {
    if (VERTICALLY_ALIGNABLE.has(b.type)) {
      if (currentGroup.length > 0) {
        result.push({ type: 'group', blocks: [...currentGroup] });
        currentGroup = [];
      }
      result.push({ type: 'alignable', block: b });
    } else {
      currentGroup.push(b);
    }
  }

  if (currentGroup.length > 0) {
    result.push({ type: 'group', blocks: currentGroup });
  }

  return result;
}

/**
 * Count total pages across all sections for page numbering.
 * Each section produces N sub-pages (split by page_break).
 */
function countTotalPages(sections: Section[]): number {
  let total = 0;
  for (const section of sections) {
    const { content, hasBackCover } = splitChromeAndContent(section.blocks);
    if (hasBackCover) {
      total += 1;
    } else {
      total += splitByPageBreak(content).length;
    }
  }
  return Math.max(total, 1);
}

/** Inject _pageNumber and _totalPages into a chrome block (non-mutating clone) */
function withPageNumbers(
  block: AssembledBlock,
  pageNumber: number,
  totalPages: number,
): AssembledBlock {
  return {
    ...block,
    config: {
      ...block.config,
      _pageNumber: pageNumber,
      _totalPages: totalPages,
    },
  };
}

// ======================== Section separator label ========================

function SeparatorLabel({
  separator,
  canvasWidth,
}: {
  separator: AssembledBlock;
  canvasWidth: number;
}) {
  const key = separator.config.section as string;
  return (
    <div
      className="no-print w-full flex items-center gap-2 py-1"
      style={{ maxWidth: canvasWidth }}
    >
      <div className="flex-1 border-t-2 border-dashed border-gray-300" />
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {SECTION_LABELS[key] ?? key}
      </span>
      <div className="flex-1 border-t-2 border-dashed border-gray-300" />
    </div>
  );
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
  keyPrefix: string;
  pageNumber: number;
  totalPages: number;
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
  pageNumber,
  totalPages,
}: PageContainerProps) {
  const segments = useMemo(
    () => buildContentSegments(contentBlocks),
    [contentBlocks],
  );

  return (
    <div
      className="doc-page bg-white shadow-lg border overflow-hidden"
      style={{
        width: canvasWidth,
        // back_cover needs fixed height to fill page; content pages use minHeight
        ...(hasBackCover
          ? { height: canvasHeight }
          : { minHeight: canvasHeight }),
        fontSize: `${pageConfig.fontSize}px`,
        fontFamily: pageConfig.fontFamily
          ? `"${pageConfig.fontFamily}", sans-serif`
          : undefined,
      }}
    >
      <div
        className="flex flex-col"
        style={hasBackCover ? { height: canvasHeight } : { minHeight: canvasHeight }}
      >
        {/* ===== Top chrome — edge-to-edge, no margins ===== */}
        {topChrome.length > 0 && (
          <div className={hasBackCover ? 'flex flex-col flex-1' : 'shrink-0'}>
            {topChrome.map((b) => (
              <div
                key={`${keyPrefix}_tc_${b.id}`}
                className={`w-full ${hasBackCover && b.type === 'back_cover' ? 'flex-1 flex flex-col' : ''}`}
              >
                {renderBlock(withPageNumbers(b, pageNumber, totalPages))}
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
                    {seg.blocks.map((block) => (
                      <React.Fragment key={block.id}>
                        {renderBlock(block)}
                      </React.Fragment>
                    ))}
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

              return (
                <div key={seg.block.id} style={style}>
                  {renderBlock(seg.block)}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== Bottom chrome — edge-to-edge, pinned to bottom ===== */}
        {bottomChrome.length > 0 && (
          <div className="shrink-0 mt-auto">
            {bottomChrome.map((b) => (
              <div key={`${keyPrefix}_bc_${b.id}`} className="w-full">
                {renderBlock(withPageNumbers(b, pageNumber, totalPages))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ======================== Shared canvas geometry ========================

interface Geometry {
  canvasWidth: number;
  canvasHeight: number;
  mTop: number;
  mRight: number;
  mBottom: number;
  mLeft: number;
}

function useGeometry(pageConfig: PageConfig): Geometry {
  const isPortrait = pageConfig.orientation === 'portrait';
  return {
    canvasWidth: isPortrait ? A4_WIDTH : A4_HEIGHT,
    canvasHeight: isPortrait ? A4_HEIGHT : A4_WIDTH,
    mTop: pageConfig.margins.top * MM_TO_PX,
    mRight: pageConfig.margins.right * MM_TO_PX,
    mBottom: pageConfig.margins.bottom * MM_TO_PX,
    mLeft: pageConfig.margins.left * MM_TO_PX,
  };
}

// ======================== Unpaginated (default) document ========================

function UnpaginatedDocument({
  sections,
  pageConfig,
  renderBlock,
  geo,
}: {
  sections: Section[];
  pageConfig: PageConfig;
  renderBlock: (block: AssembledBlock) => React.ReactNode;
  geo: Geometry;
}) {
  const totalPages = useMemo(() => countTotalPages(sections), [sections]);
  const { canvasWidth, canvasHeight, mTop, mRight, mBottom, mLeft } = geo;

  let currentPage = 0;

  return (
    <div className="flex flex-col items-center gap-2">
      {sections.map((section, si) => {
        const { topChrome, content, bottomChrome, hasBackCover } =
          splitChromeAndContent(section.blocks);

        const contentPages = splitByPageBreak(content);

        return (
          <div key={si} className="flex flex-col items-center w-full gap-2">
            {section.separator && (
              <SeparatorLabel separator={section.separator} canvasWidth={canvasWidth} />
            )}

            {contentPages.map((pageContent, pi) => {
              currentPage++;
              return (
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
                  pageNumber={currentPage}
                  totalPages={totalPages}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ======================== Paginated document ========================

/** One page_break-delimited unit before height pagination */
interface LogicalPage {
  topChrome: AssembledBlock[];
  bottomChrome: AssembledBlock[];
  blocks: AssembledBlock[];
  hasBackCover: boolean;
  separator?: AssembledBlock;
  /** Content pages get measured + split; alignable/back_cover pages do not. */
  measurable: boolean;
}

/** One physical A4 page after height pagination */
interface PhysicalPage {
  topChrome: AssembledBlock[];
  bottomChrome: AssembledBlock[];
  blocks: AssembledBlock[];
  hasBackCover: boolean;
  separator?: AssembledBlock;
}

function buildLogicalPages(sections: Section[]): LogicalPage[] {
  const out: LogicalPage[] = [];
  for (const section of sections) {
    const { topChrome, content, bottomChrome, hasBackCover } =
      splitChromeAndContent(section.blocks);

    if (hasBackCover) {
      out.push({
        topChrome,
        bottomChrome,
        blocks: [],
        hasBackCover: true,
        separator: section.separator,
        measurable: false,
      });
      continue;
    }

    const pbPages = splitByPageBreak(content);
    pbPages.forEach((blocks, pi) => {
      out.push({
        topChrome,
        bottomChrome,
        blocks,
        hasBackCover: false,
        separator: pi === 0 ? section.separator : undefined,
        // TODA pagina de contenido se mide y se parte por altura. Si cabe en una
        // sola pagina (p.ej. la portada con bloques centrados) sale como una unica
        // pagina y conserva su maquetacion; si desborda, se reparte en varias A4.
        // (Antes, una pagina con un bloque centrado NO se partia -> pagina larga.)
        measurable: true,
      });
    });
  }
  return out;
}

function PaginatedDocument({
  sections,
  pageConfig,
  renderBlock,
  geo,
}: {
  sections: Section[];
  pageConfig: PageConfig;
  renderBlock: (block: AssembledBlock) => React.ReactNode;
  geo: Geometry;
}) {
  const { canvasWidth, canvasHeight, mTop, mRight, mBottom, mLeft } = geo;
  const innerW = Math.max(canvasWidth - mLeft - mRight, 50);

  const logicalPages = useMemo(() => buildLogicalPages(sections), [sections]);

  // Signature retriggers measurement when content or geometry changes.
  const sig = useMemo(() => {
    const body = logicalPages
      .map(
        (lp, i) =>
          `${i}:${lp.blocks.map((b) => b.id).join(',')}` +
          `|tc${lp.topChrome.length}|bc${lp.bottomChrome.length}`,
      )
      .join('||');
    return `${body}@@${canvasWidth}x${canvasHeight}:${mTop},${mRight},${mBottom},${mLeft}`;
  }, [logicalPages, canvasWidth, canvasHeight, mTop, mRight, mBottom, mLeft]);

  const measureRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<{ sig: string; pages: PhysicalPage[] } | null>(
    null,
  );

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    let cancelled = false;

    const measure = () => {
    const phys: PhysicalPage[] = [];

    logicalPages.forEach((lp, i) => {
      if (!lp.measurable) {
        phys.push({
          topChrome: lp.topChrome,
          bottomChrome: lp.bottomChrome,
          blocks: lp.blocks,
          hasBackCover: lp.hasBackCover,
          separator: lp.separator,
        });
        return;
      }

      const wrap = root.querySelector<HTMLElement>(`[data-lp="${i}"]`);
      const cont = wrap?.querySelector<HTMLElement>('[data-cont]') ?? null;
      const ctEl = wrap?.querySelector<HTMLElement>('[data-ct]') ?? null;
      const cbEl = wrap?.querySelector<HTMLElement>('[data-cb]') ?? null;

      const topH = ctEl ? ctEl.getBoundingClientRect().height : 0;
      const botH = cbEl ? cbEl.getBoundingClientRect().height : 0;
      const padTop = lp.topChrome.length > 0 ? 8 : mTop;
      const padBottom = lp.bottomChrome.length > 0 ? 8 : mBottom;
      const avail = Math.max(canvasHeight - topH - botH - padTop - padBottom, 120);

      const kids = cont ? Array.from(cont.children) : [];

      let subsets: AssembledBlock[][];
      if (kids.length !== lp.blocks.length || kids.length === 0) {
        // Couldn't line up DOM with blocks — fall back to a single page.
        subsets = [lp.blocks];
      } else {
        const contTop = cont!.getBoundingClientRect().top;
        subsets = [];
        let cur: AssembledBlock[] = [];
        let startY: number | null = null;
        for (let j = 0; j < lp.blocks.length; j++) {
          const blk = lp.blocks[j];
          const kid = kids[j] as HTMLElement | undefined;
          if (!blk || !kid) continue;
          const rect = kid.getBoundingClientRect();
          const top = rect.top - contTop;
          const bottom = top + rect.height;
          if (startY === null) startY = top;
          if (cur.length > 0 && bottom - startY > avail) {
            subsets.push(cur);
            cur = [];
            startY = top;
          }
          cur.push(blk);
        }
        if (cur.length > 0) subsets.push(cur);
        if (subsets.length === 0) subsets = [[]];
      }

      subsets.forEach((bl, k) => {
        phys.push({
          topChrome: lp.topChrome,
          bottomChrome: lp.bottomChrome,
          blocks: bl,
          hasBackCover: false,
          separator: k === 0 ? lp.separator : undefined,
        });
      });
    });

      if (!cancelled) setState({ sig, pages: phys });
    };

    measure();
    // Re-medir tras cargar las webfonts y en el siguiente frame: las alturas
    // reales pueden crecer al entrar las fuentes -> evita empaquetar de mas y
    // que la pagina acabe creciendo por encima del A4.
    const raf = requestAnimationFrame(measure);
    const fonts = (document as { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (fonts && fonts.ready) void fonts.ready.then(() => measure());
    return () => { cancelled = true; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const ready = state && state.sig === sig;

  return (
    <>
      {/* Hidden measurement layer — lays out every content page at real width */}
      <div
        ref={measureRef}
        aria-hidden
        key={sig}
        style={{
          position: 'absolute',
          left: -99999,
          top: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {logicalPages.map((lp, i) =>
          lp.measurable ? (
            <div key={i} data-lp={i}>
              {lp.topChrome.length > 0 && (
                <div data-ct style={{ width: canvasWidth }}>
                  {lp.topChrome.map((b) => (
                    <div key={b.id} className="w-full">
                      {renderBlock(b)}
                    </div>
                  ))}
                </div>
              )}
              <div
                data-cont
                style={{
                  width: innerW,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                }}
              >
                {/* Cada bloque en su marcador full-width: el conteo DOM coincide
                    SIEMPRE con lp.blocks (aunque un bloque renderice null), y su
                    offsetTop da la posicion acumulada para partir por altura. */}
                {lp.blocks.map((b) => (
                  <div key={b.id} data-mb style={{ width: '100%' }}>
                    {renderBlock(b)}
                  </div>
                ))}
              </div>
              {lp.bottomChrome.length > 0 && (
                <div data-cb style={{ width: canvasWidth }}>
                  {lp.bottomChrome.map((b) => (
                    <div key={b.id} className="w-full">
                      {renderBlock(b)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null,
        )}
      </div>

      {/* Visible layer — paginated once measured, plain fallback meanwhile */}
      {ready ? (
        <div className="flex flex-col items-center gap-2">
          {state!.pages.map((pp, idx) => (
            <div key={idx} className="flex flex-col items-center w-full gap-2">
              {pp.separator && (
                <SeparatorLabel separator={pp.separator} canvasWidth={canvasWidth} />
              )}
              <PageContainer
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                pageConfig={pageConfig}
                topChrome={pp.topChrome}
                bottomChrome={pp.bottomChrome}
                contentBlocks={pp.blocks}
                hasBackCover={pp.hasBackCover}
                marginTop={mTop}
                marginRight={mRight}
                marginBottom={mBottom}
                marginLeft={mLeft}
                renderBlock={renderBlock}
                keyPrefix={`pg${idx}`}
                pageNumber={idx + 1}
                totalPages={state!.pages.length}
              />
            </div>
          ))}
        </div>
      ) : (
        <UnpaginatedDocument
          sections={sections}
          pageConfig={pageConfig}
          renderBlock={renderBlock}
          geo={geo}
        />
      )}
    </>
  );
}

// ======================== Main Component ========================

export function DocumentPageLayout({
  blocks,
  pageConfig,
  renderBlock,
  paginate = false,
}: DocumentPageLayoutProps) {
  const sections = useMemo(() => splitIntoSections(blocks), [blocks]);
  const geo = useGeometry(pageConfig);

  if (paginate) {
    return (
      <PaginatedDocument
        sections={sections}
        pageConfig={pageConfig}
        renderBlock={renderBlock}
        geo={geo}
      />
    );
  }

  return (
    <UnpaginatedDocument
      sections={sections}
      pageConfig={pageConfig}
      renderBlock={renderBlock}
      geo={geo}
    />
  );
}
