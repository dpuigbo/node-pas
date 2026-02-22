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

      {/* Accent color */}
      <div className="space-y-1">
        <Label className="text-xs">Color de acento</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(c.accentColor as string) || '#1e40af'}
            onChange={(e) => onChange('accentColor', e.target.value)}
            className="h-8 w-10 rounded border cursor-pointer"
          />
          <Input
            value={(c.accentColor as string) || '#1e40af'}
            onChange={(e) => onChange('accentColor', e.target.value)}
            className="h-8 flex-1 font-mono text-xs"
          />
        </div>
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
        Datos de la intervencion agrupados por secciones. Se rellenan
        automaticamente al crear el informe.
      </p>
    </div>
  );
}
