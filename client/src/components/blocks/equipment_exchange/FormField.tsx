import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FormFieldProps } from '@/types/formField';

interface EquipmentRow {
  unidadesSalida: string;
  designacionEntrada: string;
  designacionSalida: string;
  serieEntrada: string;
  serieSalida: string;
  intercambio: boolean;
  usado: boolean;
  unidadesUsadas: string;
}

function emptyRow(): EquipmentRow {
  return {
    unidadesSalida: '',
    designacionEntrada: '',
    designacionSalida: '',
    serieEntrada: '',
    serieSalida: '',
    intercambio: false,
    usado: false,
    unidadesUsadas: '',
  };
}

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || '';
  const required = !!c.required;
  const headerBg = (c.headerBg as string) || '#1f2937';
  const headerColor = (c.headerColor as string) || '#ffffff';
  const defaultRows = (c.defaultRows as number) || 5;

  // Initialize rows if empty
  const rows: EquipmentRow[] = (value as EquipmentRow[]) ?? Array.from({ length: defaultRows }, emptyRow);

  const updateCell = (rowIdx: number, field: keyof EquipmentRow, val: unknown) => {
    if (readOnly) return;
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, [field]: val } : r));
    onChange(next);
  };

  const addRow = () => {
    if (readOnly) return;
    onChange([...rows, emptyRow()]);
  };

  const removeRow = (rowIdx: number) => {
    if (readOnly) return;
    onChange(rows.filter((_, i) => i !== rowIdx));
  };

  return (
    <div className="space-y-2">
      {(label || required) && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      <div className="rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: headerBg }}>
              <th className="font-medium text-xs px-2 py-1.5 text-center border-r border-white/20" style={{ color: headerColor, width: '7%' }}>
                Uds.<br/>Salida
              </th>
              <th className="font-medium text-xs px-2 py-1.5 text-center border-r border-white/20" style={{ color: headerColor }} colSpan={2}>
                Designacion
              </th>
              <th className="font-medium text-xs px-2 py-1.5 text-center border-r border-white/20" style={{ color: headerColor }} colSpan={2}>
                Numero de serie
              </th>
              <th className="font-medium text-xs px-2 py-1.5 text-center border-r border-white/20" style={{ color: headerColor, width: '10%' }}>
                Inter-<br/>cambio
              </th>
              <th className="font-medium text-xs px-2 py-1.5 text-center border-r border-white/20" style={{ color: headerColor, width: '8%' }}>
                Usado
              </th>
              <th className="font-medium text-xs px-2 py-1.5 text-center border-r border-white/20" style={{ color: headerColor, width: '7%' }}>
                Uds.<br/>Usadas
              </th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                {/* Uds Salida */}
                <td className="border border-gray-200 px-1 text-center align-middle">
                  <Input
                    type="number"
                    min={0}
                    value={row.unidadesSalida}
                    onChange={(e) => updateCell(ri, 'unidadesSalida', e.target.value)}
                    readOnly={readOnly}
                    disabled={readOnly}
                    className="h-auto text-sm text-center border-0 bg-transparent p-0 focus-visible:ring-0"
                  />
                </td>
                {/* Designacion: Entrada + Salida */}
                <td className="border border-gray-200 p-0" colSpan={2}>
                  <div className="flex items-center border-b border-gray-100">
                    <span className="bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 border-r border-gray-200 shrink-0 w-[60px]">Entrada</span>
                    <Input
                      value={row.designacionEntrada}
                      onChange={(e) => updateCell(ri, 'designacionEntrada', e.target.value)}
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-auto text-sm border-0 bg-transparent rounded-none focus-visible:ring-0 px-2 py-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 border-r border-gray-200 shrink-0 w-[60px]">Salida</span>
                    <Input
                      value={row.designacionSalida}
                      onChange={(e) => updateCell(ri, 'designacionSalida', e.target.value)}
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-auto text-sm border-0 bg-transparent rounded-none focus-visible:ring-0 px-2 py-1"
                    />
                  </div>
                </td>
                {/* Numero de serie: Entrada + Salida */}
                <td className="border border-gray-200 p-0" colSpan={2}>
                  <div className="flex items-center border-b border-gray-100">
                    <span className="bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 border-r border-gray-200 shrink-0 w-[60px]">Entrada</span>
                    <Input
                      value={row.serieEntrada}
                      onChange={(e) => updateCell(ri, 'serieEntrada', e.target.value)}
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-auto text-sm border-0 bg-transparent rounded-none focus-visible:ring-0 px-2 py-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 border-r border-gray-200 shrink-0 w-[60px]">Salida</span>
                    <Input
                      value={row.serieSalida}
                      onChange={(e) => updateCell(ri, 'serieSalida', e.target.value)}
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-auto text-sm border-0 bg-transparent rounded-none focus-visible:ring-0 px-2 py-1"
                    />
                  </div>
                </td>
                {/* Intercambio */}
                <td className="border border-gray-200 text-center align-middle">
                  <input
                    type="checkbox"
                    checked={!!row.intercambio}
                    onChange={(e) => updateCell(ri, 'intercambio', e.target.checked)}
                    disabled={readOnly}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </td>
                {/* Usado */}
                <td className="border border-gray-200 text-center align-middle">
                  <input
                    type="checkbox"
                    checked={!!row.usado}
                    onChange={(e) => updateCell(ri, 'usado', e.target.checked)}
                    disabled={readOnly}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </td>
                {/* Uds Usadas */}
                <td className="border border-gray-200 px-1 text-center align-middle">
                  <Input
                    type="number"
                    min={0}
                    value={row.unidadesUsadas}
                    onChange={(e) => updateCell(ri, 'unidadesUsadas', e.target.value)}
                    readOnly={readOnly}
                    disabled={readOnly}
                    className="h-auto text-sm text-center border-0 bg-transparent p-0 focus-visible:ring-0"
                  />
                </td>
                {/* Delete */}
                {!readOnly && (
                  <td className="px-1 py-1 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500"
                      onClick={() => removeRow(ri)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={addRow}
        >
          <Plus className="h-3.5 w-3.5" />
          Anadir equipo
        </Button>
      )}
    </div>
  );
}
