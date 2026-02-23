import type { EditorPreviewProps } from '@/components/blocks/registry';
import { resolveWithExamples } from '@/lib/placeholders';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || '';
  const title = resolveWithExamples((c.title as string) || '');
  const titleBg = (c.titleBg as string) || '#1f2937';
  const titleColor = (c.titleColor as string) || '#ffffff';
  const headerBg = (c.headerBg as string) || '#f3f4f6';
  const headerColor = (c.headerColor as string) || '#1f2937';
  const defaultRows = (c.defaultRows as number) || 6;
  const previewCount = Math.min(defaultRows, 4);

  return (
    <div className="w-full py-1">
      {label && (
        <div className="text-xs font-bold mb-1.5 px-1">{label}</div>
      )}
      <div className="border overflow-hidden">
        {title && (
          <div
            className="px-3 py-1.5 text-[11px] font-semibold"
            style={{ backgroundColor: titleBg, color: titleColor }}
          >
            {title}
          </div>
        )}
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr style={{ backgroundColor: headerBg }}>
              <th className="font-medium px-2 py-1 text-left" style={{ color: headerColor, width: '10%' }}>Eje</th>
              <th className="font-medium px-2 py-1 text-left" style={{ color: headerColor, width: '25%' }}>Nivel</th>
              <th className="font-medium px-2 py-1 text-left" style={{ color: headerColor, width: '45%' }}>Aceite / Grasa</th>
              <th className="font-medium px-2 py-1 text-left" style={{ color: headerColor, width: '20%' }}>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: previewCount }).map((_, ri) => (
              <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="px-2 py-1 text-gray-400 border-t border-gray-100">{ri + 1}</td>
                <td className="px-2 py-1 text-gray-400 border-t border-gray-100">N1</td>
                <td className="px-2 py-1 text-gray-300 italic border-t border-gray-100">Seleccionar aceite...</td>
                <td className="px-2 py-1 text-gray-400 border-t border-gray-100">—</td>
              </tr>
            ))}
          </tbody>
        </table>
        {defaultRows > previewCount && (
          <div className="bg-gray-50 border-t px-2 py-0.5 text-[9px] text-gray-400 text-center">
            y {defaultRows - previewCount} mas...
          </div>
        )}
      </div>
    </div>
  );
}
