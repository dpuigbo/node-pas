import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { PlaceholderInput } from '@/components/blocks/_shared/PlaceholderInput';

/** Number input that allows typing freely, clamping only on blur */
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
        <Label className="text-xs">Titulo</Label>
        <PlaceholderInput
          value={(c.title as string) || ''}
          onChange={(v) => onChange('title', v)}
          placeholder="Ej: {{intervencion.actividad}} - {{cliente.nombre}}"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Subtitulo</Label>
        <PlaceholderInput
          value={(c.subtitle as string) || ''}
          onChange={(v) => onChange('subtitle', v)}
          placeholder="Ej: {{sistema.nombre}}"
        />
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
      <div className="space-y-1">
        <Label className="text-xs">Tamano del logo (px)</Label>
        <NumInput
          value={(c.logoSize as number) || 24}
          onChange={(v) => onChange('logoSize', v)}
          min={12}
          max={80}
          fallback={24}
        />
      </div>
      <ColorPicker
        label="Color de fondo"
        value={(c.backgroundColor as string) || ''}
        fallback="#1f2937"
        onChange={(v) => onChange('backgroundColor', v)}
      />
      <ColorPicker
        label="Color del texto"
        value={(c.textColor as string) || ''}
        fallback="#ffffff"
        onChange={(v) => onChange('textColor', v)}
      />
      <div className="space-y-1">
        <Label className="text-xs">Tamano del texto (px)</Label>
        <NumInput
          value={(c.textSize as number) || 12}
          onChange={(v) => onChange('textSize', v)}
          min={8}
          max={24}
          fallback={12}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Altura (px)</Label>
        <NumInput
          value={(c.height as number) || 40}
          onChange={(v) => onChange('height', v)}
          min={24}
          max={120}
          fallback={40}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Esta cabecera aparece en la parte superior de todas las paginas
        intermedias del documento.
      </p>
    </div>
  );
}
