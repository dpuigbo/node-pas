import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Column {
  key: string;
  label: string;
  type: string;
}

interface FixedRowsEditorProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  onChange: (rows: Record<string, unknown>[]) => void;
}

export function FixedRowsEditor({ columns, rows, onChange }: FixedRowsEditorProps) {
  if (columns.length === 0) {
    return (
      <div className="space-y-1">
        <Label className="text-xs">Filas fijas</Label>
        <p className="text-[10px] text-muted-foreground">
          Define columnas primero para poder anadir filas fijas.
        </p>
      </div>
    );
  }

  const addRow = () => {
    const emptyRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      emptyRow[col.key] = '';
    });
    onChange([...rows, emptyRow]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateCell = (rowIndex: number, colKey: string, value: string) => {
    const updated = rows.map((row, i) =>
      i === rowIndex ? { ...row, [colKey]: value } : row,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Filas fijas ({rows.length})</Label>

      {rows.length > 0 && (
        <div className="rounded border overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-muted/50">
                {columns.map((col) => (
                  <th key={col.key} className="px-1.5 py-1 text-left font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-t">
                  {columns.map((col) => (
                    <td key={col.key} className="px-0.5 py-0.5">
                      <Input
                        value={String(row[col.key] || '')}
                        onChange={(e) => updateCell(ri, col.key, e.target.value)}
                        className="h-5 text-[10px] border-0 bg-transparent px-1"
                      />
                    </td>
                  ))}
                  <td className="px-0.5">
                    <button
                      onClick={() => removeRow(ri)}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={addRow}>
        <Plus className="h-3 w-3 mr-1" />
        Anadir fila fija
      </Button>
    </div>
  );
}
