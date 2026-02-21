import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const companyName = (c.companyName as string) || 'PAS Robotics';
  const showPageNumbers = c.showPageNumbers !== false;
  const showTriangle = c.showTriangle !== false;
  const backgroundColor = (c.backgroundColor as string) || '#1f2937';

  return (
    <div className="w-full relative mt-2">
      {/* Decorative triangle */}
      {showTriangle && (
        <div
          className="absolute bottom-0 right-0"
          style={{
            width: 0,
            height: 0,
            borderRight: `80px solid ${backgroundColor}`,
            borderTop: '80px solid transparent',
          }}
        />
      )}
      {/* Footer bar */}
      <div
        className="flex items-end justify-between px-2 pb-1"
        style={{ minHeight: '30px' }}
      >
        <span
          className="text-[10px] font-bold"
          style={{ color: backgroundColor }}
        >
          {companyName}
        </span>
        {showPageNumbers && (
          <span className="text-[9px] text-gray-400 relative z-10">
            Pagina X de N
          </span>
        )}
      </div>
    </div>
  );
}
