import type { EditorPreviewProps } from '@/components/blocks/registry';

const FIELDS = [
  ['Actividad:', 'Nivel 1', 'Horas de intervencion:', '2:30', 'Orden de trabajo:', 'OT26-XXXXX', 'Fecha:', 'DD/MM/YYYY'],
  ['Hora de inicio:', 'HH:MM', 'Hora de finalizacion:', 'HH:MM'],
  ['Tecnico de mantenimiento:', 'Nombre tecnico', 'Tecnico cliente:', 'Nombre cliente'],
  ['Telefono:', '+34 XXX XX XX XX', 'Telefono de contacto:', '+34 XXX XX XX XX'],
  ['Correo tecnico:', 'email@empresa.com', 'Correo de contacto:', 'email@cliente.com'],
];

export function EditorPreview({ block }: EditorPreviewProps) {
  const title = (block.config.title as string) || '';

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-bold mb-2">{title}</h3>
      )}
      <table className="w-full border-collapse text-[9px]">
        <tbody>
          {FIELDS.map((row, ri) => (
            <tr key={ri} className="border border-gray-300">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-2 py-1 border border-gray-300 ${ci % 2 === 0 ? 'font-bold bg-gray-50' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
