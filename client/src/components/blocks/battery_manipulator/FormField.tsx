import { Battery } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { FormFieldProps } from '@/types/formField';
import { useConsumibles } from '@/hooks/useCatalogos';

interface BatteryData {
  consumibleId: number | null;
  consumibleNombre: string;
  cantidad: number;
  notas: string;
}

const DEFAULT_DATA: BatteryData = {
  consumibleId: null,
  consumibleNombre: '',
  cantidad: 1,
  notas: '',
};

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || 'Bateria manipulador';
  const required = !!c.required;

  // Fetch batteries compatible with mechanical units (or universal)
  const { data: allBaterias } = useConsumibles({ tipo: 'bateria' });
  const baterias = (allBaterias as { id: number; nombre: string; activo: boolean; compatibleCon: string | null }[] || [])
    .filter((b) => b.activo && (b.compatibleCon === 'mechanical_unit' || b.compatibleCon === null));

  const data: BatteryData = (value as BatteryData) || DEFAULT_DATA;

  const update = (patch: Partial<BatteryData>) => {
    if (readOnly) return;
    onChange({ ...data, ...patch });
  };

  const handleBateriaChange = (id: string) => {
    const numId = id ? Number(id) : null;
    const bat = baterias.find((b) => b.id === numId);
    update({ consumibleId: numId, consumibleNombre: bat?.nombre || '' });
  };

  return (
    <div className="space-y-2">
      {(label || required) && (
        <Label>
          <Battery className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      <div className="border border-gray-200 p-3 space-y-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Bateria</Label>
          <select
            value={data.consumibleId ?? ''}
            onChange={(e) => handleBateriaChange(e.target.value)}
            disabled={readOnly}
            className="h-8 w-full text-xs border rounded bg-transparent px-2 focus:ring-1 focus:ring-primary"
          >
            <option value="">— Seleccionar bateria —</option>
            {baterias.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Cantidad</Label>
            <Input
              type="number"
              min={0}
              value={data.cantidad}
              onChange={(e) => update({ cantidad: Number(e.target.value) || 0 })}
              readOnly={readOnly}
              disabled={readOnly}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Notas</Label>
            <Input
              value={data.notas}
              onChange={(e) => update({ notas: e.target.value })}
              placeholder="Observaciones"
              readOnly={readOnly}
              disabled={readOnly}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
