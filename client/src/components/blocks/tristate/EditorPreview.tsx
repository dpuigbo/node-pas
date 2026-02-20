import type { EditorPreviewProps } from '@/components/blocks/registry';
import { MAINTENANCE_LEVEL_COLORS, MAINTENANCE_LEVEL_LABELS, type MaintenanceLevel } from '@/types/editor';

export function EditorPreview({ block }: EditorPreviewProps) {
  const c = block.config;
  const label = (c.label as string) || 'Punto de inspeccion';
  const withObs = c.withObservation !== false;
  const level = (c.maintenanceLevel as MaintenanceLevel) || 'general';
  const required = !!c.required;

  return (
    <div className="py-1">
      <div className="flex items-center gap-2">
        {/* Maintenance level badge */}
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${MAINTENANCE_LEVEL_COLORS[level]}`}>
          {MAINTENANCE_LEVEL_LABELS[level]}
        </span>

        {/* Label */}
        <span className="flex-1 text-xs font-medium">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>

        {/* Tristate buttons */}
        <div className="flex gap-1">
          <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[9px] font-medium text-green-600">
            OK
          </span>
          <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-600">
            NOK
          </span>
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-medium text-gray-500">
            N/A
          </span>
        </div>
      </div>

      {/* Observation */}
      {withObs && (
        <div className="mt-1 ml-16">
          <div className="h-5 rounded border border-dashed border-gray-200 bg-gray-50/50 px-2 flex items-center">
            <span className="text-[9px] text-gray-300">Observaciones...</span>
          </div>
        </div>
      )}
    </div>
  );
}
