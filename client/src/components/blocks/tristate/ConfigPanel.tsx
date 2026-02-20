import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { MAINTENANCE_LEVEL_LABELS, type MaintenanceLevel } from '@/types/editor';

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

      {/* Maintenance level */}
      <div className="space-y-1">
        <Label className="text-xs">Nivel de mantenimiento</Label>
        <div className="grid grid-cols-2 gap-1">
          {(Object.entries(MAINTENANCE_LEVEL_LABELS) as [MaintenanceLevel, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                className={`rounded border px-2 py-1 text-xs ${
                  (c.maintenanceLevel || 'general') === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => onChange('maintenanceLevel', value)}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      {/* With observation */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`withObs-${block.id}`}
          checked={c.withObservation !== false}
          onChange={(e) => onChange('withObservation', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor={`withObs-${block.id}`} className="text-xs cursor-pointer">
          Con campo de observaciones
        </Label>
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
    </div>
  );
}
