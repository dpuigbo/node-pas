import {
  LayoutTemplate,
  Cpu,
  Bot,
  Wrench,
  Cog,
  Server,
  Tablet,
  Settings,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { SYSTEM_CONTENT_TYPES, type SystemContentType } from './constants';

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  LayoutTemplate,
  Cpu,
  Bot,
  Wrench,
  Cog,
  Server,
  Tablet,
  Settings,
};

export function EditorPreview({ block }: EditorPreviewProps) {
  const contentType = (block.config.contentType as SystemContentType) || 'all';
  const fallback = SYSTEM_CONTENT_TYPES[0] as (typeof SYSTEM_CONTENT_TYPES)[number];
  const option = SYSTEM_CONTENT_TYPES.find((t) => t.value === contentType) ?? fallback;
  const Icon = ICON_MAP[option.icon] || LayoutTemplate;

  return (
    <div className="w-full border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-md p-4 flex flex-col items-center justify-center gap-1.5">
      <Icon className="h-7 w-7 text-blue-400" />
      <span className="text-xs font-medium text-blue-600">{option.label}</span>
      <span className="text-[10px] text-blue-400 text-center max-w-[240px]">
        {option.description}
      </span>
      {contentType !== 'all' && (
        <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-blue-100 text-[9px] font-medium text-blue-600 uppercase tracking-wide">
          Seccion parcial
        </span>
      )}
    </div>
  );
}
