import { Bot } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { useEmpresaLogo } from '@/hooks/useCatalogos';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || 'Reporte de mantenimiento';
  const subtitle = (c.subtitle as string) || '';
  const backgroundColor = (c.backgroundColor as string) || '#1f2937';
  const textColor = (c.textColor as string) || '#ffffff';
  const textSize = (c.textSize as number) || 12;
  const logoSize = (c.logoSize as number) || 24;
  const blockLogoUrl = (c.logoUrl as string) || '';
  const height = (c.height as number) || 40;

  const empresaLogo = useEmpresaLogo();
  const logoUrl = blockLogoUrl || empresaLogo;

  return (
    <div
      className="w-full px-4 flex items-center justify-between"
      style={{ backgroundColor, height: `${height}px` }}
    >
      <div className="flex flex-col">
        <span
          className="font-semibold"
          style={{ color: textColor, fontSize: `${textSize}px` }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{ color: textColor, opacity: 0.6, fontSize: `${Math.max(textSize - 2, 8)}px` }}
          >
            {subtitle}
          </span>
        )}
      </div>
      <div className="shrink-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-auto object-contain"
            style={{ height: `${logoSize}px` }}
          />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ height: `${logoSize}px`, width: `${logoSize}px` }}
          >
            <Bot className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
