import { Label } from '@/components/ui/label';
import type { FormFieldProps } from '@/types/formField';

interface ChecklistItem {
  key: string;
  label: string;
}

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || 'Lista de verificacion';
  const items = (c.items as ChecklistItem[]) || [];
  const required = !!c.required;

  // value is an array of checked keys, e.g. ["item_1", "item_3"]
  const checked = (value as string[]) ?? [];

  const toggle = (key: string) => {
    if (readOnly) return;
    const next = checked.includes(key)
      ? checked.filter((k) => k !== key)
      : [...checked, key];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sin items definidos</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={checked.includes(item.key)}
                onChange={() => toggle(item.key)}
                disabled={readOnly}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
