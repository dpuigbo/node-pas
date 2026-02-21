import { useMemo } from 'react';
import type { Block, PageConfig, FieldWidth } from '@/types/editor';
import { FIELD_WIDTH_FRACTION } from '@/types/editor';

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
]);

export interface PageAssignment {
  pageIndex: number;
  blockIds: string[];
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

export function usePagination({ blocks, pageConfig, blockHeights }: UsePaginationParams): {
  pages: PageAssignment[];
  totalPages: number;
} {
  return useMemo(() => {
    if (blocks.length === 0) {
      return { pages: [{ pageIndex: 0, blockIds: [] }], totalPages: 1 };
    }

    const isPortrait = pageConfig.orientation === 'portrait';
    const pageHeight = isPortrait ? A4_HEIGHT : A4_WIDTH;
    const contentHeight =
      pageHeight -
      (pageConfig.margins.top + pageConfig.margins.bottom) * MM_TO_PX;

    const pages: PageAssignment[] = [];
    let currentPage: PageAssignment = { pageIndex: 0, blockIds: [] };
    let currentY = 0;
    let currentRowWidth = 0;
    let currentRowHeight = 0;
    let currentRowBlockIds: string[] = [];

    const flushRow = () => {
      if (currentRowBlockIds.length === 0) return;

      // Check if row fits on current page
      if (currentY + currentRowHeight > contentHeight && currentPage.blockIds.length > 0) {
        // Start new page
        pages.push(currentPage);
        currentPage = { pageIndex: pages.length, blockIds: [] };
        currentY = 0;
      }

      // Add row blocks to current page
      currentPage.blockIds.push(...currentRowBlockIds);
      currentY += currentRowHeight;

      // Reset row tracking
      currentRowWidth = 0;
      currentRowHeight = 0;
      currentRowBlockIds = [];
    };

    for (const block of blocks) {
      // Section separator forces new page
      if (block.type === 'section_separator') {
        flushRow();
        if (currentPage.blockIds.length > 0) {
          pages.push(currentPage);
          currentPage = { pageIndex: pages.length, blockIds: [] };
          currentY = 0;
        }
        currentPage.blockIds.push(block.id);
        // Section separator takes ~40px height
        const sepHeight = blockHeights.get(block.id) || 40;
        currentY += sepHeight;
        continue;
      }

      const blockFraction = getBlockWidthFraction(block);
      const blockHeight = blockHeights.get(block.id) || 30; // default estimate

      // Check if block fits in current row
      if (currentRowWidth + blockFraction > 1.01 && currentRowBlockIds.length > 0) {
        // Row is full, flush it
        flushRow();
      }

      // Add block to current row
      currentRowBlockIds.push(block.id);
      currentRowWidth += blockFraction;
      currentRowHeight = Math.max(currentRowHeight, blockHeight);

      // If block is full-width, flush immediately
      if (blockFraction >= 1) {
        flushRow();
      }
    }

    // Flush remaining row
    flushRow();

    // Push last page
    if (currentPage.blockIds.length > 0 || pages.length === 0) {
      pages.push(currentPage);
    }

    return { pages, totalPages: pages.length };
  }, [blocks, pageConfig, blockHeights]);
}
