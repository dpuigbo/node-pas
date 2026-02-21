import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';

/** Reusable number input that allows typing freely, clamping only on blur */
function NumInput({
  value,
  onChange,
  min,
  max,
  fallback,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  fallback: number;
}) {
  return (
    <Input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') return;
        onChange(Number(raw));
      }}
      onBlur={(e) => {
        const n = Number(e.target.value);
        if (!n || isNaN(n)) onChange(fallback);
        else onChange(Math.max(min, Math.min(max, n)));
      }}
      className="h-8"
    />
  );
}

/** Reusable color picker + hex input */
function ColorPicker({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border"
        />
        <Input
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 font-mono text-xs flex-1"
        />
      </div>
    </div>
  );
}

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Titulo del reporte</Label>
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
        <Label className="text-xs">Nombre de empresa</Label>
        <Input
          value={(c.companyName as string) || ''}
          onChange={(e) => onChange('companyName', e.target.value)}
          className="h-8"
        />
      </div>
      {/* Logo horizontal position */}
      <div className="space-y-1">
        <Label className="text-xs">Posicion horizontal del logo</Label>
        <div className="flex gap-1">
          {(['left', 'right'] as const).map((pos) => (
            <button
              key={pos}
              className={`flex-1 rounded border px-2 py-1 text-xs ${
                (c.logoPosition || 'right') === pos
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange('logoPosition', pos)}
            >
              {pos === 'left' ? 'Izquierda' : 'Derecha'}
            </button>
          ))}
        </div>
      </div>
      {/* Logo vertical alignment */}
      <div className="space-y-1">
        <Label className="text-xs">Alineacion vertical del logo</Label>
        <div className="flex gap-1">
          {(['top', 'center', 'bottom'] as const).map((pos) => (
            <button
              key={pos}
              className={`flex-1 rounded border px-2 py-1 text-xs ${
                (c.logoVerticalAlign || 'center') === pos
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange('logoVerticalAlign', pos)}
            >
              {pos === 'top' ? 'Arriba' : pos === 'center' ? 'Centro' : 'Abajo'}
            </button>
          ))}
        </div>
      </div>
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
      <ColorPicker
        label="Color de fondo"
        value={(c.backgroundColor as string) || ''}
        fallback="#000000"
        onChange={(v) => onChange('backgroundColor', v)}
      />
      <ColorPicker
        label="Color del texto"
        value={(c.textColor as string) || ''}
        fallback="#ffffff"
        onChange={(v) => onChange('textColor', v)}
      />
      <div className="space-y-1">
        <Label className="text-xs">Tamano del titulo (px)</Label>
        <NumInput
          value={(c.titleSize as number) || 24}
          onChange={(v) => onChange('titleSize', v)}
          min={12}
          max={60}
          fallback={24}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Altura del banner (px)</Label>
        <NumInput
          value={(c.height as number) || 280}
          onChange={(v) => onChange('height', v)}
          min={100}
          max={600}
          fallback={280}
        />
      </div>
    </div>
  );
}
