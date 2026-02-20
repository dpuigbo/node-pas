import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { DataFieldConfigBase } from '@/components/blocks/_shared/DataFieldConfigBase';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const c = block.config;

  return (
    <div className="space-y-3">
      <DataFieldConfigBase block={block} onChange={onChange} />

      <div className="border-t pt-3 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Unidad</Label>
          <Input
            value={(c.unit as string) || ''}
            onChange={(e) => onChange('unit', e.target.value)}
            placeholder="mm, V, A, bar..."
            className="h-8"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Minimo</Label>
            <Input
              type="number"
              value={c.min !== null && c.min !== undefined ? String(c.min) : ''}
              onChange={(e) => onChange('min', e.target.value ? Number(e.target.value) : null)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Maximo</Label>
            <Input
              type="number"
              value={c.max !== null && c.max !== undefined ? String(c.max) : ''}
              onChange={(e) => onChange('max', e.target.value ? Number(e.target.value) : null)}
              className="h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
