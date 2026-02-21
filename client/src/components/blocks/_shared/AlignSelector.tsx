import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { BlockAlign } from '@/types/editor';

interface AlignSelectorProps {
  value: BlockAlign;
  onChange: (value: BlockAlign) => void;
}

const OPTIONS: { value: BlockAlign; icon: typeof AlignLeft; label: string }[] = [
  { value: 'left', icon: AlignLeft, label: 'Izquierda' },
  { value: 'center', icon: AlignCenter, label: 'Centro' },
  { value: 'right', icon: AlignRight, label: 'Derecha' },
];

export function AlignSelector({ value, onChange }: AlignSelectorProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Alineacion</Label>
      <div className="flex gap-1">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              className={`flex-1 flex items-center justify-center gap-1 rounded border px-2 py-1 text-xs ${
                value === opt.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onChange(opt.value)}
              title={opt.label}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
