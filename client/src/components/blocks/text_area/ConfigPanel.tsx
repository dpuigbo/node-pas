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
          <Label className="text-xs">Filas visibles</Label>
          <Input
            type="number"
            min={2}
            max={10}
            value={(c.rows as number) || 3}
            onChange={(e) => onChange('rows', Math.max(2, Math.min(10, Number(e.target.value) || 3)))}
            className="h-8"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={(c.placeholder as string) || ''}
            onChange={(e) => onChange('placeholder', e.target.value)}
            placeholder="Texto de ejemplo..."
            className="h-8"
          />
        </div>
      </div>
    </div>
  );
}
