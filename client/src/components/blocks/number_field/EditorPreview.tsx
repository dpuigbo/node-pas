import type { EditorPreviewProps } from '@/components/blocks/registry';
import { DataFieldPreviewWrapper } from '@/components/blocks/_shared/DataFieldPreviewWrapper';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const unit = (c.unit as string) || '';
  const min = c.min as number | null;
  const max = c.max as number | null;

  return (
    <DataFieldPreviewWrapper block={block}>
      <div className="flex items-center gap-1">
        <div className="h-7 flex-1 rounded border border-gray-200 bg-gray-50 px-2 flex items-center">
          <span className="text-[10px] text-gray-300">0</span>
        </div>
        {unit && (
          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-1 text-[10px] font-medium text-gray-500">
            {unit}
          </span>
        )}
      </div>
      {(min !== null || max !== null) && (
        <div className="text-[9px] text-gray-300 mt-0.5">
          {min !== null && `Min: ${min}`}
          {min !== null && max !== null && ' · '}
          {max !== null && `Max: ${max}`}
        </div>
      )}
    </DataFieldPreviewWrapper>
  );
}
