import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FormFieldProps } from '@/types/formField';

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
  options?: string[];
}

type Row = Record<string, unknown>;

// ======================== Cell renderers ========================

function CellInput({
  col,
  value,
  onChange,
  readOnly,
}: {
  col: Column;
  value: unknown;
  onChange: (v: unknown) => void;
  readOnly: boolean;
}) {
  switch (col.type) {
    case 'checkbox':
      return (
        <div className="flex justify-center py-1">
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      );

    case 'tristate': {
      const current = value as string | null;
      const options: { label: string; color: string; activeColor: string }[] = [
        { label: 'OK', color: 'text-gray-400 border-gray-200', activeColor: 'bg-green-100 text-green-700 border-green-300' },
        { label: 'NOK', color: 'text-gray-400 border-gray-200', activeColor: 'bg-red-100 text-red-700 border-red-300' },
        { label: 'NA', color: 'text-gray-400 border-gray-200', activeColor: 'bg-gray-100 text-gray-600 border-gray-300' },
      ];

      return (
        <div className="flex gap-0.5 justify-center py-0.5">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              disabled={readOnly}
              className={`px-1.5 py-0.5 rounded border text-[11px] font-medium transition-colors ${
                current === opt.label ? opt.activeColor : opt.color
              } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
              onClick={() => {
                if (readOnly) return;
                onChange(current === opt.label ? null : opt.label);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    case 'select': {
      const selectOpts = col.options || [];
      return (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={readOnly}
          className="h-8 w-full rounded border-0 bg-transparent text-sm px-1 focus:ring-1 focus:ring-primary"
        >
          <option value="">—</option>
          {selectOpts.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    case 'date':
      return (
        <Input
          type="date"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
          readOnly={readOnly}
          disabled={readOnly}
          className="h-8 text-sm border-0 bg-transparent focus-visible:ring-1 px-1"
        />
      );

    default:
      return (
        <Input
          type={col.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
          readOnly={readOnly}
          disabled={readOnly}
          className="h-8 text-sm border-0 bg-transparent focus-visible:ring-1 px-1"
        />
      );
  }
}

// ======================== Top header layout ========================

function TopHeaderTable({
  columns,
  rows,
  headerBg,
  headerColor,
  cellPad,
  allowAddRows,
  readOnly,
  updateCell,
  removeRow,
}: {
  columns: Column[];
  rows: Row[];
  headerBg: string;
  headerColor: string;
  cellPad: string;
  allowAddRows: boolean;
  readOnly: boolean;
  updateCell: (ri: number, colKey: string, value: unknown) => void;
  removeRow: (ri: number) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ backgroundColor: headerBg }}>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`${cellPad} text-left text-xs font-medium`}
              style={{ width: col.width !== 'auto' ? col.width : undefined, color: headerColor }}
            >
              {col.label}
            </th>
          ))}
          {!readOnly && allowAddRows && (
            <th className={`${cellPad} w-10`} />
          )}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length + (!readOnly && allowAddRows ? 1 : 0)}
              className="px-3 py-4 text-center text-xs text-gray-400 italic"
            >
              Sin datos. {allowAddRows && !readOnly && 'Pulsa + para anadir una fila.'}
            </td>
          </tr>
        ) : (
          rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
              {columns.map((col) => (
                <td key={col.key} className={cellPad}>
                  <CellInput
                    col={col}
                    value={row[col.key]}
                    onChange={(v) => updateCell(ri, col.key, v)}
                    readOnly={!!readOnly}
                  />
                </td>
              ))}
              {!readOnly && allowAddRows && (
                <td className="px-1 py-1 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-500"
                    onClick={() => removeRow(ri)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ======================== Left header layout ========================

function LeftHeaderTable({
  columns,
  rows,
  headerBg,
  headerColor,
  cellPad,
  readOnly,
  updateCell,
}: {
  columns: Column[];
  rows: Row[];
  headerBg: string;
  headerColor: string;
  cellPad: string;
  readOnly: boolean;
  updateCell: (ri: number, colKey: string, value: unknown) => void;
}) {
  // Lateral: each column becomes a row, each row becomes a data column
  // First cell is the header label, remaining cells are data for each row
  const dataCount = Math.max(rows.length, 1);

  return (
    <table className="w-full text-sm">
      <tbody>
        {columns.map((col, ci) => (
          <tr key={col.key} className={ci % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
            <th
              className={`${cellPad} text-left text-xs font-medium whitespace-nowrap`}
              style={{ backgroundColor: headerBg, color: headerColor, width: '35%' }}
            >
              {col.label}
            </th>
            {rows.length === 0 ? (
              <td className={cellPad}>
                <span className="text-xs text-gray-400 italic">Sin datos</span>
              </td>
            ) : (
              rows.map((row, ri) => (
                <td key={ri} className={cellPad} style={{ width: `${65 / dataCount}%` }}>
                  <CellInput
                    col={col}
                    value={row[col.key]}
                    onChange={(v) => updateCell(ri, col.key, v)}
                    readOnly={!!readOnly}
                  />
                </td>
              ))
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ======================== Main FormField ========================

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || '';
  const title = (c.title as string) || '';
  const titleBg = (c.titleBg as string) || '#1f2937';
  const titleColor = (c.titleColor as string) || '#ffffff';
  const columns = (c.columns as Column[]) || [];
  const allowAddRows = c.allowAddRows !== false;
  const maxRows = (c.maxRows as number) || 50;
  const required = !!c.required;
  const headerBg = (c.headerBg as string) || '#1f2937';
  const headerColor = (c.headerColor as string) || '#ffffff';
  const compact = !!c.compact;
  const headerPosition = (c.headerPosition as string) || 'top';

  const rows = (value as Row[]) ?? [];

  const updateCell = (rowIdx: number, colKey: string, cellValue: unknown) => {
    if (readOnly) return;
    const next = rows.map((r, i) =>
      i === rowIdx ? { ...r, [colKey]: cellValue } : r,
    );
    onChange(next);
  };

  const addRow = () => {
    if (readOnly || rows.length >= maxRows) return;
    const empty: Row = {};
    for (const col of columns) {
      empty[col.key] = null;
    }
    onChange([...rows, empty]);
  };

  const removeRow = (rowIdx: number) => {
    if (readOnly) return;
    onChange(rows.filter((_, i) => i !== rowIdx));
  };

  if (columns.length === 0) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground italic">Sin columnas definidas</p>
      </div>
    );
  }

  const cellPad = compact ? 'px-1 py-0.5' : 'px-2 py-1';

  return (
    <div className="space-y-2">
      {(label || required) && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      <div className="border overflow-x-auto">
        {/* Title bar */}
        {title && (
          <div
            className="px-3 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: titleBg, color: titleColor }}
          >
            {title}
          </div>
        )}

        {headerPosition === 'left' ? (
          <LeftHeaderTable
            columns={columns}
            rows={rows}
            headerBg={headerBg}
            headerColor={headerColor}
            cellPad={cellPad}
            readOnly={!!readOnly}
            updateCell={updateCell}
          />
        ) : (
          <TopHeaderTable
            columns={columns}
            rows={rows}
            headerBg={headerBg}
            headerColor={headerColor}
            cellPad={cellPad}
            allowAddRows={allowAddRows}
            readOnly={!!readOnly}
            updateCell={updateCell}
            removeRow={removeRow}
          />
        )}
      </div>
      {headerPosition === 'top' && allowAddRows && !readOnly && rows.length < maxRows && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={addRow}
        >
          <Plus className="h-3.5 w-3.5" />
          Anadir fila
        </Button>
      )}
    </div>
  );
}
