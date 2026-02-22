import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { SYSTEM_CONTENT_TYPES, type SystemContentType } from './constants';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;
  const contentType = (c.contentType as SystemContentType) || 'all';

  return (
    <div className="space-y-3">
      {/* Content type selector */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Tipo de contenido</Label>
        <p className="text-[10px] text-muted-foreground mb-2">
          Selecciona que informacion del sistema se insertara en este bloque
        </p>
        <div className="space-y-1">
          {SYSTEM_CONTENT_TYPES.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                contentType === opt.value
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`contentType-${block.id}`}
                value={opt.value}
                checked={contentType === opt.value}
                onChange={() => {
                  onChange('contentType', opt.value);
                  onChange('label', opt.label);
                }}
                className="mt-0.5 h-3.5 w-3.5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{opt.label}</div>
                <div className="text-[10px] text-muted-foreground">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Al generar un informe, este bloque se reemplazara por las secciones
          correspondientes definidas en la plantilla del componente del sistema.
        </p>
      </div>
    </div>
  );
}
