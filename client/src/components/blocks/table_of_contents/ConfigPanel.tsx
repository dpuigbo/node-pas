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

      <p className="text-xs text-muted-foreground leading-relaxed">
        Este bloque genera automaticamente un indice con todos los titulos
        de seccion de la plantilla y sus numeros de pagina.
      </p>
    </div>
  );
}
