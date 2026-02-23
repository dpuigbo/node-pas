import { BatteryCharging } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || 'Bateria controlador';

  return (
    <div className="w-full py-1">
      <div className="flex items-center gap-3 border border-gray-200 p-3">
        <BatteryCharging className="h-5 w-5 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-700">{label}</div>
          <div className="text-[10px] text-gray-400 italic mt-0.5">Sin bateria seleccionada</div>
        </div>
      </div>
    </div>
  );
}
