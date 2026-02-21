import { Bot } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { useEmpresaLogo } from '@/hooks/useCatalogos';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || 'Reporte de mantenimiento';
  const subtitle = (c.subtitle as string) || '';
  const companyName = (c.companyName as string) || 'PAS Robotics';
  const logoPosition = (c.logoPosition as string) || 'right';
  const backgroundColor = (c.backgroundColor as string) || '#000000';
  const blockLogoUrl = (c.logoUrl as string) || '';
  const height = (c.height as number) || 280;

  const empresaLogo = useEmpresaLogo();
  const logoUrl = blockLogoUrl || empresaLogo;

  return (
    <div
      className="w-full px-8 flex items-center gap-6"
      style={{
        backgroundColor,
        height: `${height}px`,
        flexDirection: logoPosition === 'right' ? 'row' : 'row-reverse',
      }}
    >
      <div className="flex-1">
        <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {companyName}
        </p>
        <h1 className="text-2xl font-extrabold leading-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg" style={{ border: '2px dashed rgba(255,255,255,0.3)' }}>
            <Bot className="h-10 w-10" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
