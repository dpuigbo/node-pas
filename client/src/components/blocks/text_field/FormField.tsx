import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormFieldProps } from '@/types/formField';

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || 'Campo';
  const placeholder = (c.placeholder as string) || '';
  const required = !!c.required;
  const helpText = (c.helpText as string) || '';

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Input
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
      />
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
