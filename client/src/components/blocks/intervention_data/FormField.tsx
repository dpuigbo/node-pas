import { Input } from '@/components/ui/input';
import type { FormFieldProps } from '@/types/formField';

/**
 * Field definitions grouped by section.
 * Each field has a dataKey that maps to a property in the _dataValue object.
 */
const SECTIONS: {
  title: string;
  fields: { label: string; dataKey: string; placeholder: string; type?: string }[];
}[] = [
  {
    title: 'Intervencion',
    fields: [
      { label: 'Actividad', dataKey: 'actividad', placeholder: 'Nivel 1' },
      { label: 'Orden de trabajo', dataKey: 'ordenTrabajo', placeholder: 'OT26-XXXXX' },
      { label: 'Fecha', dataKey: 'fecha', placeholder: 'DD/MM/YYYY' },
      { label: 'Horas', dataKey: 'horas', placeholder: '2:30' },
      { label: 'Hora inicio', dataKey: 'horaInicio', placeholder: 'HH:MM' },
      { label: 'Hora fin', dataKey: 'horaFin', placeholder: 'HH:MM' },
    ],
  },
  {
    title: 'Personal',
    fields: [
      { label: 'Tecnico PAS', dataKey: 'tecnicoPas', placeholder: 'Nombre' },
      { label: 'Tecnico cliente', dataKey: 'tecnicoCliente', placeholder: 'Nombre' },
      { label: 'Tel. tecnico', dataKey: 'telTecnico', placeholder: '+34 XXX XX XX XX', type: 'tel' },
      { label: 'Tel. contacto', dataKey: 'telContacto', placeholder: '+34 XXX XX XX XX', type: 'tel' },
      { label: 'Email tecnico', dataKey: 'emailTecnico', placeholder: 'email@empresa.com', type: 'email' },
      { label: 'Email contacto', dataKey: 'emailContacto', placeholder: 'email@cliente.com', type: 'email' },
    ],
  },
];

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const title = (c.title as string) || '';
  const accentColor = (c.accentColor as string) || '#1e40af';

  const data = (value as Record<string, string>) || {};

  const handleChange = (dataKey: string, fieldValue: string) => {
    if (readOnly) return;
    onChange({ ...data, [dataKey]: fieldValue });
  };

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
        {SECTIONS.map((section, si) => (
          <div key={si}>
            {/* Section header */}
            <div
              className="px-3 py-1 text-[8px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: accentColor }}
            >
              {section.title}
            </div>
            {/* Fields grid: 2 columns */}
            <div className="grid grid-cols-2">
              {section.fields.map((field, fi) => (
                <div
                  key={fi}
                  className={`flex border-b border-gray-100 ${
                    fi % 2 === 0 ? 'border-r border-r-gray-100' : ''
                  }`}
                >
                  <span className="text-[8px] font-semibold text-gray-600 bg-gray-50 px-2 py-1 shrink-0 w-[90px] flex items-center">
                    {field.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Input
                      type={field.type || 'text'}
                      value={data[field.dataKey] || ''}
                      placeholder={field.placeholder}
                      onChange={(e) => handleChange(field.dataKey, e.target.value)}
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-auto py-1 px-2 text-[8px] border-0 rounded-none bg-transparent focus-visible:ring-1 focus-visible:ring-inset"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
