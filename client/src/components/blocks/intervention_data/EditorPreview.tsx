import type { EditorPreviewProps } from '@/components/blocks/registry';

/**
 * Each row has 2 field pairs: [left_label, left_placeholder, right_label, right_placeholder]
 */
const SECTIONS: {
  title: string;
  rows: [string, string, string, string][];
}[] = [
  {
    title: 'Intervencion',
    rows: [
      ['Actividad', 'Nivel 1', 'Horas', '2:30'],
      ['N° trabajo', 'OT26-XXXXX', 'Fecha', 'DD/MM/YYYY'],
      ['Hora inicio', 'HH:MM', 'Hora fin', 'HH:MM'],
    ],
  },
  {
    title: 'Personal',
    rows: [
      ['Tecnico PAS', 'Nombre', 'Tecnico cliente', 'Nombre'],
      ['Tel. tecnico', '+34 XXX XX XX XX', 'Tel. contacto', '+34 XXX XX XX XX'],
      ['Email tecnico', 'email@empresa.com', 'Email contacto', 'email@cliente.com'],
    ],
  },
];

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || '';
  const sectionBg = (c.sectionBg as string) || (c.accentColor as string) || '#1e40af';
  const sectionColor = (c.sectionColor as string) || '#ffffff';
  const labelBg = (c.labelBg as string) || '#f9fafb';
  const labelColor = (c.labelColor as string) || '#4b5563';

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
      <div className="border border-gray-200 overflow-hidden">
        <table className="w-full border-collapse text-[10px]">
          <tbody>
            {SECTIONS.map((section, si) => (
              <>
                {/* Section header */}
                <tr key={`h-${si}`}>
                  <td
                    colSpan={4}
                    className="px-3 py-1 font-bold uppercase tracking-wider"
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
                      className="font-semibold px-2 py-1 border-r border-gray-100 whitespace-nowrap"
                      style={{ backgroundColor: labelBg, color: labelColor, width: '18%' }}
                    >
                      {row[0]}
                    </td>
                    <td className="px-2 py-1 text-gray-400 border-r border-gray-100" style={{ width: '32%' }}>
                      {row[1]}
                    </td>
                    {/* Right pair */}
                    <td
                      className="font-semibold px-2 py-1 border-r border-gray-100 whitespace-nowrap"
                      style={{ backgroundColor: labelBg, color: labelColor, width: '18%' }}
                    >
                      {row[2]}
                    </td>
                    <td className="px-2 py-1 text-gray-400" style={{ width: '32%' }}>
                      {row[3]}
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
