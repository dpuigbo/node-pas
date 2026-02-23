import { Building2 } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { useEmpresaLogo } from '@/hooks/useCatalogos';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const title = (c.title as string) || '';
  const blockLogoUrl = (c.logoUrl as string) || '';
  const empresaLogo = useEmpresaLogo();
  const logoUrl = blockLogoUrl || empresaLogo;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-xs font-bold mb-1.5 px-1">{title}</h3>
      )}
      <div className="flex items-center gap-4 p-3">
        <div className="shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
          ) : (
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-800">Nombre del cliente</div>
          <div className="text-xs text-gray-500 mt-0.5">Direccion, CP Ciudad (Provincia)</div>
        </div>
      </div>
    </div>
  );
}
