import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { PlaceholderInput } from '@/components/blocks/_shared/PlaceholderInput';
import { useAceites } from '@/hooks/useCatalogos';

const MAINTENANCE_LEVELS = ['1', '2 Inferior', '2 Superior', '3'] as const;

interface FixedRow {
  eje: number | string;
  tipoSuministro: string;
  aceiteId: number | null;
  unidad: string;
  volumen: string;
  niveles: string[];
}

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;
  const fixedRows = (c.fixedRows as FixedRow[]) || [];
  const { data: aceites } = useAceites();
  const activeAceites = (aceites as { id: number; nombre: string; unidad?: string; activo: boolean }[] || [])
    .filter((a) => a.activo);

  const updateFixedRows = (rows: FixedRow[]) => {
    onChange('fixedRows', rows);
  };

  const updateRow = (idx: number, field: keyof FixedRow, value: unknown) => {
    const next = fixedRows.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    updateFixedRows(next);
  };

  const handleAceiteChange = (idx: number, aceiteIdStr: string) => {
    const id = aceiteIdStr ? Number(aceiteIdStr) : null;
    const aceite = activeAceites.find((a) => a.id === id);
    const next = fixedRows.map((r, i) =>
      i === idx
        ? { ...r, aceiteId: id, tipoSuministro: aceite?.nombre || '', unidad: aceite?.unidad || '' }
        : r,
    );
    updateFixedRows(next);
  };

  const toggleNivel = (idx: number, nivel: string) => {
    const row = fixedRows[idx];
    if (!row) return;
    const current = row.niveles || [];
    const next = current.includes(nivel)
      ? current.filter((n) => n !== nivel)
      : [...current, nivel];
    updateRow(idx, 'niveles', next);
  };

  const addRow = () => {
    const nextEje = fixedRows.length > 0 ? Math.max(...fixedRows.map((r) => Number(r.eje) || 0)) + 1 : 1;
    updateFixedRows([...fixedRows, { eje: nextEje, tipoSuministro: '', aceiteId: null, unidad: '', volumen: '', niveles: [] }]);
  };

  const removeRow = (idx: number) => {
    updateFixedRows(fixedRows.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Key */}
      <div className="space-y-1">
        <Label className="text-xs">Clave (snake_case)</Label>
        <Input
          value={(c.key as string) || ''}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase();
            onChange('key', val);
          }}
          placeholder="aceites_reductoras"
          className="h-8 font-mono text-xs"
        />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={(c.label as string) || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="Aceites en reductoras"
          className="h-8"
        />
      </div>

      {/* Titulo de tabla */}
      <div className="border-t pt-3 space-y-3">
        <Label className="text-xs font-semibold">Titulo de tabla</Label>
        <div className="space-y-1">
          <Label className="text-xs">Texto del titulo</Label>
          <PlaceholderInput
            value={(c.title as string) || ''}
            onChange={(v) => onChange('title', v)}
            placeholder="Ej: Reductoras del {{componente.etiqueta}}"
          />
        </div>
        {(c.title as string) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Fondo titulo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(c.titleBg as string) || '#1f2937'}
                  onChange={(e) => onChange('titleBg', e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <Input
                  value={(c.titleBg as string) || '#1f2937'}
                  onChange={(e) => onChange('titleBg', e.target.value)}
                  className="h-8 font-mono text-xs flex-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color texto titulo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(c.titleColor as string) || '#ffffff'}
                  onChange={(e) => onChange('titleColor', e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <Input
                  value={(c.titleColor as string) || '#ffffff'}
                  onChange={(e) => onChange('titleColor', e.target.value)}
                  className="h-8 font-mono text-xs flex-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filas (datos de plantilla) */}
      <div className="border-t pt-3 space-y-2">
        <Label className="text-xs font-semibold">Filas de la tabla (datos de plantilla)</Label>
        <p className="text-[10px] text-muted-foreground">
          Define eje, tipo de aceite/grasa (del catalogo), volumen y niveles de mantenimiento.
          En el formulario, el tecnico rellena Control, Cambio y Observaciones.
        </p>
        <div className="space-y-1.5">
          {fixedRows.map((row, idx) => (
            <div key={idx} className="bg-gray-50 rounded border">
              {/* Row 1: eje, aceite, volumen, delete */}
              <div className="flex items-center gap-1.5 p-1.5">
                <Input
                  type="number"
                  min={1}
                  value={row.eje}
                  onChange={(e) => updateRow(idx, 'eje', Number(e.target.value) || '')}
                  className="h-7 w-12 text-xs text-center"
                  title="Eje"
                />
                <select
                  value={row.aceiteId ?? ''}
                  onChange={(e) => handleAceiteChange(idx, e.target.value)}
                  className="h-7 flex-1 text-xs border rounded bg-white px-1 focus:ring-1 focus:ring-primary"
                >
                  <option value="">— Aceite —</option>
                  {activeAceites.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
                <Input
                  value={row.volumen}
                  onChange={(e) => updateRow(idx, 'volumen', e.target.value)}
                  placeholder="Vol."
                  className="h-7 w-16 text-xs"
                  title="Volumen"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-500"
                  onClick={() => removeRow(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {/* Row 2: niveles de mantenimiento */}
              <div className="flex items-center gap-1.5 px-1.5 pb-1.5 pt-0">
                <span className="text-[10px] text-muted-foreground shrink-0">Niveles:</span>
                {MAINTENANCE_LEVELS.map((nivel) => {
                  const active = (row.niveles || []).includes(nivel);
                  return (
                    <button
                      key={nivel}
                      type="button"
                      onClick={() => toggleNivel(idx, nivel)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                        active
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {nivel}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1 w-full" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" />
          Anadir fila
        </Button>
      </div>

      {/* Estilo de tabla — same position as table block (after rows) */}
      <div className="border-t pt-3 space-y-3">
        <Label className="text-xs font-semibold">Estilo de tabla</Label>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Fondo cabecera</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(c.headerBg as string) || '#1f2937'}
                onChange={(e) => onChange('headerBg', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <Input
                value={(c.headerBg as string) || '#1f2937'}
                onChange={(e) => onChange('headerBg', e.target.value)}
                className="h-8 font-mono text-xs flex-1"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Texto cabecera</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(c.headerColor as string) || '#ffffff'}
                onChange={(e) => onChange('headerColor', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <Input
                value={(c.headerColor as string) || '#ffffff'}
                onChange={(e) => onChange('headerColor', e.target.value)}
                className="h-8 font-mono text-xs flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`compact-${block.id}`}
            checked={!!c.compact}
            onChange={(e) => onChange('compact', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <Label htmlFor={`compact-${block.id}`} className="text-xs cursor-pointer">
            Compacta (padding reducido)
          </Label>
        </div>
      </div>

      {/* Obligatorio */}
      <div className="border-t pt-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required-${block.id}`}
            checked={!!c.required}
            onChange={(e) => onChange('required', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <Label htmlFor={`required-${block.id}`} className="text-xs cursor-pointer">
            Obligatorio
          </Label>
        </div>
      </div>
    </div>
  );
}
