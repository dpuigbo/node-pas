import { Image } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || 'Imagen';
  const maxFiles = (c.maxFiles as number) || 1;

  return (
    <div className="py-1">
      <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
      <div className="flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 gap-1">
        <Image className="h-8 w-8 text-gray-300" />
        <span className="text-[10px] text-gray-400">
          Hasta {maxFiles} archivo{maxFiles > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
