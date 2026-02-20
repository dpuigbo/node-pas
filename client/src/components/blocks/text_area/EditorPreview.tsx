import type { EditorPreviewProps } from '@/components/blocks/registry';
import { DataFieldPreviewWrapper } from '@/components/blocks/_shared/DataFieldPreviewWrapper';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const rows = (c.rows as number) || 3;
  const placeholder = (c.placeholder as string) || '';

  return (
    <DataFieldPreviewWrapper block={block}>
      <div
        className="rounded border border-gray-200 bg-gray-50 px-2 py-1"
        style={{ minHeight: `${rows * 18}px` }}
      >
        {placeholder && (
          <span className="text-[10px] text-gray-300">{placeholder}</span>
        )}
      </div>
    </DataFieldPreviewWrapper>
  );
}
