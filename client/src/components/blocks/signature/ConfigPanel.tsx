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

      {/* Role */}
      <div className="space-y-1">
        <Label className="text-xs">Rol</Label>
        <Input
          value={(c.role as string) || ''}
          onChange={(e) => onChange('role', e.target.value)}
          placeholder="Tecnico PAS, Responsable cliente..."
          className="h-8"
        />
      </div>

      {/* Required */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`required-${block.id}`}
          checked={!!c.required}
          onChange={(e) => onChange('required', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor={`required-${block.id}`} className="text-xs cursor-pointer">
          Obligatorio
        </Label>
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
                  (c.width || 'half') === value
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
