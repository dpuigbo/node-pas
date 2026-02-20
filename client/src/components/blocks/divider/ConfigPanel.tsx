import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ConfigPanelProps } from '@/components/blocks/registry';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  const styles = [
    { value: 'solid', label: 'Solido' },
    { value: 'dashed', label: 'Discontinuo' },
    { value: 'dotted', label: 'Punteado' },
    { value: 'space', label: 'Espacio' },
  ];

  const spacings = [
    { value: 'small', label: 'Pequeno' },
    { value: 'medium', label: 'Mediano' },
    { value: 'large', label: 'Grande' },
  ];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Estilo</Label>
        <div className="grid grid-cols-2 gap-1">
          {styles.map((s) => (
            <button
              key={s.value}
              className={`rounded border px-2 py-1 text-xs ${
                (c.style || 'solid') === s.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange('style', s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Espaciado</Label>
        <div className="flex gap-1">
          {spacings.map((s) => (
            <button
              key={s.value}
              className={`flex-1 rounded border px-2 py-1 text-xs ${
                (c.spacing || 'medium') === s.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange('spacing', s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {c.style !== 'space' && (
        <div className="space-y-1">
          <Label className="text-xs">Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(c.color as string) || '#e5e7eb'}
              onChange={(e) => onChange('color', e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <Input
              value={(c.color as string) || '#e5e7eb'}
              onChange={(e) => onChange('color', e.target.value)}
              className="h-8 font-mono text-xs flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
