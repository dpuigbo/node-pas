import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Titulo (opcional)</Label>
        <Input
          value={(c.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Ej: Datos de la intervencion"
          className="h-8"
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Tabla con los datos de la intervencion: actividad, horas, orden de trabajo,
        fecha, tecnicos, telefonos y correos. Se rellena automaticamente
        al crear el informe.
      </p>
    </div>
  );
}
