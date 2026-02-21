import { Bot } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { useEmpresaLogo } from '@/hooks/useCatalogos';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || 'Reporte de mantenimiento';
  const subtitle = (c.subtitle as string) || '';
  const backgroundColor = (c.backgroundColor as string) || '#1f2937';
  const blockLogoUrl = (c.logoUrl as string) || '';

  // Use global empresa logo as fallback
  const empresaLogo = useEmpresaLogo();
  const logoUrl = blockLogoUrl || empresaLogo;

  return (
    <div
      className="w-full px-4 py-2 flex items-center justify-between"
      style={{ backgroundColor }}
    >
      <div>
        <span className="text-white text-xs font-semibold">{title}</span>
        {subtitle && (
          <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {subtitle}
          </span>
        )}
      </div>
      <div className="shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center">
            <Bot className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
