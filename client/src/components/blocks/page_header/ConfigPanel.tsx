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
          placeholder="Ej: IRB1200-5/0.9 - IRC5 Compact"
        />
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
      <div className="space-y-1">
        <Label className="text-xs">Color de fondo</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(c.backgroundColor as string) || '#1f2937'}
            onChange={(e) => onChange('backgroundColor', e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border"
          />
          <Input
            value={(c.backgroundColor as string) || '#1f2937'}
            onChange={(e) => onChange('backgroundColor', e.target.value)}
            className="h-8 font-mono text-xs flex-1"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Esta cabecera aparece en la parte superior de todas las paginas
        intermedias del documento.
      </p>
    </div>
  );
}
