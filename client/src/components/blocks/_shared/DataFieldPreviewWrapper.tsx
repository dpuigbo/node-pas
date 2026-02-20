import type { ReactNode } from 'react';
import type { Block } from '@/types/editor';
import { FIELD_WIDTH_CSS, type FieldWidth } from '@/types/editor';

interface DataFieldPreviewWrapperProps {
  block: Block;
  children: ReactNode;
}

/**
 * Shared wrapper for data field previews:
 * width, label, required asterisk, help text, and inner content slot
 */
export function DataFieldPreviewWrapper({ block, children }: DataFieldPreviewWrapperProps) {
  const config = block.config;
  const label = (config.label as string) || 'Campo';
  const required = !!config.required;
  const helpText = (config.helpText as string) || '';
  const width = (config.width as FieldWidth) || 'full';

  return (
    <div className={`${FIELD_WIDTH_CSS[width]} py-1`}>
      <div className="space-y-1">
        {/* Label */}
        <div className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </div>

        {/* Inner content (input preview) */}
        {children}

        {/* Help text */}
        {helpText && (
          <div className="text-[10px] text-gray-400">{helpText}</div>
        )}
      </div>
    </div>
  );
}
