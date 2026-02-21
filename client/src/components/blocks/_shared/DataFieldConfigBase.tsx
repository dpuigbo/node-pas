import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { FIELD_WIDTH_LABELS, type FieldWidth, type BlockAlign } from '@/types/editor';
import { AlignSelector } from './AlignSelector';

/**
 * Shared config fields for all data blocks:
 * key, label, required, width, helpText
 */
export function DataFieldConfigBase({ block, onChange }: ConfigPanelProps) {
  const config = block.config;

  return (
    <div className="space-y-3">
      {/* Key */}
      <div className="space-y-1">
        <Label className="text-xs">Clave (snake_case)</Label>
        <Input
          value={(config.key as string) || ''}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase();
            onChange('key', val);
          }}
          placeholder="nombre_campo"
          className="h-8 font-mono text-xs"
        />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={(config.label as string) || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="Etiqueta del campo"
          className="h-8"
        />
      </div>

      {/* Required */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`required-${block.id}`}
          checked={!!config.required}
          onChange={(e) => onChange('required', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor={`required-${block.id}`} className="text-xs cursor-pointer">
          Obligatorio
        </Label>
      </div>

      {/* Width */}
      <div className="space-y-1">
        <Label className="text-xs">Ancho</Label>
        <div className="grid grid-cols-2 gap-1">
          {(Object.entries(FIELD_WIDTH_LABELS) as [FieldWidth, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                className={`rounded border px-2 py-1 text-xs ${
                  config.width === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => onChange('width', value)}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Alignment */}
      <AlignSelector
        value={(config.align as BlockAlign) || 'left'}
        onChange={(v) => onChange('align', v)}
      />

      {/* Help text */}
      <div className="space-y-1">
        <Label className="text-xs">Texto de ayuda</Label>
        <Input
          value={(config.helpText as string) || ''}
          onChange={(e) => onChange('helpText', e.target.value)}
          placeholder="Opcional"
          className="h-8"
        />
      </div>
    </div>
  );
}
