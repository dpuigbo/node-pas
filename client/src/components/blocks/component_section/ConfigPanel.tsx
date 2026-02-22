import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import {
  SYSTEM_CONTENT_TYPES,
  type SystemContentType,
} from '@/components/blocks/content_placeholder/constants';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const contentType = (block.config.contentType as SystemContentType) || 'controller_info';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Seccion de contenido</Label>
        <p className="text-[10px] text-muted-foreground mb-2">
          Los bloques debajo de este separador pertenecen a esta seccion.
          Al generar el informe, se insertaran en el bloque &quot;Contenido del sistema&quot;
          que tenga el mismo tipo de contenido.
        </p>
        <div className="space-y-1">
          {SYSTEM_CONTENT_TYPES.filter((t) => t.value !== 'all').map((opt) => (
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
                onChange={() => onChange('contentType', opt.value)}
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
          Todos los bloques entre este separador y el siguiente (o el final de la plantilla)
          formaran el contenido de la seccion <strong>{SYSTEM_CONTENT_TYPES.find((t) => t.value === contentType)?.label ?? contentType}</strong>.
        </p>
      </div>
    </div>
  );
}
