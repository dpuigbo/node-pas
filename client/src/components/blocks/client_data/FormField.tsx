import { Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { FormFieldProps } from '@/types/formField';

const FIELDS: { label: string; dataKey: string; placeholder: string; span?: 2 }[] = [
  { label: 'Nombre', dataKey: 'nombre', placeholder: 'Nombre del cliente', span: 2 },
  { label: 'Contacto', dataKey: 'personaContacto', placeholder: 'Persona de contacto', span: 2 },
  { label: 'Planta', dataKey: 'planta', placeholder: 'Planta / Sede' },
  { label: 'Maquina', dataKey: 'maquina', placeholder: 'Maquina / Linea' },
  { label: 'Direccion', dataKey: 'direccion', placeholder: 'Direccion', span: 2 },
  { label: 'Ciudad', dataKey: 'ciudad', placeholder: 'Ciudad' },
  { label: 'CP', dataKey: 'cp', placeholder: 'Codigo postal' },
  { label: 'Provincia', dataKey: 'provincia', placeholder: 'Provincia' },
  { label: 'Telefono', dataKey: 'telefono', placeholder: '+34 XXX XX XX XX' },
  { label: 'Email', dataKey: 'email', placeholder: 'email@cliente.com', span: 2 },
];

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const title = (c.title as string) || '';

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
      <div className="flex items-start gap-4 border border-gray-200 rounded p-3">
        <div className="shrink-0 w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
          <Building2 className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-3 gap-y-1">
          {FIELDS.map((field) => (
            <div
              key={field.dataKey}
              className={`flex items-center gap-1.5 ${
                field.span === 2 ? 'col-span-2' : ''
              }`}
            >
              <span className="text-xs font-semibold text-gray-500 shrink-0 w-[65px]">
                {field.label}
              </span>
              <Input
                type="text"
                value={data[field.dataKey] || ''}
                placeholder={field.placeholder}
                onChange={(e) => handleChange(field.dataKey, e.target.value)}
                readOnly={readOnly}
                disabled={readOnly}
                className="h-6 text-xs border-0 border-b border-gray-200 rounded-none bg-transparent px-1 focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
