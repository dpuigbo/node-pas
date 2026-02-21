import { X, Copy, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/stores/useEditorStore';
import { getBlockEntry, blockDefinitions } from '@/components/blocks/registry';
import { Button } from '@/components/ui/button';

export function ConfigPanel() {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks = useEditorStore((s) => s.blocks);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const updateBlockConfig = useEditorStore((s) => s.updateBlockConfig);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  if (!selectedBlockId) {
    return (
      <div className="flex w-80 flex-col border-l bg-background">
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
          Selecciona un bloque para configurarlo
        </div>
      </div>
    );
  }

  const block = blocks.find((b) => b.id === selectedBlockId);
  if (!block) return null;

  const entry = getBlockEntry(block.type);
  const def = blockDefinitions[block.type];
  if (!entry || !def) return null;

  const PanelComponent = entry.ConfigPanel;

  return (
    <div className="flex w-80 flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{def.label}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => selectBlock(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Config fields */}
      <div className="flex-1 overflow-y-auto p-4">
        <PanelComponent
          block={block}
          onChange={(path, value) => updateBlockConfig(block.id, path, value)}
        />
      </div>

      {/* Footer actions — hidden for section separators */}
      {block.type !== 'section_separator' && (
        <div className="flex items-center gap-2 border-t px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => duplicateBlock(block.id)}
          >
            <Copy className="h-4 w-4 mr-1" />
            Duplicar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:bg-destructive/10"
            onClick={() => {
              removeBlock(block.id);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        </div>
      )}
    </div>
  );
}
