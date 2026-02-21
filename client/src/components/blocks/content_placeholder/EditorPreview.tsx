import { LayoutTemplate } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const label = (block.config.label as string) || 'Contenido del informe';

  return (
    <div className="w-full border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-md p-6 flex flex-col items-center justify-center gap-2">
      <LayoutTemplate className="h-8 w-8 text-blue-400" />
      <span className="text-sm font-medium text-blue-500">{label}</span>
      <span className="text-[10px] text-blue-400">
        Aqui se insertaran las secciones del informe segun la plantilla del modelo
      </span>
    </div>
  );
}
