import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { PlaceholderInput } from '@/components/blocks/_shared/PlaceholderInput';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      {/* Key */}
      <div className="space-y-1">
        <Label className="text-xs">Clave (snake_case)</Label>
        <Input
          value={(c.key as string) || ''}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase();
            onChange('key', val);
          }}
          placeholder="aceites_reductoras"
          className="h-8 font-mono text-xs"
        />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={(c.label as string) || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="Aceites en reductoras"
          className="h-8"
        />
      </div>

      {/* Title */}
      <div className="border-t pt-3 space-y-3">
        <Label className="text-xs font-semibold">Titulo de tabla</Label>
        <div className="space-y-1">
          <Label className="text-xs">Texto del titulo</Label>
          <PlaceholderInput
            value={(c.title as string) || ''}
            onChange={(v) => onChange('title', v)}
            placeholder="Ej: Reductoras del {{componente.etiqueta}}"
          />
        </div>
        {(c.title as string) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Fondo titulo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(c.titleBg as string) || '#1f2937'}
                  onChange={(e) => onChange('titleBg', e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <Input
                  value={(c.titleBg as string) || '#1f2937'}
                  onChange={(e) => onChange('titleBg', e.target.value)}
                  className="h-8 font-mono text-xs flex-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color texto titulo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(c.titleColor as string) || '#ffffff'}
                  onChange={(e) => onChange('titleColor', e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <Input
                  value={(c.titleColor as string) || '#ffffff'}
                  onChange={(e) => onChange('titleColor', e.target.value)}
                  className="h-8 font-mono text-xs flex-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Default rows */}
      <div className="space-y-1">
        <Label className="text-xs">Filas por defecto</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={(c.defaultRows as number) || 6}
          onChange={(e) => onChange('defaultRows', parseInt(e.target.value) || 6)}
          className="h-8"
        />
      </div>

      {/* Header colors */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Estilo cabecera</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Fondo</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(c.headerBg as string) || '#f3f4f6'}
                onChange={(e) => onChange('headerBg', e.target.value)}
                className="h-8 w-8 rounded border cursor-pointer"
              />
              <Input
                value={(c.headerBg as string) || '#f3f4f6'}
                onChange={(e) => onChange('headerBg', e.target.value)}
                className="h-8 flex-1 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Texto</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(c.headerColor as string) || '#1f2937'}
                onChange={(e) => onChange('headerColor', e.target.value)}
                className="h-8 w-8 rounded border cursor-pointer"
              />
              <Input
                value={(c.headerColor as string) || '#1f2937'}
                onChange={(e) => onChange('headerColor', e.target.value)}
                className="h-8 flex-1 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Required */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`required-${block.id}`}
          checked={!!c.required}
          onChange={(e) => onChange('required', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor={`required-${block.id}`} className="text-xs cursor-pointer">
          Obligatorio
        </Label>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Tabla de aceites/grasas en reductoras. Relaciona eje, nivel de mantenimiento,
        tipo de aceite (del catalogo) y cantidad necesaria.
      </p>
    </div>
  );
}
