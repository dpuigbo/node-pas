import type { ConfigPanelProps } from '@/components/blocks/registry';
import { DataFieldConfigBase } from '@/components/blocks/_shared/DataFieldConfigBase';
import { OptionsEditor } from '@/components/blocks/_shared/OptionsEditor';

export function ConfigPanel({ block, onChange }: ConfigPanelProps) {
  const options = (block.config.options as { value: string; label: string }[]) || [];

  return (
    <div className="space-y-3">
      <DataFieldConfigBase block={block} onChange={onChange} />

      <div className="border-t pt-3">
        <OptionsEditor
          options={options}
          onChange={(newOptions) => onChange('options', newOptions)}
        />
      </div>
    </div>
  );
}
