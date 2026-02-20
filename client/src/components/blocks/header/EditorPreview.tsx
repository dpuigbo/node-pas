import { Bot } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || 'Informe de Mantenimiento';
  const subtitle = (c.subtitle as string) || '';
  const showLogo = c.showLogo !== false;
  const showDate = c.showDate !== false;
  const showReference = c.showReference !== false;
  const logoPosition = (c.logoPosition as string) || 'left';

  return (
    <div className="border-b pb-3 mb-2">
      <div className={`flex items-start gap-4 ${logoPosition === 'right' ? 'flex-row-reverse' : logoPosition === 'center' ? 'flex-col items-center' : ''}`}>
        {showLogo && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 border border-dashed border-gray-300">
            <Bot className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <div className={`flex-1 ${logoPosition === 'center' ? 'text-center' : ''}`}>
          <h1 className="text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          <div className="flex gap-4 mt-2 text-[10px] text-gray-400">
            {showDate && <span>Fecha: ____/____/________</span>}
            {showReference && <span>Ref: __________</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
