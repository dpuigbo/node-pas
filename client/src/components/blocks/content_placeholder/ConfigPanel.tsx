import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={(c.label as string) || ''}
          onChange={(e) => onChange('label', e.target.value)}
          className="h-8"
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Este bloque marca donde se insertara el contenido del informe
        especifico del modelo/sistema. Al generar un informe, se reemplaza
        por las secciones definidas en la plantilla del modelo.
      </p>
    </div>
  );
}
