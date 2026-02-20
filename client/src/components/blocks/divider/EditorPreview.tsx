import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const style = (c.style as string) || 'solid';
  const spacing = (c.spacing as string) || 'medium';
  const color = (c.color as string) || '#e5e7eb';

  const spacingMap: Record<string, string> = {
    small: 'py-1',
    medium: 'py-3',
    large: 'py-5',
  };

  if (style === 'space') {
    return <div className={spacingMap[spacing] || spacingMap.medium} />;
  }

  const borderStyle =
    style === 'dashed' ? 'dashed' : style === 'dotted' ? 'dotted' : 'solid';

  return (
    <div className={spacingMap[spacing] || spacingMap.medium}>
      <hr
        style={{ borderTopStyle: borderStyle, borderTopColor: color, borderTopWidth: '1px' }}
        className="border-0"
      />
    </div>
  );
}
