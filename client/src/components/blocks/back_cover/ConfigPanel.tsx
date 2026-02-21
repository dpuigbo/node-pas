import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">URL del logo (opcional)</Label>
        <Input
          value={(c.logoUrl as string) || ''}
          onChange={(e) => onChange('logoUrl', e.target.value)}
          placeholder="Vacio = usa logo de Configuracion General"
          className="h-8"
        />
        <p className="text-[10px] text-muted-foreground">
          Si no se indica, usa el logo de Configuracion &gt; General.
        </p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Color de fondo</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(c.backgroundColor as string) || '#111827'}
            onChange={(e) => onChange('backgroundColor', e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border"
          />
          <Input
            value={(c.backgroundColor as string) || '#111827'}
            onChange={(e) => onChange('backgroundColor', e.target.value)}
            className="h-8 font-mono text-xs flex-1"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Pagina final del documento con fondo oscuro y logo centrado.
      </p>
    </div>
  );
}
