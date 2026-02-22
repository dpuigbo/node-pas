import { Building2 } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

const FIELDS: { label: string; placeholder: string }[] = [
  { label: 'Empresa', placeholder: 'Nombre del cliente' },
  { label: 'Direccion', placeholder: 'Calle, numero' },
  { label: 'Poblacion', placeholder: 'Ciudad, CP (Provincia)' },
  { label: 'CIF', placeholder: 'B-XXXXXXXX' },
  { label: 'Contacto', placeholder: 'Nombre de contacto' },
  { label: 'Telefono', placeholder: '+34 XXX XX XX XX' },
];

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || '';
  const accentColor = (c.accentColor as string) || '#1e40af';

  return (
    <div className="w-full">
      {title && (
        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1"
          style={{ color: accentColor }}
        >
          {title}
        </div>
      )}
      <div className="border border-gray-200 rounded overflow-hidden">
        {/* Header */}
        <div
          className="px-3 py-1 flex items-center gap-2 text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Building2 className="h-3 w-3" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Datos del cliente</span>
        </div>
        {/* Fields grid */}
        <div className="grid grid-cols-2">
          {FIELDS.map((field, fi) => (
            <div
              key={fi}
              className={`flex border-b border-gray-100 ${
                fi % 2 === 0 ? 'border-r border-r-gray-100' : ''
              }`}
            >
              <span className="text-[8px] font-semibold text-gray-600 bg-gray-50 px-2 py-1 shrink-0 w-[70px]">
                {field.label}
              </span>
              <span className="text-[8px] text-gray-400 px-2 py-1 flex-1 truncate">
                {field.placeholder}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
