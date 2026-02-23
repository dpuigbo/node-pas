import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';

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
          placeholder="bateria_controlador"
          className="h-8 font-mono text-xs"
        />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={(c.label as string) || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="Bateria controlador"
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

      <p className="text-xs text-muted-foreground leading-relaxed">
        Seleccion de bateria para el controlador del catalogo de consumibles.
        Muestra baterias compatibles con controlador (controller).
      </p>
    </div>
  );
}
