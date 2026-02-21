import { Bot } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const logoUrl = (c.logoUrl as string) || '';
  const backgroundColor = (c.backgroundColor as string) || '#111827';

  return (
    <div
      className="w-full flex items-center justify-center rounded-sm"
      style={{
        backgroundColor,
        minHeight: '200px',
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo"
          className="max-h-20 max-w-[200px] object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-60">
          <Bot className="h-12 w-12 text-white" />
          <span className="text-white/50 text-[10px]">Logo de empresa</span>
        </div>
      )}
    </div>
  );
}
