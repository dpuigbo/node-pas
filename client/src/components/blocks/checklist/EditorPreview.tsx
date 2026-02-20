import { Square } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || 'Lista de verificacion';
  const items = (c.items as { key: string; label: string }[]) || [];

  return (
    <div className="py-1">
      <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
      {items.length === 0 ? (
        <div className="text-[10px] text-gray-300 italic">Sin items definidos</div>
      ) : (
        <div className="space-y-0.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Square className="h-3 w-3 text-gray-300 shrink-0" />
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
