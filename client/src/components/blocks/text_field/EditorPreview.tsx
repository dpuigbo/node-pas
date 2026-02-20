import type { EditorPreviewProps } from '@/components/blocks/registry';
import { DataFieldPreviewWrapper } from '@/components/blocks/_shared/DataFieldPreviewWrapper';

export function EditorPreview({ block }: EditorPreviewProps) {
  const placeholder = (block.config.placeholder as string) || '';

  return (
    <DataFieldPreviewWrapper block={block}>
      <div className="h-7 rounded border border-gray-200 bg-gray-50 px-2 flex items-center">
        {placeholder && (
          <span className="text-[10px] text-gray-300">{placeholder}</span>
        )}
      </div>
    </DataFieldPreviewWrapper>
  );
}
