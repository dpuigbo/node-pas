import type { ConfigPanelProps } from '@/components/blocks/registry';
import { DataFieldConfigBase } from '@/components/blocks/_shared/DataFieldConfigBase';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  return (
    <div className="space-y-3">
      <DataFieldConfigBase block={block} onChange={onChange} />
      <p className="text-[10px] text-muted-foreground border-t pt-2">
        Este campo no tiene configuracion adicional.
      </p>
    </div>
  );
}
