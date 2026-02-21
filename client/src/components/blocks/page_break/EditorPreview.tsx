import { Scissors } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({}: EditorPreviewProps) {
  return (
    <div className="w-full flex items-center gap-3 py-2 px-4">
      <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
      <div className="flex items-center gap-1 text-muted-foreground/50 shrink-0">
        <Scissors className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium">Salto de pagina</span>
      </div>
      <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
    </div>
  );
}
