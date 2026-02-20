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
}

type Row = Record<string, unknown>;

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || 'Tabla';
  const columns = (c.columns as Column[]) || [];
  const allowAddRows = c.allowAddRows !== false;
  const maxRows = (c.maxRows as number) || 50;
  const required = !!c.required;

  const rows = (value as Row[]) ?? [];

  const updateCell = (rowIdx: number, colKey: string, cellValue: string) => {
    if (readOnly) return;
    const next = rows.map((r, i) =>
      i === rowIdx ? { ...r, [colKey]: cellValue || null } : r,
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

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left text-xs font-medium"
                  style={{
                    width: col.width !== 'auto' ? col.width : undefined,
                  }}
                >
                  {col.label}
                </th>
              ))}
              {!readOnly && allowAddRows && (
                <th className="px-2 py-2 w-10" />
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (!readOnly && allowAddRows ? 1 : 0)
                  }
                  className="px-3 py-4 text-center text-xs text-gray-400 italic"
                >
                  Sin datos. {allowAddRows && !readOnly && 'Pulsa + para anadir una fila.'}
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={ri % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-1">
                      <Input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={String(row[col.key] ?? '')}
                        onChange={(e) => updateCell(ri, col.key, e.target.value)}
                        readOnly={readOnly}
                        disabled={readOnly}
                        className="h-8 text-sm border-0 bg-transparent focus-visible:ring-1 px-1"
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
      </div>
      {allowAddRows && !readOnly && rows.length < maxRows && (
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
