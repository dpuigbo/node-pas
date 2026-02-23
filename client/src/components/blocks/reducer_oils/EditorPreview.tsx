import type { EditorPreviewProps } from '@/components/blocks/registry';
import { resolveWithExamples } from '@/lib/placeholders';

interface FixedRow {
  eje: number | string;
  tipoSuministro: string;
  volumen: string;
}

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || '';
  const title = resolveWithExamples((c.title as string) || '');
  const titleBg = (c.titleBg as string) || '#1f2937';
  const titleColor = (c.titleColor as string) || '#ffffff';
  const headerBg = (c.headerBg as string) || '#f3f4f6';
  const headerColor = (c.headerColor as string) || '#1f2937';
  const fixedRows = (c.fixedRows as FixedRow[]) || [];
  const previewRows = fixedRows.slice(0, 5);
  const extraRows = fixedRows.length > 5 ? fixedRows.length - 5 : 0;

  return (
    <div className="w-full py-1">
      {label && (
        <div className="text-xs font-bold mb-1.5 px-1">{label}</div>
      )}
      <div className="rounded-sm border overflow-hidden">
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
              <th className="font-medium px-2 py-1 text-left" style={{ color: headerColor, width: '7%' }}>Eje</th>
              <th className="font-medium px-2 py-1 text-left" style={{ color: headerColor, width: '30%' }}>Tipo suministro</th>
              <th className="font-medium px-2 py-1 text-left" style={{ color: headerColor, width: '15%' }}>Volumen</th>
              <th className="font-medium px-2 py-1 text-center" style={{ color: headerColor, width: '12%' }}>Control</th>
              <th className="font-medium px-2 py-1 text-center" style={{ color: headerColor, width: '12%' }}>Cambio</th>
              <th className="font-medium px-2 py-1 text-left" style={{ color: headerColor, width: '24%' }}>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.length > 0 ? (
              previewRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="px-2 py-1 text-gray-500 border-t border-gray-100">{row.eje}</td>
                  <td className="px-2 py-1 text-gray-500 border-t border-gray-100">{row.tipoSuministro || '—'}</td>
                  <td className="px-2 py-1 text-gray-500 border-t border-gray-100">{row.volumen || '-'}</td>
                  <td className="px-2 py-1 border-t border-gray-100 text-center">
                    <div className="flex justify-center"><div className="h-2.5 w-2.5 rounded-sm border border-gray-300" /></div>
                  </td>
                  <td className="px-2 py-1 border-t border-gray-100 text-center">
                    <div className="flex justify-center"><div className="h-2.5 w-2.5 rounded-sm border border-gray-300" /></div>
                  </td>
                  <td className="px-2 py-1 text-gray-400 border-t border-gray-100">-</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-3 py-3 text-center text-gray-300 italic">
                  Sin filas definidas. Configura las filas en el panel de propiedades.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {extraRows > 0 && (
          <div className="bg-gray-50 border-t px-2 py-0.5 text-[9px] text-gray-400 text-center">
            y {extraRows} mas...
          </div>
        )}
      </div>
    </div>
  );
}
