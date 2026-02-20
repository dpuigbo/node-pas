import { ChevronDown } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { DataFieldPreviewWrapper } from '@/components/blocks/_shared/DataFieldPreviewWrapper';

export function EditorPreview({ block }: EditorPreviewProps) {
  const options = (block.config.options as { value: string; label: string }[]) || [];

  return (
    <DataFieldPreviewWrapper block={block}>
      <div className="h-7 rounded border border-gray-200 bg-gray-50 px-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-300">
          {options.length > 0 ? `${options.length} opciones` : 'Sin opciones'}
        </span>
        <ChevronDown className="h-3 w-3 text-gray-300" />
      </div>
    </DataFieldPreviewWrapper>
  );
}
