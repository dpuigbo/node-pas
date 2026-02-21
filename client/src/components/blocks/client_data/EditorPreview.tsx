import { Building2 } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || '';

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-xs font-bold mb-1.5 px-1">{title}</h3>
      )}
      <div className="flex items-start gap-4 border border-gray-200 rounded p-3">
        <div className="shrink-0 w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
          <Building2 className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-700">Nombre del cliente</div>
          <div className="text-[10px] text-gray-500 mt-1 space-y-0.5">
            <div>Direccion del cliente</div>
            <div>Ciudad, CP (Provincia)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
