import type { EditorPreviewProps } from '@/components/blocks/registry';

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

function CellPreview({ col, value }: { col: Column; value: unknown }) {
  const str = String(value ?? '');

  switch (col.type) {
    case 'checkbox':
      return (
        <div className="flex justify-center">
          <div className={`h-3 w-3 rounded-sm border ${str === 'true' ? 'bg-primary border-primary' : 'border-gray-300'}`} />
        </div>
      );

    case 'tristate': {
      const v = str || null;
      return (
        <div className="flex gap-0.5 justify-center">
          {(['OK', 'NOK', 'NA'] as const).map((opt) => (
            <span
              key={opt}
              className={`px-1 rounded text-[8px] font-medium ${
                v === opt
                  ? opt === 'OK'
                    ? 'bg-green-100 text-green-700'
                    : opt === 'NOK'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500'
                  : 'text-gray-300'
              }`}
            >
              {opt}
            </span>
          ))}
        </div>
      );
    }

    case 'select':
      return <span className="text-gray-400 italic">{str || 'Seleccionar...'}</span>;

    default:
      return <span className="text-gray-500">{str}</span>;
  }
}

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || 'Tabla';
  const columns = (c.columns as Column[]) || [];
  const fixedRows = (c.fixedRows as Record<string, unknown>[]) || [];
  const allowAddRows = c.allowAddRows !== false;
  const headerBg = (c.headerBg as string) || '#1f2937';
  const compact = !!c.compact;

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
  const cellPad = compact ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <div className="py-2">
      <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
      <div className="rounded border overflow-hidden">
        <table className="w-full text-[10px]">
          <thead>
            <tr style={{ backgroundColor: headerBg }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${cellPad} text-left font-medium text-white`}
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
                    <td key={col.key} className={cellPad}>
                      <CellPreview col={col} value={row[col.key]} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                {columns.map((col) => (
                  <td key={col.key} className={cellPad}>
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
