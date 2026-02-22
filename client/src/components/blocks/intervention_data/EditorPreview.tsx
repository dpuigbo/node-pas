import type { EditorPreviewProps } from '@/components/blocks/registry';

/** Field definitions grouped into logical sections */
const SECTIONS: { title: string; fields: { label: string; placeholder: string; span?: 2 }[] }[] = [
  {
    title: 'Intervencion',
    fields: [
      { label: 'Actividad', placeholder: 'Nivel 1' },
      { label: 'Orden de trabajo', placeholder: 'OT26-XXXXX' },
      { label: 'Fecha', placeholder: 'DD/MM/YYYY' },
      { label: 'Horas', placeholder: '2:30' },
      { label: 'Hora inicio', placeholder: 'HH:MM' },
      { label: 'Hora fin', placeholder: 'HH:MM' },
    ],
  },
  {
    title: 'Personal',
    fields: [
      { label: 'Tecnico PAS', placeholder: 'Nombre' },
      { label: 'Tecnico cliente', placeholder: 'Nombre' },
      { label: 'Tel. tecnico', placeholder: '+34 XXX XX XX XX' },
      { label: 'Tel. contacto', placeholder: '+34 XXX XX XX XX' },
      { label: 'Email tecnico', placeholder: 'email@empresa.com' },
      { label: 'Email contacto', placeholder: 'email@cliente.com' },
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
      <div className="border border-gray-200 rounded overflow-hidden">
        {SECTIONS.map((section, si) => (
          <div key={si}>
            {/* Section header */}
            <div
              className="px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: sectionBg, color: sectionColor }}
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
                  <span
                    className="text-xs font-semibold px-2 py-1 shrink-0 w-[100px]"
                    style={{ backgroundColor: labelBg, color: labelColor }}
                  >
                    {field.label}
                  </span>
                  <span className="text-xs text-gray-400 px-2 py-1 flex-1 truncate">
                    {field.placeholder}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
