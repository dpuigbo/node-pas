import type { EditorPreviewProps } from '@/components/blocks/registry';
import { resolveWithExamples } from '@/lib/placeholders';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || '';
  const title = resolveWithExamples((c.title as string) || '');
  const titleBg = (c.titleBg as string) || '#1f2937';
  const titleColor = (c.titleColor as string) || '#ffffff';
  const headerBg = (c.headerBg as string) || '#f3f4f6';
  const headerColor = (c.headerColor as string) || '#92400e';
  const defaultRows = (c.defaultRows as number) || 5;

  const previewCount = Math.min(defaultRows, 3);

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
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr style={{ backgroundColor: headerBg }}>
              <th className="font-medium px-1 py-1 text-center border-r border-white/20" style={{ color: headerColor, width: '7%' }} rowSpan={2}>
                Uds.<br/>Salida
              </th>
              <th className="font-medium px-1 py-1 text-center border-r border-white/20" style={{ color: headerColor }} colSpan={2}>
                Designacion
              </th>
              <th className="font-medium px-1 py-1 text-center border-r border-white/20" style={{ color: headerColor }} colSpan={2}>
                Numero de serie
              </th>
              <th className="font-medium px-1 py-1 text-center border-r border-white/20" style={{ color: headerColor, width: '12%' }} rowSpan={2}>
                Inter-<br/>cambio
              </th>
              <th className="font-medium px-1 py-1 text-center border-r border-white/20" style={{ color: headerColor, width: '8%' }} rowSpan={2}>
                Usado
              </th>
              <th className="font-medium px-1 py-1 text-center" style={{ color: headerColor, width: '7%' }} rowSpan={2}>
                Uds.<br/>Usadas
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: previewCount }).map((_, ri) => {
              const hasData = ri < 2;
              return (
                <tr key={ri}>
                  {/* Uds Salida */}
                  <td className="border border-gray-200 text-center text-gray-400 align-middle py-2" rowSpan={1}>
                    {hasData ? '1' : '-'}
                  </td>
                  {/* Designacion: Entrada + Salida stacked */}
                  <td className="border border-gray-200 p-0" colSpan={2}>
                    <div className="flex border-b border-gray-100">
                      <span className="bg-gray-50 px-1.5 py-0.5 font-medium text-gray-500 border-r border-gray-100 shrink-0 w-[38px]">Entrada</span>
                      <span className="px-1.5 py-0.5 text-gray-400 flex-1 break-all">{hasData ? '3HAC044075-001' : '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="bg-gray-50 px-1.5 py-0.5 font-medium text-gray-500 border-r border-gray-100 shrink-0 w-[38px]">Salida</span>
                      <span className="px-1.5 py-0.5 text-gray-400 flex-1 break-all">{hasData ? '3HAC044075-001' : '-'}</span>
                    </div>
                  </td>
                  {/* Numero de serie: Entrada + Salida stacked */}
                  <td className="border border-gray-200 p-0" colSpan={2}>
                    <div className="flex border-b border-gray-100">
                      <span className="bg-gray-50 px-1.5 py-0.5 font-medium text-gray-500 border-r border-gray-100 shrink-0 w-[38px]">Entrada</span>
                      <span className="px-1.5 py-0.5 text-gray-400 flex-1 break-all">-</span>
                    </div>
                    <div className="flex">
                      <span className="bg-gray-50 px-1.5 py-0.5 font-medium text-gray-500 border-r border-gray-100 shrink-0 w-[38px]">Salida</span>
                      <span className="px-1.5 py-0.5 text-gray-400 flex-1 break-all">-</span>
                    </div>
                  </td>
                  {/* Intercambio */}
                  <td className="border border-gray-200 text-center align-middle">
                    <div className="flex justify-center">
                      <div className="h-2.5 w-2.5 rounded-sm border border-gray-300" />
                    </div>
                  </td>
                  {/* Usado */}
                  <td className="border border-gray-200 text-center align-middle">
                    <div className="flex justify-center">
                      <div className={`h-2.5 w-2.5 rounded-sm border ${hasData ? 'bg-gray-700 border-gray-700' : 'border-gray-300'}`} />
                    </div>
                  </td>
                  {/* Uds usadas */}
                  <td className="border border-gray-200 text-center text-gray-400 align-middle">
                    {hasData ? '1' : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="bg-gray-50 border-t px-2 py-0.5 text-[8px] text-gray-400 text-center italic">
          + filas dinamicas
        </div>
      </div>
    </div>
  );
}
