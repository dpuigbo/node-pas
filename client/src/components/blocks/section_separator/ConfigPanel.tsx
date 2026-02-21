import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { DOCUMENT_SECTIONS } from '@/types/editor';
import type { DocumentSection } from '@/types/editor';

export function ConfigPanel({ block }: ConfigPanelProps) {
  const sectionId = (block.config.section as DocumentSection) || 'portada';
  const sectionDef = DOCUMENT_SECTIONS.find((s) => s.id === sectionId);
  const label = sectionDef?.label || sectionId;
  const color = sectionDef?.color || '#6b7280';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Seccion</Label>
        <div
          className="flex items-center gap-2 rounded border px-3 py-2"
          style={{ borderColor: color, backgroundColor: `${color}10` }}
        >
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium" style={{ color }}>{label}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Este separador marca el inicio de la seccion <strong>{label}</strong>.
        No se puede mover, duplicar ni eliminar. Todos los bloques debajo
        pertenecen a esta seccion hasta el siguiente separador.
      </p>

      {sectionId === 'intermedia' && (
        <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-green-500 pl-2">
          La pagina intermedia define la cabecera y pie que se repiten en todas
          las paginas de contenido del documento.
        </p>
      )}
    </div>
  );
}
