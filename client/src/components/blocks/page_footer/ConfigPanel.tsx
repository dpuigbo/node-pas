import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ConfigPanelProps } from '@/components/blocks/registry';

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
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const bgImageUrl = (c.backgroundImage as string) || '';

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 500 * 1024) {
      alert('La imagen no puede superar los 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange('backgroundImage', reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
      <ColorPicker
        label="Color principal"
        value={(c.backgroundColor as string) || ''}
        fallback="#1f2937"
        onChange={(v) => onChange('backgroundColor', v)}
      />
      <ColorPicker
        label="Color acento"
        value={(c.accentColor as string) || ''}
        fallback="#3b82f6"
        onChange={(v) => onChange('accentColor', v)}
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
          value={(c.textSize as number) || 10}
          onChange={(v) => onChange('textSize', v)}
          min={6}
          max={18}
          fallback={10}
        />
      </div>
      {/* Background image */}
      <div className="space-y-1">
        <Label className="text-xs">Imagen de fondo (opcional)</Label>
        <div className="flex items-center gap-2">
          <input
            ref={bgImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleBgImage}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => bgImageInputRef.current?.click()}
          >
            <Upload className="h-3 w-3 mr-1" />
            {bgImageUrl ? 'Cambiar' : 'Subir'}
          </Button>
          {bgImageUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange('backgroundImage', '')}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Quitar
            </Button>
          )}
        </div>
        {bgImageUrl && (
          <div className="mt-1 h-10 w-full rounded border overflow-hidden">
            <img src={bgImageUrl} alt="Fondo" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">PNG o JPG. Max 500KB.</p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Altura (px)</Label>
        <NumInput
          value={(c.height as number) || 36}
          onChange={(v) => onChange('height', v)}
          min={20}
          max={80}
          fallback={36}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Este pie aparece en la parte inferior de todas las paginas
        intermedias del documento.
      </p>
    </div>
  );
}
