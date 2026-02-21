import {
  FileText, Heading, Minus, Type, Hash, Calendar, AlignLeft,
  ChevronDown, CheckCircle, ListChecks, Table, Image, Pen,
  List, BookOpen, PanelTop, PanelBottom, Square,
  SeparatorHorizontal, LayoutTemplate, ClipboardList, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { blockCategories, blockDefinitions } from '@/components/blocks/registry';
import { useEditorStore } from '@/stores/useEditorStore';

// Map icon name strings to actual Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Heading, Minus, Type, Hash, Calendar, AlignLeft,
  ChevronDown, CheckCircle, ListChecks, Table, Image, Pen,
  List, BookOpen, PanelTop, PanelBottom, Square,
  SeparatorHorizontal, LayoutTemplate, ClipboardList, Building2,
};

export function BlockPalette() {
  const addBlock = useEditorStore((s) => s.addBlock);
  const isDocumentTemplate = useEditorStore((s) => s.isDocumentTemplate);

  return (
    <div className="flex w-56 flex-col border-r bg-background overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Bloques
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {blockCategories.map((cat) => {
          // Hide 'document' category for non-template editors
          if (cat.id === 'document' && !isDocumentTemplate) return null;
          // Filter out types that shouldn't appear in the palette
          const visibleTypes = cat.types.filter((t) => t !== 'section_separator');
          if (visibleTypes.length === 0) return null;
          return (
          <div key={cat.id}>
            <p className="px-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {cat.label}
            </p>
            <div className="space-y-0.5">
              {visibleTypes.map((type) => {
                const def = blockDefinitions[type];
                const Icon = iconMap[def.icon];
                return (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm',
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      'cursor-pointer select-none',
                    )}
                    title={`Anadir ${def.label}`}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="truncate">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
