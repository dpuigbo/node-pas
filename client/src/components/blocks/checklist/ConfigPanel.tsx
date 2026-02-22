import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { ItemsEditor } from '@/components/blocks/_shared/ItemsEditor';

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

      {/* Layout direction */}
      <div className="space-y-1">
        <Label className="text-xs">Disposicion de items</Label>
        <div className="flex gap-1">
          {([
            { value: 'vertical', label: 'Vertical' },
            { value: 'horizontal', label: 'Horizontal' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              className={`flex-1 rounded border px-2 py-1 text-xs ${
                (c.layout || 'vertical') === opt.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange('layout', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="border-t pt-3">
        <ItemsEditor
          items={(c.items as { key: string; label: string }[]) || []}
          onChange={(items) => onChange('items', items)}
        />
      </div>
    </div>
  );
}
