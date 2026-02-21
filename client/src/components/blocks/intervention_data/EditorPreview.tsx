import type { EditorPreviewProps } from '@/components/blocks/registry';

/** Two-column layout: label | value pairs grouped by row */
const ROWS: { label: string; placeholder: string }[][] = [
  [
    { label: 'Actividad', placeholder: 'Nivel 1' },
    { label: 'Orden de trabajo', placeholder: 'OT26-XXXXX' },
  ],
  [
    { label: 'Fecha', placeholder: 'DD/MM/YYYY' },
    { label: 'Horas de intervencion', placeholder: '2:30' },
  ],
  [
    { label: 'Hora de inicio', placeholder: 'HH:MM' },
    { label: 'Hora de finalizacion', placeholder: 'HH:MM' },
  ],
  [
    { label: 'Tecnico de mantenimiento', placeholder: 'Nombre tecnico' },
    { label: 'Tecnico cliente', placeholder: 'Nombre cliente' },
  ],
  [
    { label: 'Telefono tecnico', placeholder: '+34 XXX XX XX XX' },
    { label: 'Telefono de contacto', placeholder: '+34 XXX XX XX XX' },
  ],
  [
    { label: 'Correo tecnico', placeholder: 'email@empresa.com' },
    { label: 'Correo de contacto', placeholder: 'email@cliente.com' },
  ],
];

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || '';
  const verticalAlign = (c.verticalAlign as string) || 'top';

  const alignClass =
    verticalAlign === 'center'
      ? 'justify-center'
      : verticalAlign === 'bottom'
        ? 'justify-end'
        : 'justify-start';

  return (
    <div className={`w-full flex flex-col ${alignClass}`}>
      {title && (
        <h3 className="text-xs font-bold mb-1.5 px-1">{title}</h3>
      )}
      <table className="w-full border-collapse text-[9px]">
        <tbody>
          {ROWS.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-gray-300" style={{ width: '50%' }}>
                  <div className="flex">
                    <span
                      className="font-semibold bg-gray-100 px-2 py-1 border-r border-gray-300 whitespace-nowrap shrink-0"
                      style={{ minWidth: '120px' }}
                    >
                      {cell.label}
                    </span>
                    <span className="px-2 py-1 text-gray-500 flex-1">
                      {cell.placeholder}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
