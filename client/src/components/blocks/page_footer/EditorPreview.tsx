import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const companyName = (c.companyName as string) || 'PAS Robotics';
  const showPageNumbers = c.showPageNumbers !== false;
  const backgroundColor = (c.backgroundColor as string) || '#1f2937';
  const textColor = (c.textColor as string) || '#ffffff';
  const textSize = (c.textSize as number) || 10;
  const backgroundImage = (c.backgroundImage as string) || '';
  const height = (c.height as number) || 36;

  return (
    <div
      className="w-full relative overflow-hidden flex items-center justify-between px-4"
      style={{
        height: `${height}px`,
        backgroundColor,
      }}
    >
      {/* Background image if set */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Company name — left */}
      <span
        className="font-bold relative z-[1]"
        style={{ color: textColor, fontSize: `${textSize}px` }}
      >
        {companyName}
      </span>
      {/* Page numbers — right */}
      {showPageNumbers && (
        <span className="relative z-[1]" style={{ color: textColor, opacity: 0.8, fontSize: `${Math.max(textSize - 1, 7)}px` }}>
          Pagina X de N
        </span>
      )}
    </div>
  );
}
