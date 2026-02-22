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
          placeholder="Ej: Datos del cliente"
          className="h-8"
        />
      </div>
      {/* Vertical alignment on page */}
      <div className="space-y-1">
        <Label className="text-xs">Alineacion vertical en pagina</Label>
        <div className="flex gap-1">
          {(['top', 'center', 'bottom'] as const).map((pos) => (
            <button
              key={pos}
              className={`flex-1 rounded border px-2 py-1 text-xs ${
                (c.verticalAlign || 'top') === pos
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange('verticalAlign', pos)}
            >
              {pos === 'top' ? 'Arriba' : pos === 'center' ? 'Centro' : 'Abajo'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Muestra los datos del cliente (nombre, logo, direccion) del informe.
        Se rellena automaticamente con los datos del cliente asignado.
      </p>
    </div>
  );
}
