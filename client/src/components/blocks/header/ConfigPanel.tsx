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
        <Label className="text-xs">Subtitulo</Label>
        <Input
          value={(c.subtitle as string) || ''}
          onChange={(e) => onChange('subtitle', e.target.value)}
          className="h-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showLogo"
          checked={c.showLogo !== false}
          onChange={(e) => onChange('showLogo', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor="showLogo" className="text-xs cursor-pointer">Mostrar logo</Label>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Posicion del logo</Label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((pos) => (
            <button
              key={pos}
              className={`flex-1 rounded border px-2 py-1 text-xs ${
                (c.logoPosition || 'left') === pos
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange('logoPosition', pos)}
            >
              {pos === 'left' ? 'Izquierda' : pos === 'center' ? 'Centro' : 'Derecha'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">URL del logo</Label>
        <Input
          value={(c.logoUrl as string) || ''}
          onChange={(e) => onChange('logoUrl', e.target.value)}
          placeholder="https://..."
          className="h-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showDate"
          checked={c.showDate !== false}
          onChange={(e) => onChange('showDate', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor="showDate" className="text-xs cursor-pointer">Mostrar fecha</Label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showReference"
          checked={c.showReference !== false}
          onChange={(e) => onChange('showReference', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor="showReference" className="text-xs cursor-pointer">Mostrar referencia</Label>
      </div>
    </div>
  );
}
