import { create } from 'zustand';
import type { Block, BlockType, PageConfig, TemplateSchema, DocumentSection } from '@/types/editor';
import { DEFAULT_PAGE_CONFIG } from '@/types/editor';
import { blockDefinitions } from '@/components/blocks/registry';

// ===== Deep set utility =====
function setDeep(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const result = { ...obj };
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i] as string;
    const nextKey = parts[i + 1] as string | undefined;
    const isArrayIndex = nextKey != null && /^\d+$/.test(nextKey);

    if (Array.isArray(current[key])) {
      current[key] = [...(current[key] as unknown[])];
    } else if (typeof current[key] === 'object' && current[key] !== null) {
      current[key] = { ...(current[key] as Record<string, unknown>) };
    } else {
      current[key] = isArrayIndex ? [] : {};
    }
    current = current[key];
  }

  const lastKey = parts[parts.length - 1] as string | undefined;
  if (lastKey != null) {
    current[lastKey] = value;
  }
  return result;
}

// ===== Generate unique key =====
function generateKey(type: BlockType, existingBlocks: Block[]): string {
  const prefix = type.replace(/_/g, '_');
  const existing = existingBlocks
    .filter((b) => b.type === type)
    .map((b) => {
      const key = (b.config.key as string) || '';
      const match = key.match(new RegExp(`^${prefix}_(\\d+)$`));
      return match?.[1] != null ? parseInt(match[1], 10) : 0;
    });
  const maxNum = existing.length > 0 ? Math.max(...existing) : 0;
  return `${prefix}_${maxNum + 1}`;
}

// ===== Generate UUID =====
function uuid(): string {
  return crypto.randomUUID();
}

// ===== Ensure section separators for document templates =====
const SECTIONS_ORDER: DocumentSection[] = ['portada', 'intermedia', 'contraportada'];

function ensureSectionSeparators(blocks: Block[]): Block[] {
  const existing = blocks.filter((b) => b.type === 'section_separator');
  const existingSections = existing.map((b) => b.config.section as DocumentSection);

  if (SECTIONS_ORDER.every((s) => existingSections.includes(s))) {
    return blocks; // All separators present
  }

  // Build new block list with separators in correct positions
  const nonSeparators = blocks.filter((b) => b.type !== 'section_separator');
  const result: Block[] = [];

  for (const section of SECTIONS_ORDER) {
    result.push({
      id: `section-${section}`,
      type: 'section_separator' as BlockType,
      config: { section },
    });
  }

  // Append existing non-separator blocks after the last separator (contraportada)
  // In practice, for a fresh template there are no blocks
  if (nonSeparators.length > 0) {
    // Insert after portada separator
    result.splice(1, 0, ...nonSeparators);
  }

  return result;
}

// ===== Store Interface =====
interface EditorState {
  // Data
  blocks: Block[];
  pageConfig: PageConfig;
  selectedBlockId: string | null;
  isDirty: boolean;
  versionId: number | null;
  modeloId: number | null;
  isDocumentTemplate: boolean;

  // Block height tracking for pagination
  blockHeights: Map<string, number>;

  // Actions
  loadSchema: (schema: TemplateSchema, modeloId: number, versionId: number, isDocumentTemplate?: boolean) => void;
  addBlock: (type: BlockType, index?: number) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;
  reorderBlocks: (ids: string[]) => void;
  updateBlockConfig: (id: string, path: string, value: unknown) => void;
  selectBlock: (id: string | null) => void;
  updatePageConfig: (config: Partial<PageConfig>) => void;
  setBlockHeight: (id: string, height: number) => void;
  getSchema: () => TemplateSchema;
  markClean: () => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  blocks: [],
  pageConfig: { ...DEFAULT_PAGE_CONFIG },
  selectedBlockId: null,
  isDirty: false,
  versionId: null,
  modeloId: null,
  isDocumentTemplate: false,
  blockHeights: new Map(),

  loadSchema: (schema, modeloId, versionId, isDocumentTemplate = false) => {
    let blocks = schema.blocks || [];

    // For document templates, ensure section separators exist
    if (isDocumentTemplate) {
      blocks = ensureSectionSeparators(blocks);
    }

    set({
      blocks,
      pageConfig: schema.pageConfig || { ...DEFAULT_PAGE_CONFIG },
      selectedBlockId: null,
      isDirty: false,
      versionId,
      modeloId,
      isDocumentTemplate,
      blockHeights: new Map(),
    });
  },

  addBlock: (type, index) => {
    const def = blockDefinitions[type];
    if (!def) return;

    const { blocks, selectedBlockId, isDocumentTemplate } = get();
    const config = { ...def.defaultConfig };

    // Auto-generate key for data blocks
    if (def.hasData) {
      config.key = generateKey(type, blocks);
    }

    const newBlock: Block = {
      id: uuid(),
      type,
      config,
    };

    const newBlocks = [...blocks];

    if (index !== undefined && index >= 0 && index <= blocks.length) {
      // Explicit index provided
      newBlocks.splice(index, 0, newBlock);
    } else if (isDocumentTemplate) {
      // Smart insertion for document templates
      if (selectedBlockId) {
        const selectedIdx = blocks.findIndex((b) => b.id === selectedBlockId);
        if (selectedIdx !== -1) {
          const selectedBlock = blocks[selectedIdx]!;
          if (selectedBlock.type === 'section_separator') {
            // Selected block is a section separator → insert right after it
            // but before the next section separator (or end)
            let insertIdx = selectedIdx + 1;
            while (insertIdx < blocks.length && blocks[insertIdx]!.type !== 'section_separator') {
              insertIdx++;
            }
            newBlocks.splice(insertIdx, 0, newBlock);
          } else {
            // Insert after the selected block
            newBlocks.splice(selectedIdx + 1, 0, newBlock);
          }
        } else {
          // Selected block not found — insert at end of first section
          const firstSepIdx = blocks.findIndex(
            (b, i) => i > 0 && b.type === 'section_separator',
          );
          newBlocks.splice(firstSepIdx !== -1 ? firstSepIdx : blocks.length, 0, newBlock);
        }
      } else {
        // No selection — insert at end of first section (before second separator)
        const firstSepIdx = blocks.findIndex(
          (b, i) => i > 0 && b.type === 'section_separator',
        );
        newBlocks.splice(firstSepIdx !== -1 ? firstSepIdx : blocks.length, 0, newBlock);
      }
    } else {
      // Non-template: append at end (original behavior)
      newBlocks.push(newBlock);
    }

    set({ blocks: newBlocks, isDirty: true, selectedBlockId: newBlock.id });
  },

  removeBlock: (id) => {
    const { blocks, selectedBlockId } = get();
    // Cannot remove section separators
    const block = blocks.find((b) => b.id === id);
    if (block?.type === 'section_separator') return;

    const newHeights = new Map(get().blockHeights);
    newHeights.delete(id);

    set({
      blocks: blocks.filter((b) => b.id !== id),
      isDirty: true,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
      blockHeights: newHeights,
    });
  },

  duplicateBlock: (id) => {
    const { blocks } = get();
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;

    const source = blocks[idx]!;
    // Cannot duplicate section separators
    if (source.type === 'section_separator') return;

    const def = blockDefinitions[source.type];
    const config = JSON.parse(JSON.stringify(source.config)) as Record<string, unknown>;

    // Generate new key for data blocks
    if (def?.hasData && config.key) {
      config.key = generateKey(source.type, blocks);
    }

    const newBlock: Block = {
      id: uuid(),
      type: source.type,
      config,
    };

    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, newBlock);

    set({ blocks: newBlocks, isDirty: true, selectedBlockId: newBlock.id });
  },

  moveBlock: (id, direction) => {
    const { blocks } = get();
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;

    const block = blocks[idx]!;
    // Cannot move section separators
    if (block.type === 'section_separator') return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;

    // Don't swap with a section separator
    if (blocks[newIdx]!.type === 'section_separator') return;

    const newBlocks = [...blocks];
    const a = newBlocks[idx]!;
    const b = newBlocks[newIdx]!;
    newBlocks[idx] = b;
    newBlocks[newIdx] = a;

    set({ blocks: newBlocks, isDirty: true });
  },

  reorderBlocks: (ids) => {
    const { blocks } = get();
    const blockMap = new Map(blocks.map((b) => [b.id, b]));
    const reordered = ids.map((id) => blockMap.get(id)).filter(Boolean) as Block[];

    // Include any blocks not in the ids list (shouldn't happen, but safety)
    const missing = blocks.filter((b) => !ids.includes(b.id));

    set({ blocks: [...reordered, ...missing], isDirty: true });
  },

  updateBlockConfig: (id, path, value) => {
    const { blocks } = get();
    set({
      blocks: blocks.map((b) =>
        b.id === id ? { ...b, config: setDeep(b.config, path, value) } : b,
      ),
      isDirty: true,
    });
  },

  selectBlock: (id) => {
    set({ selectedBlockId: id });
  },

  updatePageConfig: (config) => {
    const { pageConfig } = get();
    set({
      pageConfig: { ...pageConfig, ...config },
      isDirty: true,
    });
  },

  setBlockHeight: (id, height) => {
    const { blockHeights } = get();
    if (blockHeights.get(id) === height) return; // avoid unnecessary re-renders
    const next = new Map(blockHeights);
    next.set(id, height);
    set({ blockHeights: next });
  },

  getSchema: () => {
    const { blocks, pageConfig } = get();
    return { blocks, pageConfig };
  },

  markClean: () => {
    set({ isDirty: false });
  },

  reset: () => {
    set({
      blocks: [],
      pageConfig: { ...DEFAULT_PAGE_CONFIG },
      selectedBlockId: null,
      isDirty: false,
      versionId: null,
      modeloId: null,
      isDocumentTemplate: false,
      blockHeights: new Map(),
    });
  },
}));
