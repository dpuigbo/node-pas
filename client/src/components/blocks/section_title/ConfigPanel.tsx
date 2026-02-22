import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import type { BlockAlign } from '@/types/editor';
import { AlignSelector } from '@/components/blocks/_shared/AlignSelector';
import { PlaceholderInput } from '@/components/blocks/_shared/PlaceholderInput';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Titulo</Label>
        <PlaceholderInput
          value={(c.title as string) || ''}
          onChange={(v) => onChange('title', v)}
          placeholder="Ej: Control de {{componente.etiqueta}}"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descripcion</Label>
        <PlaceholderInput
          value={(c.description as string) || ''}
          onChange={(v) => onChange('description', v)}
          placeholder="Opcional"
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
      <AlignSelector
        value={(c.align as BlockAlign) || 'left'}
        onChange={(v) => onChange('align', v)}
      />
    </div>
  );
}
