import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { ColumnsEditor } from '@/components/blocks/_shared/ColumnsEditor';
import { FixedRowsEditor } from '@/components/blocks/_shared/FixedRowsEditor';

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;
  const columns = (c.columns as Column[]) || [];

  return (
    <div className="space-y-3">
      {/* Key */}
      <div className="space-y-1">
        <Label className="text-xs">Clave (snake_case)</Label>
        <Input
          value={(c.key as string) || ''}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase();
            onChange('key', val);
          }}
          placeholder="nombre_tabla"
          className="h-8 font-mono text-xs"
        />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={(c.label as string) || ''}
          onChange={(e) => onChange('label', e.target.value)}
          className="h-8"
        />
      </div>

      {/* Columns */}
      <div className="border-t pt-3">
        <ColumnsEditor
          columns={columns}
          onChange={(cols) => onChange('columns', cols)}
        />
      </div>

      {/* Fixed rows */}
      <div className="border-t pt-3">
        <FixedRowsEditor
          columns={columns}
          rows={(c.fixedRows as Record<string, unknown>[]) || []}
          onChange={(rows) => onChange('fixedRows', rows)}
        />
      </div>

      {/* Table style */}
      <div className="border-t pt-3 space-y-3">
        <Label className="text-xs font-semibold">Estilo de tabla</Label>

        <div className="space-y-1">
          <Label className="text-xs">Color cabecera</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(c.headerBg as string) || '#1f2937'}
              onChange={(e) => onChange('headerBg', e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <Input
              value={(c.headerBg as string) || '#1f2937'}
              onChange={(e) => onChange('headerBg', e.target.value)}
              className="h-8 font-mono text-xs flex-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`compact-${block.id}`}
            checked={!!c.compact}
            onChange={(e) => onChange('compact', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <Label htmlFor={`compact-${block.id}`} className="text-xs cursor-pointer">
            Compacta (padding reducido)
          </Label>
        </div>
      </div>

      {/* Allow add rows */}
      <div className="border-t pt-3 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`allowAdd-${block.id}`}
            checked={c.allowAddRows !== false}
            onChange={(e) => onChange('allowAddRows', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <Label htmlFor={`allowAdd-${block.id}`} className="text-xs cursor-pointer">
            Permitir anadir filas
          </Label>
        </div>

        {c.allowAddRows !== false && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Min filas</Label>
              <Input
                type="number"
                min={0}
                value={(c.minRows as number) || 0}
                onChange={(e) => onChange('minRows', Math.max(0, Number(e.target.value) || 0))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max filas</Label>
              <Input
                type="number"
                min={1}
                value={(c.maxRows as number) || 50}
                onChange={(e) => onChange('maxRows', Math.max(1, Number(e.target.value) || 50))}
                className="h-8"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
