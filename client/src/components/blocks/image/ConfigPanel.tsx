import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { FIELD_WIDTH_LABELS, type FieldWidth } from '@/types/editor';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

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
          placeholder="nombre_campo"
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

      {/* Allow multiple */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`multi-${block.id}`}
          checked={!!c.allowMultiple}
          onChange={(e) => onChange('allowMultiple', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor={`multi-${block.id}`} className="text-xs cursor-pointer">
          Permitir multiples
        </Label>
      </div>

      {/* Max files */}
      <div className="space-y-1">
        <Label className="text-xs">Maximo de archivos</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={(c.maxFiles as number) || 1}
          onChange={(e) => onChange('maxFiles', Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="h-8"
        />
      </div>

      {/* Max size */}
      <div className="space-y-1">
        <Label className="text-xs">Tamano maximo (MB)</Label>
        <Input
          type="number"
          min={1}
          max={50}
          value={(c.maxSizeMB as number) || 5}
          onChange={(e) => onChange('maxSizeMB', Math.max(1, Math.min(50, Number(e.target.value) || 5)))}
          className="h-8"
        />
      </div>

      {/* Width */}
      <div className="space-y-1">
        <Label className="text-xs">Ancho</Label>
        <div className="grid grid-cols-2 gap-1">
          {(Object.entries(FIELD_WIDTH_LABELS) as [FieldWidth, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                className={`rounded border px-2 py-1 text-xs ${
                  (c.width || 'full') === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => onChange('width', value)}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
