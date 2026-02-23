import type { EditorPreviewProps } from '@/components/blocks/registry';
import { resolveWithExamples } from '@/lib/placeholders';

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

/** Preview for header on top (classic table layout) */
function TopHeaderPreview({
  columns,
  fixedRows,
  headerBg,
  headerColor,
  cellPad,
  allowAddRows,
}: {
  columns: Column[];
  fixedRows: Record<string, unknown>[];
  headerBg: string;
  headerColor: string;
  cellPad: string;
  allowAddRows: boolean;
}) {
  const displayRows = fixedRows.slice(0, 3);
  const extraRows = fixedRows.length > 3 ? fixedRows.length - 3 : 0;

  return (
    <>
      <table className="w-full text-[10px]">
        <thead>
          <tr style={{ backgroundColor: headerBg }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${cellPad} text-left font-medium`}
                style={{ width: col.width !== 'auto' ? col.width : undefined, color: headerColor }}
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
    </>
  );
}

/** Preview for lateral header (first column = labels on the left) */
function LeftHeaderPreview({
  columns,
  fixedRows,
  headerBg,
  headerColor,
  cellPad,
}: {
  columns: Column[];
  fixedRows: Record<string, unknown>[];
  headerBg: string;
  headerColor: string;
  cellPad: string;
}) {
  // In lateral mode, each column becomes a row; fixedRows[0] provides data columns
  // We show column labels on the left as header cells, and values horizontally
  const dataCols = fixedRows.length > 0 ? fixedRows.length : 1;
  const displayCols = Math.min(dataCols, 3);

  return (
    <table className="w-full text-[10px]">
      <tbody>
        {columns.map((col, ci) => (
          <tr key={col.key} className={ci % 2 === 1 ? 'bg-gray-50' : ''}>
            <th
              className={`${cellPad} text-left font-medium whitespace-nowrap`}
              style={{ backgroundColor: headerBg, color: headerColor, width: '35%' }}
            >
              {col.label}
            </th>
            {Array.from({ length: displayCols }).map((_, di) => {
              const row = fixedRows[di];
              return (
                <td key={di} className={cellPad}>
                  {row ? (
                    <CellPreview col={col} value={row[col.key]} />
                  ) : (
                    <div className="h-3 bg-gray-100 rounded" />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || '';
  const title = resolveWithExamples((c.title as string) || '');
  const titleBg = (c.titleBg as string) || '#1f2937';
  const titleColor = (c.titleColor as string) || '#ffffff';
  const columns = (c.columns as Column[]) || [];
  const fixedRows = (c.fixedRows as Record<string, unknown>[]) || [];
  const allowAddRows = c.allowAddRows !== false;
  const headerBg = (c.headerBg as string) || '#1f2937';
  const headerColor = (c.headerColor as string) || '#ffffff';
  const compact = !!c.compact;
  const headerPosition = (c.headerPosition as string) || 'top';

  if (columns.length === 0) {
    return (
      <div className="py-2">
        {label && <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>}
        <div className="border border-dashed border-gray-200 p-4 text-center text-[10px] text-gray-300">
          Sin columnas definidas
        </div>
      </div>
    );
  }

  const cellPad = compact ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <div className="py-2">
      {label && <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>}
      <div className="border overflow-hidden">
        {/* Title bar */}
        {title && (
          <div
            className="px-3 py-1.5 text-[11px] font-semibold"
            style={{ backgroundColor: titleBg, color: titleColor }}
          >
            {title}
          </div>
        )}

        {headerPosition === 'left' ? (
          <LeftHeaderPreview
            columns={columns}
            fixedRows={fixedRows}
            headerBg={headerBg}
            headerColor={headerColor}
            cellPad={cellPad}
          />
        ) : (
          <TopHeaderPreview
            columns={columns}
            fixedRows={fixedRows}
            headerBg={headerBg}
            headerColor={headerColor}
            cellPad={cellPad}
            allowAddRows={allowAddRows}
          />
        )}
      </div>
    </div>
  );
}
