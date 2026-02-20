import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Option {
  value: string;
  label: string;
}

interface OptionsEditorProps {
  options: Option[];
  onChange: (options: Option[]) => void;
}

export function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const addOption = () => {
    const idx = options.length + 1;
    onChange([...options, { value: `opcion_${idx}`, label: `Opcion ${idx}` }]);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof Option, val: string) => {
    const updated = options.map((opt, i) =>
      i === index ? { ...opt, [field]: val } : opt,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Opciones</Label>

      {options.length === 0 && (
        <p className="text-[10px] text-muted-foreground">Sin opciones definidas</p>
      )}

      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={opt.value}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase();
              updateOption(i, 'value', val);
            }}
            placeholder="valor"
            className="h-7 text-xs font-mono flex-1"
          />
          <Input
            value={opt.label}
            onChange={(e) => updateOption(i, 'label', e.target.value)}
            placeholder="Etiqueta"
            className="h-7 text-xs flex-1"
          />
          <button
            onClick={() => removeOption(i)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={addOption}>
        <Plus className="h-3 w-3 mr-1" />
        Anadir opcion
      </Button>
    </div>
  );
}
