import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FormFieldProps } from '@/types/formField';
import { useAceites } from '@/hooks/useCatalogos';

interface OilRow {
  eje: number | string;
  nivelMantenimiento: string;
  aceiteId: number | null;
  aceiteNombre: string;
  cantidad: string;
}

function emptyRow(eje: number): OilRow {
  return {
    eje,
    nivelMantenimiento: '',
    aceiteId: null,
    aceiteNombre: '',
    cantidad: '',
  };
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
  const defaultRows = (c.defaultRows as number) || 6;

  const { data: aceites } = useAceites();
  const activeAceites = (aceites as { id: number; nombre: string; activo: boolean }[] || [])
    .filter((a) => a.activo);

  const rows: OilRow[] = (value as OilRow[]) ?? Array.from({ length: defaultRows }, (_, i) => emptyRow(i + 1));

  const updateCell = (rowIdx: number, field: keyof OilRow, val: unknown) => {
    if (readOnly) return;
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, [field]: val } : r));
    onChange(next);
  };

  const handleAceiteChange = (rowIdx: number, aceiteId: string) => {
    if (readOnly) return;
    const id = aceiteId ? Number(aceiteId) : null;
    const aceite = activeAceites.find((a) => a.id === id);
    const next = rows.map((r, i) =>
      i === rowIdx
        ? { ...r, aceiteId: id, aceiteNombre: aceite?.nombre || '' }
        : r,
    );
    onChange(next);
  };

  const addRow = () => {
    if (readOnly) return;
    const nextEje = rows.length > 0 ? Math.max(...rows.map((r) => Number(r.eje) || 0)) + 1 : 1;
    onChange([...rows, emptyRow(nextEje)]);
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
      <div className="border overflow-x-auto">
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
              <th className="font-medium text-xs px-2 py-1.5 text-left" style={{ color: headerColor, width: '8%' }}>Eje</th>
              <th className="font-medium text-xs px-2 py-1.5 text-left" style={{ color: headerColor, width: '20%' }}>Nivel</th>
              <th className="font-medium text-xs px-2 py-1.5 text-left" style={{ color: headerColor, width: '42%' }}>Aceite / Grasa</th>
              <th className="font-medium text-xs px-2 py-1.5 text-left" style={{ color: headerColor, width: '20%' }}>Cantidad</th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={!readOnly ? 5 : 4}
                  className="px-3 py-4 text-center text-xs text-gray-400 italic"
                >
                  Sin datos. Pulsa + para anadir una fila.
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-2 py-1 border-t border-gray-100">
                    <Input
                      type="number"
                      min={1}
                      value={row.eje}
                      onChange={(e) => updateCell(ri, 'eje', Number(e.target.value) || '')}
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-7 text-xs text-center border-0 bg-transparent p-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-2 py-1 border-t border-gray-100">
                    <Input
                      value={row.nivelMantenimiento}
                      onChange={(e) => updateCell(ri, 'nivelMantenimiento', e.target.value)}
                      placeholder="N1, N2..."
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-7 text-xs border-0 bg-transparent px-1 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-2 py-1 border-t border-gray-100">
                    <select
                      value={row.aceiteId ?? ''}
                      onChange={(e) => handleAceiteChange(ri, e.target.value)}
                      disabled={readOnly}
                      className="h-7 w-full text-xs border-0 bg-transparent px-0 focus:ring-1 focus:ring-primary rounded"
                    >
                      <option value="">— Seleccionar aceite —</option>
                      {activeAceites.map((a) => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1 border-t border-gray-100">
                    <Input
                      value={row.cantidad}
                      onChange={(e) => updateCell(ri, 'cantidad', e.target.value)}
                      placeholder="1.2L"
                      readOnly={readOnly}
                      disabled={readOnly}
                      className="h-7 text-xs border-0 bg-transparent px-1 focus-visible:ring-0"
                    />
                  </td>
                  {!readOnly && (
                    <td className="px-1 py-1 text-center border-t border-gray-100">
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
              ))
            )}
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
          Anadir fila
        </Button>
      )}
    </div>
  );
}
