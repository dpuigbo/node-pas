import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConfigPanelProps } from '@/components/blocks/registry';
import { DataFieldConfigBase } from '@/components/blocks/_shared/DataFieldConfigBase';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  return (
    <div className="space-y-3">
      <DataFieldConfigBase block={block} onChange={onChange} />

      <div className="border-t pt-3 space-y-1">
        <Label className="text-xs">Placeholder</Label>
        <Input
          value={(block.config.placeholder as string) || ''}
          onChange={(e) => onChange('placeholder', e.target.value)}
          placeholder="Texto de ejemplo..."
          className="h-8"
        />
      </div>
    </div>
  );
}
