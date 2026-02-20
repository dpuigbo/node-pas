import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormFieldProps } from '@/types/formField';

interface TristateValue {
  valor: 'ok' | 'nok' | 'na' | null;
  observacion: string;
}

const BUTTONS: { key: TristateValue['valor']; label: string; activeClass: string }[] = [
  { key: 'ok', label: 'OK', activeClass: 'bg-green-600 text-white border-green-600' },
  { key: 'nok', label: 'NOK', activeClass: 'bg-red-600 text-white border-red-600' },
  { key: 'na', label: 'N/A', activeClass: 'bg-gray-500 text-white border-gray-500' },
];

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || 'Punto de inspeccion';
  const withObservation = c.withObservation !== false;
  const required = !!c.required;

  const current = (value as TristateValue | null) ?? {
    valor: null,
    observacion: '',
  };

  const handleValor = (v: TristateValue['valor']) => {
    if (readOnly) return;
    onChange({
      ...current,
      valor: current.valor === v ? null : v,
    });
  };

  const handleObservacion = (obs: string) => {
    if (readOnly) return;
    onChange({ ...current, observacion: obs });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <Label className="flex-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <div className="flex gap-1">
          {BUTTONS.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => handleValor(btn.key)}
              disabled={readOnly}
              className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                current.valor === btn.key
                  ? btn.activeClass
                  : 'border-gray-300 text-gray-500 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      {withObservation && (
        <Textarea
          value={current.observacion}
          onChange={(e) => handleObservacion(e.target.value)}
          placeholder="Observaciones..."
          rows={2}
          readOnly={readOnly}
          disabled={readOnly}
          className="text-sm"
        />
      )}
    </div>
  );
}
