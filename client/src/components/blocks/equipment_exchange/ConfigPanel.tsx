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
          placeholder="intercambio_equipos"
          className="h-8 font-mono text-xs"
        />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={(c.label as string) || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="Intercambio de equipos"
          className="h-8"
        />
      </div>

      {/* Default rows */}
      <div className="space-y-1">
        <Label className="text-xs">Filas por defecto</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={(c.defaultRows as number) || 5}
          onChange={(e) => onChange('defaultRows', parseInt(e.target.value) || 5)}
          className="h-8"
        />
      </div>

      {/* Header background color */}
      <div className="space-y-1">
        <Label className="text-xs">Color cabecera</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(c.headerBg as string) || '#1f2937'}
            onChange={(e) => onChange('headerBg', e.target.value)}
            className="h-8 w-10 rounded border cursor-pointer"
          />
          <Input
            value={(c.headerBg as string) || '#1f2937'}
            onChange={(e) => onChange('headerBg', e.target.value)}
            className="h-8 flex-1 font-mono text-xs"
          />
        </div>
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
        Tabla de intercambio de equipos con entrada/salida de designaciones,
        numeros de serie, y control de unidades usadas.
      </p>
    </div>
  );
}
