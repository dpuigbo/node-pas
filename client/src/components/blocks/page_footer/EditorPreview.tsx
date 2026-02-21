import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const companyName = (c.companyName as string) || 'PAS Robotics';
  const showPageNumbers = c.showPageNumbers !== false;
  const backgroundColor = (c.backgroundColor as string) || '#1f2937';
  const accentColor = (c.accentColor as string) || '#3b82f6';
  const height = (c.height as number) || 36;

  return (
    <div className="w-full relative overflow-hidden" style={{ height: `${height}px` }}>
      {/* Diagonal accent shape — like the reference PDF */}
      <div
        className="absolute right-0 top-0 bottom-0"
        style={{
          width: '120px',
          background: `linear-gradient(135deg, transparent 40%, ${accentColor} 40%, ${accentColor} 55%, ${backgroundColor} 55%)`,
        }}
      />
      {/* Main footer bar */}
      <div
        className="absolute right-0 bottom-0"
        style={{
          width: '75px',
          height: '100%',
          backgroundColor,
        }}
      />
      {/* Company name */}
      <div
        className="absolute left-0 bottom-0 flex items-center h-full px-4"
      >
        <span
          className="text-[10px] font-bold"
          style={{ color: backgroundColor }}
        >
          {companyName}
        </span>
      </div>
      {/* Page numbers */}
      {showPageNumbers && (
        <div className="absolute right-0 bottom-0 flex items-center h-full px-3">
          <span className="text-[9px] text-white/80">
            Pagina X de N
          </span>
        </div>
      )}
    </div>
  );
}
