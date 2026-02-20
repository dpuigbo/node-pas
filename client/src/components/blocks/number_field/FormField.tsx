import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormFieldProps } from '@/types/formField';

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || 'Campo numerico';
  const unit = (c.unit as string) || '';
  const required = !!c.required;
  const helpText = (c.helpText as string) || '';
  const min = c.min as number | null;
  const max = c.max as number | null;

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value != null ? String(value) : ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? null : Number(v));
          }}
          readOnly={readOnly}
          disabled={readOnly}
          min={min ?? undefined}
          max={max ?? undefined}
        />
        {unit && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
