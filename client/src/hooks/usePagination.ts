import { useMemo } from 'react';
import type { Block, PageConfig, FieldWidth } from '@/types/editor';
import { FIELD_WIDTH_FRACTION, DOCUMENT_CHROME_TYPES } from '@/types/editor';

// A4 dimensions at 96 DPI
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// mm to px conversion factor (96 DPI)
const MM_TO_PX = 3.78;

// Block types that are always full-width
const ALWAYS_FULL_TYPES = new Set([
  'header', 'section_title', 'divider',
  'tristate', 'checklist', 'table',
  'section_separator', 'table_of_contents',
  'cover_header', 'page_header', 'page_footer', 'back_cover',
  'page_break', 'content_placeholder', 'intervention_data', 'client_data',
]);

export interface PageAssignment {
  pageIndex: number;
  blockIds: string[];
  /** Chrome block IDs injected from the section (repeating on pages beyond the first) */
  sectionChromeIds: string[];
  /** If this page starts a new section, the separator block ID (rendered outside the page) */
  sectionSeparatorId?: string;
}

function getBlockWidthFraction(block: Block): number {
  if (ALWAYS_FULL_TYPES.has(block.type)) return 1;
  const width = (block.config.width as FieldWidth) || 'full';
  return FIELD_WIDTH_FRACTION[width] ?? 1;
}

interface UsePaginationParams {
  blocks: Block[];
  pageConfig: PageConfig;
  blockHeights: Map<string, number>;
}

/**
 * Identifies sections in the block array (delimited by section_separator blocks).
 * For each section, collects the chrome blocks (cover_header, page_header, page_footer, back_cover).
 * Returns a map: sectionIndex → chrome Block[]
 */
function collectSectionChrome(blocks: Block[]): Map<number, Block[]> {
  const result = new Map<number, Block[]>();
  let sectionIdx = 0;

  for (const block of blocks) {
    if (block.type === 'section_separator') {
      sectionIdx++;
      continue;
    }
    if (DOCUMENT_CHROME_TYPES.has(block.type)) {
      const list = result.get(sectionIdx) || [];
      list.push(block);
      result.set(sectionIdx, list);
    }
  }
  return result;
}

export function usePagination({ blocks, pageConfig, blockHeights }: UsePaginationParams): {
  pages: PageAssignment[];
  totalPages: number;
} {
  return useMemo(() => {
    if (blocks.length === 0) {
      return { pages: [{ pageIndex: 0, blockIds: [], sectionChromeIds: [] }], totalPages: 1 };
    }

    const isPortrait = pageConfig.orientation === 'portrait';
    const pageHeight = isPortrait ? A4_HEIGHT : A4_WIDTH;
    const marginHeight = (pageConfig.margins.top + pageConfig.margins.bottom) * MM_TO_PX;
    const contentHeight = pageHeight - marginHeight;

    // Collect section chrome blocks (they'll be injected into every page of their section)
    const sectionChrome = collectSectionChrome(blocks);

    const pages: PageAssignment[] = [];
    let currentPage: PageAssignment = { pageIndex: 0, blockIds: [], sectionChromeIds: [] };
    let currentY = 0;
    let chromeHeight = 0; // height consumed by physical chrome blocks on this page
    let currentRowWidth = 0;
    let currentRowHeight = 0;
    let currentRowBlockIds: string[] = [];
    let currentSection = 0;
    let isFirstPageOfSection = true;

    /** Compute chrome height for the current section */
    const getSectionChromeHeight = (): number => {
      const chromeBlocks = sectionChrome.get(currentSection);
      if (!chromeBlocks) return 0;
      let total = 0;
      for (const cb of chromeBlocks) {
        if (cb.type === 'back_cover') continue;
        total += blockHeights.get(cb.id) || 40;
      }
      return total;
    };

    /** Get chrome block IDs for current section (excluding back_cover) */
    const getSectionChromeIds = (): string[] => {
      const chromeBlocks = sectionChrome.get(currentSection);
      if (!chromeBlocks) return [];
      return chromeBlocks.filter((b) => b.type !== 'back_cover').map((b) => b.id);
    };

    const getEffectiveContentHeight = () => {
      const totalChrome = chromeHeight + getSectionChromeHeight();
      if (totalChrome > 0) {
        return pageHeight - totalChrome - 16;
      }
      return contentHeight;
    };

    const flushRow = () => {
      if (currentRowBlockIds.length === 0) return;

      const effective = getEffectiveContentHeight();

      if (currentY + currentRowHeight > effective && currentPage.blockIds.length > 0) {
        if (!isFirstPageOfSection) {
          currentPage.sectionChromeIds = getSectionChromeIds();
        }
        pages.push(currentPage);
        currentPage = { pageIndex: pages.length, blockIds: [], sectionChromeIds: [] };
        currentY = 0;
        chromeHeight = 0;
        isFirstPageOfSection = false;
      }

      currentPage.blockIds.push(...currentRowBlockIds);
      currentY += currentRowHeight;

      currentRowWidth = 0;
      currentRowHeight = 0;
      currentRowBlockIds = [];
    };

    for (const block of blocks) {
      // Section separator: forces new page, rendered OUTSIDE the page
      if (block.type === 'section_separator') {
        flushRow();
        if (currentPage.blockIds.length > 0) {
          if (!isFirstPageOfSection) {
            currentPage.sectionChromeIds = getSectionChromeIds();
          }
          pages.push(currentPage);
        }
        // Advance section counter
        currentSection++;
        isFirstPageOfSection = true;
        // Start a new page with the separator ID attached (rendered outside)
        currentPage = {
          pageIndex: pages.length,
          blockIds: [],
          sectionChromeIds: [],
          sectionSeparatorId: block.id,
        };
        currentY = 0;
        chromeHeight = 0;
        continue;
      }

      // Page break forces new page
      if (block.type === 'page_break') {
        flushRow();
        currentPage.blockIds.push(block.id);
        if (!isFirstPageOfSection) {
          currentPage.sectionChromeIds = getSectionChromeIds();
        }
        pages.push(currentPage);
        currentPage = { pageIndex: pages.length, blockIds: [], sectionChromeIds: [] };
        currentY = 0;
        chromeHeight = 0;
        isFirstPageOfSection = false;
        continue;
      }

      // back_cover: full-page block
      if (block.type === 'back_cover') {
        flushRow();
        if (currentPage.blockIds.length > 0) {
          pages.push(currentPage);
          currentPage = { pageIndex: pages.length, blockIds: [], sectionChromeIds: [] };
          currentY = 0;
          chromeHeight = 0;
          isFirstPageOfSection = false;
        }
        currentPage.blockIds.push(block.id);
        chromeHeight = pageHeight;
        continue;
      }

      // Document chrome blocks: placed in blockIds on the first page they're encountered
      if (DOCUMENT_CHROME_TYPES.has(block.type)) {
        flushRow();
        const bh = blockHeights.get(block.id) || 40;
        currentPage.blockIds.push(block.id);
        chromeHeight += bh;
        continue;
      }

      const blockFraction = getBlockWidthFraction(block);
      const blockHeight = blockHeights.get(block.id) || 30;

      if (currentRowWidth + blockFraction > 1.01 && currentRowBlockIds.length > 0) {
        flushRow();
      }

      currentRowBlockIds.push(block.id);
      currentRowWidth += blockFraction;
      currentRowHeight = Math.max(currentRowHeight, blockHeight);

      if (blockFraction >= 1) {
        flushRow();
      }
    }

    // Flush remaining row
    flushRow();

    // Push last page — also push if it carries a section separator (even if empty)
    if (currentPage.blockIds.length > 0 || currentPage.sectionSeparatorId || pages.length === 0) {
      if (!isFirstPageOfSection) {
        currentPage.sectionChromeIds = getSectionChromeIds();
      }
      pages.push(currentPage);
    }

    return { pages, totalPages: pages.length };
  }, [blocks, pageConfig, blockHeights]);
}
