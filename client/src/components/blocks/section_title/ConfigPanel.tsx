import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Titulo</Label>
        <Input
          value={(c.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          className="h-8"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descripcion</Label>
        <Input
          value={(c.description as string) || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Opcional"
          className="h-8"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Nivel</Label>
        <div className="flex gap-1">
          {[1, 2, 3].map((lvl) => (
            <button
              key={lvl}
              className={`flex-1 rounded border px-2 py-1 text-xs ${
                (c.level || 1) === lvl
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange('level', lvl)}
            >
              Nivel {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(c.color as string) || '#2563eb'}
            onChange={(e) => onChange('color', e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border"
          />
          <Input
            value={(c.color as string) || '#2563eb'}
            onChange={(e) => onChange('color', e.target.value)}
            className="h-8 font-mono text-xs flex-1"
          />
        </div>
      </div>
    </div>
  );
}
