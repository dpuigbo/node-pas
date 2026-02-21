import { Pen } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || 'Firma';
  const role = (c.role as string) || '';
  const required = !!c.required;

  return (
    <div className="py-1">
      <div className="text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </div>
      <div className="flex flex-col items-center justify-center rounded border border-gray-200 bg-gray-50/50 p-4 gap-1">
        <Pen className="h-5 w-5 text-gray-300" />
        <span className="text-[10px] text-gray-400">Firma</span>
        {role && (
          <span className="text-[9px] text-gray-300">{role}</span>
        )}
      </div>
    </div>
  );
}
