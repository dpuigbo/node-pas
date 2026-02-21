import { FileStack } from 'lucide-react';
import type { EditorPreviewProps } from '@/components/blocks/registry';
import { DOCUMENT_SECTIONS } from '@/types/editor';
import type { DocumentSection } from '@/types/editor';

export function EditorPreview({ block }: EditorPreviewProps) {
  const sectionId = (block.config.section as DocumentSection) || 'portada';
  const sectionDef = DOCUMENT_SECTIONS.find((s) => s.id === sectionId);
  const label = sectionDef?.label || sectionId;
  const color = sectionDef?.color || '#6b7280';

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-sm select-none"
      style={{
        backgroundColor: `${color}15`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <FileStack className="h-4 w-4 shrink-0" style={{ color }} />
      <span className="text-sm font-semibold tracking-wide" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 border-t border-dashed ml-2" style={{ borderColor: `${color}40` }} />
    </div>
  );
}
