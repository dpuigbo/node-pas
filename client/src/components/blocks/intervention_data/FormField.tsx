import { Input } from '@/components/ui/input';
import type { FormFieldProps } from '@/types/formField';

/**
 * Field rows grouped by section. Each row has 2 field pairs.
 * [leftLabel, leftKey, leftPlaceholder, rightLabel, rightKey, rightPlaceholder]
 */
const SECTIONS: {
  title: string;
  rows: [string, string, string, string, string, string][];
}[] = [
  {
    title: 'Intervencion',
    rows: [
      ['Actividad', 'actividad', 'Nivel 1', 'Horas', 'horas', '2:30'],
      ['N° trabajo', 'ordenTrabajo', 'OT26-XXXXX', 'Fecha', 'fecha', 'DD/MM/YYYY'],
      ['Hora inicio', 'horaInicio', 'HH:MM', 'Hora fin', 'horaFin', 'HH:MM'],
    ],
  },
  {
    title: 'Personal',
    rows: [
      ['Tecnico PAS', 'tecnicoPas', 'Nombre', 'Tecnico cliente', 'tecnicoCliente', 'Nombre'],
      ['Tel. tecnico', 'telTecnico', '+34 XXX XX XX XX', 'Tel. contacto', 'telContacto', '+34 XXX XX XX XX'],
      ['Email tecnico', 'emailTecnico', 'email@empresa.com', 'Email contacto', 'emailContacto', 'email@cliente.com'],
    ],
  },
];

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const title = (c.title as string) || '';
  const sectionBg = (c.sectionBg as string) || (c.accentColor as string) || '#1e40af';
  const sectionColor = (c.sectionColor as string) || '#ffffff';
  const labelBg = (c.labelBg as string) || '#f9fafb';
  const labelColor = (c.labelColor as string) || '#4b5563';

  const data = (value as Record<string, string>) || {};

  const handleChange = (dataKey: string, fieldValue: string) => {
    if (readOnly) return;
    onChange({ ...data, [dataKey]: fieldValue });
  };

  return (
    <div className="w-full">
      {title && (
        <div
          className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
          style={{ color: sectionBg }}
        >
          {title}
        </div>
      )}
      <div className="rounded-sm border border-gray-200 overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <tbody>
            {SECTIONS.map((section, si) => (
              <>
                {/* Section header */}
                <tr key={`h-${si}`}>
                  <td
                    colSpan={4}
                    className="px-3 py-1 font-bold uppercase tracking-wider text-xs"
                    style={{ backgroundColor: sectionBg, color: sectionColor }}
                  >
                    {section.title}
                  </td>
                </tr>
                {/* Field rows */}
                {section.rows.map((row, ri) => (
                  <tr key={`r-${si}-${ri}`} className="border-b border-gray-100">
                    {/* Left pair */}
                    <td
                      className="font-semibold px-2 py-1 border-r border-gray-100 whitespace-nowrap text-xs"
                      style={{ backgroundColor: labelBg, color: labelColor, width: '18%' }}
                    >
                      {row[0]}
                    </td>
                    <td className="border-r border-gray-100 p-0" style={{ width: '32%' }}>
                      <Input
                        type="text"
                        value={data[row[1]] || ''}
                        placeholder={row[2]}
                        onChange={(e) => handleChange(row[1], e.target.value)}
                        readOnly={readOnly}
                        disabled={readOnly}
                        className="h-auto py-1 px-2 text-xs border-0 rounded-none bg-transparent focus-visible:ring-1 focus-visible:ring-inset"
                      />
                    </td>
                    {/* Right pair */}
                    <td
                      className="font-semibold px-2 py-1 border-r border-gray-100 whitespace-nowrap text-xs"
                      style={{ backgroundColor: labelBg, color: labelColor, width: '18%' }}
                    >
                      {row[3]}
                    </td>
                    <td className="p-0" style={{ width: '32%' }}>
                      <Input
                        type="text"
                        value={data[row[4]] || ''}
                        placeholder={row[5]}
                        onChange={(e) => handleChange(row[4], e.target.value)}
                        readOnly={readOnly}
                        disabled={readOnly}
                        className="h-auto py-1 px-2 text-xs border-0 rounded-none bg-transparent focus-visible:ring-1 focus-visible:ring-inset"
                      />
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
