import {
  Cpu,
  Bot,
  Wrench,
  Cog,
  Server,
  Tablet,
  Settings,
  Layers,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import {
  SYSTEM_CONTENT_TYPES,
  type SystemContentType,
} from '@/components/blocks/content_placeholder/constants';

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  LayoutTemplate: Layers,
  Cpu,
  Bot,
  Wrench,
  Cog,
  Server,
  Tablet,
  Settings,
};

/** Color per content type for visual distinction */
const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  controller_info:          { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '#3b82f6' },
  manipulator_info:         { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: '#22c55e' },
  manipulator_installation: { bg: '#fefce8', border: '#eab308', text: '#854d0e', icon: '#eab308' },
  mechanical_unit_control:  { bg: '#fdf2f8', border: '#ec4899', text: '#9d174d', icon: '#ec4899' },
  cabinet_control:          { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6', icon: '#8b5cf6' },
  programming_unit_control: { bg: '#ecfeff', border: '#06b6d4', text: '#155e75', icon: '#06b6d4' },
  system_control:           { bg: '#fff7ed', border: '#f97316', text: '#9a3412', icon: '#f97316' },
};

const DEFAULT_COLOR = { bg: '#f3f4f6', border: '#6b7280', text: '#374151', icon: '#6b7280' };

export function EditorPreview({ block }: EditorPreviewProps) {
  const contentType = (block.config.contentType as SystemContentType) || 'controller_info';
  const option = SYSTEM_CONTENT_TYPES.find((t) => t.value === contentType);
  const label = option?.label ?? contentType;
  const iconName = option?.icon ?? 'Layers';
  const Icon = ICON_MAP[iconName] || Layers;
  const colors = SECTION_COLORS[contentType] ?? DEFAULT_COLOR;

  return (
    <div
      className="w-full flex items-center gap-2 px-3 py-2 rounded"
      style={{
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
      }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color: colors.icon }} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.text }}>
          {label}
        </span>
      </div>
      <div className="flex-1 border-t border-dashed" style={{ borderColor: colors.border, opacity: 0.4 }} />
    </div>
  );
}
