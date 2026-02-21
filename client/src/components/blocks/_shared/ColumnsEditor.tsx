import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
  options?: string[]; // for select type
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Numero' },
  { value: 'date', label: 'Fecha' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'tristate', label: 'Tristate' },
  { value: 'select', label: 'Selector' },
];

interface ColumnsEditorProps {
  columns: Column[];
  onChange: (columns: Column[]) => void;
}

export function ColumnsEditor({ columns, onChange }: ColumnsEditorProps) {
  const addColumn = () => {
    const idx = columns.length + 1;
    onChange([
      ...columns,
      { key: `col_${idx}`, label: `Columna ${idx}`, type: 'text', width: 'auto' },
    ]);
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: keyof Column, val: unknown) => {
    const updated = columns.map((col, i) =>
      i === index ? { ...col, [field]: val } : col,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Columnas</Label>

      {columns.length === 0 && (
        <p className="text-[10px] text-muted-foreground">Sin columnas definidas</p>
      )}

      {columns.map((col, i) => (
        <div key={i} className="rounded border p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground">
              Columna {i + 1}
            </span>
            <button
              onClick={() => removeColumn(i)}
              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Input
              value={col.key}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase();
                updateColumn(i, 'key', val);
              }}
              placeholder="clave"
              className="h-6 text-[10px] font-mono"
            />
            <Input
              value={col.label}
              onChange={(e) => updateColumn(i, 'label', e.target.value)}
              placeholder="Etiqueta"
              className="h-6 text-[10px]"
            />
          </div>
          <div className="flex gap-1">
            <select
              value={col.type}
              onChange={(e) => updateColumn(i, 'type', e.target.value)}
              className="h-6 flex-1 rounded border text-[10px] px-1"
            >
              {COLUMN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <Input
              value={col.width}
              onChange={(e) => updateColumn(i, 'width', e.target.value)}
              placeholder="auto"
              className="h-6 w-16 text-[10px]"
              title="Ancho (auto, 100px, 20%, etc.)"
            />
          </div>
          {col.type === 'select' && (
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-foreground">Opciones (una por linea)</span>
              <textarea
                value={(col.options || []).join('\n')}
                onChange={(e) => {
                  const opts = e.target.value.split('\n').filter((s) => s.trim());
                  updateColumn(i, 'options', opts);
                }}
                placeholder="Opcion 1&#10;Opcion 2"
                className="w-full rounded border text-[10px] px-1 py-0.5 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={addColumn}>
        <Plus className="h-3 w-3 mr-1" />
        Anadir columna
      </Button>
    </div>
  );
}
