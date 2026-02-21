import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Nombre de empresa</Label>
        <Input
          value={(c.companyName as string) || ''}
          onChange={(e) => onChange('companyName', e.target.value)}
          className="h-8"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showPageNumbers"
          checked={c.showPageNumbers !== false}
          onChange={(e) => onChange('showPageNumbers', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor="showPageNumbers" className="text-xs cursor-pointer">
          Mostrar numeros de pagina
        </Label>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Color principal</Label>
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
      <div className="space-y-1">
        <Label className="text-xs">Color acento</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(c.accentColor as string) || '#3b82f6'}
            onChange={(e) => onChange('accentColor', e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border"
          />
          <Input
            value={(c.accentColor as string) || '#3b82f6'}
            onChange={(e) => onChange('accentColor', e.target.value)}
            className="h-8 font-mono text-xs flex-1"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Altura (px)</Label>
        <Input
          type="number"
          min={20}
          max={80}
          value={(c.height as number) || 36}
          onChange={(e) => onChange('height', Math.max(20, Math.min(80, Number(e.target.value) || 36)))}
          className="h-8"
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Este pie aparece en la parte inferior de todas las paginas
        intermedias del documento.
      </p>
    </div>
  );
}
