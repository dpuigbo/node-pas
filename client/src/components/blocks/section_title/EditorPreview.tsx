import type { EditorPreviewProps } from '@/components/blocks/registry';
import { resolveWithExamples } from '@/lib/placeholders';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = resolveWithExamples((c.title as string) || '');
  const description = resolveWithExamples((c.description as string) || '');
  const level = (c.level as number) || 1;
  const color = (c.color as string) || '#2563eb';

  const sizes: Record<number, string> = {
    1: 'text-base font-bold',
    2: 'text-sm font-semibold',
    3: 'text-xs font-semibold',
  };

  return (
    <div className="flex items-start gap-2 py-2">
      <div
        className="w-1 shrink-0 rounded-full self-stretch"
        style={{ backgroundColor: color }}
      />
      <div>
        <div className={sizes[level] || sizes[1]}>{title}</div>
        {description && (
          <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}
