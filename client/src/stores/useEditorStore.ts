import { create } from 'zustand';
import type { Block, BlockType, PageConfig, TemplateSchema } from '@/types/editor';
import { DEFAULT_PAGE_CONFIG } from '@/types/editor';
import { blockDefinitions } from '@/components/blocks/registry';

// ===== Deep set utility =====
function setDeep(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const result = { ...obj };
  const keys = path.split('.');
  let current: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isArrayIndex = /^\d+$/.test(nextKey);

    if (Array.isArray(current[key])) {
      current[key] = [...current[key]];
    } else if (typeof current[key] === 'object' && current[key] !== null) {
      current[key] = { ...current[key] };
    } else {
      current[key] = isArrayIndex ? [] : {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
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
      return match ? parseInt(match[1], 10) : 0;
    });
  const maxNum = existing.length > 0 ? Math.max(...existing) : 0;
  return `${prefix}_${maxNum + 1}`;
}

// ===== Generate UUID =====
function uuid(): string {
  return crypto.randomUUID();
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

  // Actions
  loadSchema: (schema: TemplateSchema, modeloId: number, versionId: number) => void;
  addBlock: (type: BlockType, index?: number) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;
  reorderBlocks: (ids: string[]) => void;
  updateBlockConfig: (id: string, path: string, value: unknown) => void;
  selectBlock: (id: string | null) => void;
  updatePageConfig: (config: Partial<PageConfig>) => void;
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

  loadSchema: (schema, modeloId, versionId) => {
    set({
      blocks: schema.blocks || [],
      pageConfig: schema.pageConfig || { ...DEFAULT_PAGE_CONFIG },
      selectedBlockId: null,
      isDirty: false,
      versionId,
      modeloId,
    });
  },

  addBlock: (type, index) => {
    const def = blockDefinitions[type];
    if (!def) return;

    const { blocks } = get();
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
      newBlocks.splice(index, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }

    set({ blocks: newBlocks, isDirty: true, selectedBlockId: newBlock.id });
  },

  removeBlock: (id) => {
    const { blocks, selectedBlockId } = get();
    set({
      blocks: blocks.filter((b) => b.id !== id),
      isDirty: true,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
    });
  },

  duplicateBlock: (id) => {
    const { blocks } = get();
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;

    const source = blocks[idx];
    const def = blockDefinitions[source.type];
    const config = JSON.parse(JSON.stringify(source.config));

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

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];

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
    });
  },
}));
