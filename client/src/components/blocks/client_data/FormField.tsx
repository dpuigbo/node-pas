import { Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { FormFieldProps } from '@/types/formField';
import { useEmpresaLogo } from '@/hooks/useCatalogos';

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const title = (c.title as string) || '';
  const blockLogoUrl = (c.logoUrl as string) || '';
  const empresaLogo = useEmpresaLogo();
  const logoUrl = blockLogoUrl || empresaLogo;

  const data = (value as Record<string, string>) || {};

  const handleChange = (dataKey: string, fieldValue: string) => {
    if (readOnly) return;
    onChange({ ...data, [dataKey]: fieldValue });
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-xs font-bold mb-1.5 px-1">{title}</h3>
      )}
      <div className="flex items-center gap-4 p-3">
        {/* Logo */}
        <div className="shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain" />
          ) : (
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-gray-300" />
            </div>
          )}
        </div>
        {/* Name + Address */}
        <div className="flex-1 min-w-0 space-y-1">
          <Input
            type="text"
            value={data.nombre || ''}
            placeholder="Nombre del cliente"
            onChange={(e) => handleChange('nombre', e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className="h-auto py-0.5 px-1 text-sm font-bold border-0 border-b border-transparent hover:border-gray-200 focus-visible:border-primary bg-transparent rounded-none focus-visible:ring-0"
          />
          <Input
            type="text"
            value={data.direccion || ''}
            placeholder="Direccion completa"
            onChange={(e) => handleChange('direccion', e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className="h-auto py-0.5 px-1 text-xs text-gray-500 border-0 border-b border-transparent hover:border-gray-200 focus-visible:border-primary bg-transparent rounded-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
