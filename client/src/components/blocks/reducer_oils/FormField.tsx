import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { FormFieldProps } from '@/types/formField';

interface OilRow {
  eje: number | string;
  tipoSuministro: string;
  aceiteId: number | null;
  unidad: string;
  volumen: string;
  niveles: string[];
  control: boolean;
  cambio: boolean;
  observaciones: string;
}

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || '';
  const required = !!c.required;
  const title = (c.title as string) || '';
  const titleBg = (c.titleBg as string) || '#1f2937';
  const titleColor = (c.titleColor as string) || '#ffffff';
  const headerBg = (c.headerBg as string) || '#f3f4f6';
  const headerColor = (c.headerColor as string) || '#1f2937';
  const compact = !!c.compact;

  const rows: OilRow[] = (value as OilRow[]) || [];

  const cellPad = compact ? 'px-1.5 py-0.5' : 'px-2 py-1.5';

  const updateCell = (rowIdx: number, field: keyof OilRow, val: unknown) => {
    if (readOnly) return;
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, [field]: val } : r));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {(label || required) && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      <div className="rounded-sm border overflow-x-auto">
        {title && (
          <div
            className="px-3 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: titleBg, color: titleColor }}
          >
            {title}
          </div>
        )}
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: headerBg }}>
              <th className={`font-medium text-xs ${cellPad} text-left`} style={{ color: headerColor, width: '6%' }}>Eje</th>
              <th className={`font-medium text-xs ${cellPad} text-left`} style={{ color: headerColor, width: '24%' }}>Tipo suministro</th>
              <th className={`font-medium text-xs ${cellPad} text-left`} style={{ color: headerColor, width: '8%' }}>Unidad</th>
              <th className={`font-medium text-xs ${cellPad} text-left`} style={{ color: headerColor, width: '10%' }}>Volumen</th>
              <th className={`font-medium text-xs ${cellPad} text-center`} style={{ color: headerColor, width: '10%' }}>Control</th>
              <th className={`font-medium text-xs ${cellPad} text-center`} style={{ color: headerColor, width: '10%' }}>Cambio</th>
              <th className={`font-medium text-xs ${cellPad} text-left`} style={{ color: headerColor, width: '32%' }}>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-xs text-gray-400 italic">
                  Sin filas definidas en la plantilla.
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  {/* Template data — read-only always */}
                  <td className={`${cellPad} text-gray-600 border-t border-gray-100 text-center`}>{row.eje}</td>
                  <td className={`${cellPad} text-gray-600 border-t border-gray-100`}>{row.tipoSuministro}</td>
                  <td className={`${cellPad} text-gray-600 border-t border-gray-100`}>{row.unidad || '-'}</td>
                  <td className={`${cellPad} text-gray-600 border-t border-gray-100`}>{row.volumen || '-'}</td>
                  {/* User-editable columns */}
                  <td className="px-2 py-1 border-t border-gray-100 text-center">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={!!row.control}
                        onChange={(e) => updateCell(ri, 'control', e.target.checked)}
                        disabled={readOnly}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1 border-t border-gray-100 text-center">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={!!row.cambio}
                        onChange={(e) => updateCell(ri, 'cambio', e.target.checked)}
                        disabled={readOnly}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>
                  </td>
                  <td className="px-1 py-1 border-t border-gray-100">
                    <Input
                      value={row.observaciones || ''}
                      onChange={(e) => updateCell(ri, 'observaciones', e.target.value)}
                      placeholder="-"
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-7 text-xs border-0 bg-transparent px-1 focus-visible:ring-0"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
