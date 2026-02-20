import type { EditorPreviewProps } from '@/components/blocks/registry';

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || 'Tabla';
  const columns = (c.columns as Column[]) || [];
  const fixedRows = (c.fixedRows as Record<string, unknown>[]) || [];
  const allowAddRows = c.allowAddRows !== false;

  if (columns.length === 0) {
    return (
      <div className="py-2">
        <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
        <div className="rounded border border-dashed border-gray-200 p-4 text-center text-[10px] text-gray-300">
          Sin columnas definidas
        </div>
      </div>
    );
  }

  const displayRows = fixedRows.slice(0, 3);
  const extraRows = fixedRows.length > 3 ? fixedRows.length - 3 : 0;

  return (
    <div className="py-2">
      <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
      <div className="rounded border overflow-hidden">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-gray-800 text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-1 text-left font-medium"
                  style={{ width: col.width !== 'auto' ? col.width : undefined }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.length > 0 ? (
              displayRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50' : ''}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-1 text-gray-500">
                      {String(row[col.key] || '')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // Placeholder rows
              <tr>
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1">
                    <div className="h-3 bg-gray-100 rounded" />
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
        {extraRows > 0 && (
          <div className="bg-gray-50 border-t px-2 py-0.5 text-[9px] text-gray-400 text-center">
            y {extraRows} mas...
          </div>
        )}
        {allowAddRows && (
          <div className="bg-gray-50 border-t px-2 py-0.5 text-[9px] text-gray-400 text-center italic">
            + filas dinamicas
          </div>
        )}
      </div>
    </div>
  );
}
