import { Bot } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { useEmpresaLogo } from '@/hooks/useCatalogos';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const blockLogoUrl = (c.logoUrl as string) || '';
  const backgroundColor = (c.backgroundColor as string) || '#111827';

  const empresaLogo = useEmpresaLogo();
  const logoUrl = blockLogoUrl || empresaLogo;

  // back_cover is a FULL PAGE block — uses flex-1 from parent to fill all space
  return (
    <div
      className="w-full flex-1 flex items-center justify-center"
      style={{ backgroundColor }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo"
          className="max-h-24 max-w-[240px] object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-60">
          <Bot className="h-14 w-14 text-white" />
          <span className="text-white/50 text-[10px]">Logo de empresa</span>
        </div>
      )}
    </div>
  );
}
