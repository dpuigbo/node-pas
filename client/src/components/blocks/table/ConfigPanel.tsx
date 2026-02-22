import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { ColumnsEditor } from '@/components/blocks/_shared/ColumnsEditor';
import { FixedRowsEditor } from '@/components/blocks/_shared/FixedRowsEditor';
import { PlaceholderInput } from '@/components/blocks/_shared/PlaceholderInput';

interface Column {
  key: string;
  label: string;
  type: string;
  width: string;
}

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;
  const columns = (c.columns as Column[]) || [];
  const headerPosition = (c.headerPosition as string) || 'top';

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
          placeholder="nombre_tabla"
          className="h-8 font-mono text-xs"
        />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={(c.label as string) || ''}
          onChange={(e) => onChange('label', e.target.value)}
          className="h-8"
        />
      </div>

      {/* Title */}
      <div className="border-t pt-3 space-y-3">
        <Label className="text-xs font-semibold">Titulo de tabla</Label>
        <div className="space-y-1">
          <Label className="text-xs">Texto del titulo</Label>
          <PlaceholderInput
            value={(c.title as string) || ''}
            onChange={(v) => onChange('title', v)}
            placeholder="Ej: Control general de {{componente.etiqueta}}"
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

      {/* Header position */}
      <div className="border-t pt-3 space-y-2">
        <Label className="text-xs font-semibold">Posicion de cabecera</Label>
        <div className="flex gap-2">
          <label
            className={`flex-1 flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
              headerPosition === 'top'
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={`headerPos-${block.id}`}
              value="top"
              checked={headerPosition === 'top'}
              onChange={() => onChange('headerPosition', 'top')}
              className="h-3.5 w-3.5"
            />
            <div>
              <div className="text-xs font-medium">Superior</div>
              <div className="text-[10px] text-muted-foreground">Cabecera horizontal</div>
            </div>
          </label>
          <label
            className={`flex-1 flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
              headerPosition === 'left'
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={`headerPos-${block.id}`}
              value="left"
              checked={headerPosition === 'left'}
              onChange={() => onChange('headerPosition', 'left')}
              className="h-3.5 w-3.5"
            />
            <div>
              <div className="text-xs font-medium">Lateral</div>
              <div className="text-[10px] text-muted-foreground">Cabecera a la izquierda</div>
            </div>
          </label>
        </div>
      </div>

      {/* Columns */}
      <div className="border-t pt-3">
        <ColumnsEditor
          columns={columns}
          onChange={(cols) => onChange('columns', cols)}
        />
      </div>

      {/* Fixed rows */}
      <div className="border-t pt-3">
        <FixedRowsEditor
          columns={columns}
          rows={(c.fixedRows as Record<string, unknown>[]) || []}
          onChange={(rows) => onChange('fixedRows', rows)}
        />
      </div>

      {/* Table style */}
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

      {/* Allow add rows */}
      <div className="border-t pt-3 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`allowAdd-${block.id}`}
            checked={c.allowAddRows !== false}
            onChange={(e) => onChange('allowAddRows', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <Label htmlFor={`allowAdd-${block.id}`} className="text-xs cursor-pointer">
            Permitir anadir filas
          </Label>
        </div>

        {c.allowAddRows !== false && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Min filas</Label>
              <Input
                type="number"
                min={0}
                value={(c.minRows as number) || 0}
                onChange={(e) => onChange('minRows', Math.max(0, Number(e.target.value) || 0))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max filas</Label>
              <Input
                type="number"
                min={1}
                value={(c.maxRows as number) || 50}
                onChange={(e) => onChange('maxRows', Math.max(1, Number(e.target.value) || 50))}
                className="h-8"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
