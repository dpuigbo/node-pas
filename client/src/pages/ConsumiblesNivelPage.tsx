import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFabricantes } from '@/hooks/useFabricantes';
import { useConsumiblesNivelByFabricante, useBatchUpsertConsumibleNivel } from '@/hooks/useConsumiblesNivel';
import { useAceites, useConsumibles } from '@/hooks/useCatalogos';

const NIVELES = [
  { value: '1', label: 'Nivel 1' },
  { value: '2_inferior', label: 'Nivel 2 Inf.' },
  { value: '2_superior', label: 'Nivel 2 Sup.' },
  { value: '3', label: 'Nivel 3' },
] as const;

const TIPO_COMP_LABELS: Record<string, string> = {
  controller: 'Controladora',
  mechanical_unit: 'Manipulador',
  drive_unit: 'Drive Unit',
  external_axis: 'Eje Externo',
};

const SELECT_CLASS = 'flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

interface ConsumibleItem {
  tipo: 'aceite' | 'bateria' | 'consumible';
  id: number;
  cantidad: number;
}

interface NivelData {
  horas: string;
  precioOtros: string;
  consumibles: ConsumibleItem[];
}

type ModeloNiveles = Record<string, NivelData>; // key = nivel value
type FormData = Record<number, ModeloNiveles>; // key = modeloId

const emptyNivel = (): NivelData => ({ horas: '', precioOtros: '', consumibles: [] });

export default function ConsumiblesNivelPage() {
  const { data: fabricantes } = useFabricantes();
  const [fabId, setFabId] = useState<number | null>(null);
  const { data: modelos, isLoading } = useConsumiblesNivelByFabricante(fabId);
  const { data: aceites } = useAceites();
  const { data: baterias } = useConsumibles({ tipo: 'bateria' });
  const { data: consumiblesGen } = useConsumibles({ tipo: 'general' });
  const batchUpsert = useBatchUpsertConsumibleNivel();

  const [form, setForm] = useState<FormData>({});
  const [dirty, setDirty] = useState(false);

  // Build form data from fetched modelos
  useEffect(() => {
    if (!Array.isArray(modelos)) return;
    const fd: FormData = {};
    for (const m of modelos) {
      const modeloNiveles: ModeloNiveles = {};
      for (const n of NIVELES) {
        const existing = (m.consumiblesNivel || []).find((cn: any) => cn.nivel === n.value);
        if (existing) {
          modeloNiveles[n.value] = {
            horas: existing.horas != null ? String(existing.horas) : '',
            precioOtros: existing.precioOtros != null ? String(existing.precioOtros) : '',
            consumibles: (existing.consumibles as ConsumibleItem[]) || [],
          };
        } else {
          modeloNiveles[n.value] = emptyNivel();
        }
      }
      fd[m.id] = modeloNiveles;
    }
    setForm(fd);
    setDirty(false);
  }, [modelos]);

  const getNd = (prev: FormData, modeloId: number, nivel: string): NivelData => {
    return prev[modeloId]?.[nivel] ?? emptyNivel();
  };

  const updateField = useCallback((modeloId: number, nivel: string, field: 'horas' | 'precioOtros', val: string) => {
    setForm((prev) => {
      const nd: NivelData = { ...getNd(prev, modeloId, nivel), [field]: val };
      const modeloNiveles: ModeloNiveles = { ...(prev[modeloId] ?? {}), [nivel]: nd };
      return { ...prev, [modeloId]: modeloNiveles };
    });
    setDirty(true);
  }, []);

  const addConsumible = useCallback((modeloId: number, nivel: string) => {
    setForm((prev) => {
      const nd = getNd(prev, modeloId, nivel);
      const updated: NivelData = { ...nd, consumibles: [...nd.consumibles, { tipo: 'aceite', id: 0, cantidad: 1 }] };
      const modeloNiveles: ModeloNiveles = { ...(prev[modeloId] ?? {}), [nivel]: updated };
      return { ...prev, [modeloId]: modeloNiveles };
    });
    setDirty(true);
  }, []);

  const updateConsumible = useCallback((modeloId: number, nivel: string, idx: number, patch: Partial<ConsumibleItem>) => {
    setForm((prev) => {
      const nd = getNd(prev, modeloId, nivel);
      const items = [...nd.consumibles];
      items[idx] = { ...items[idx], ...patch } as ConsumibleItem;
      if (patch.tipo !== undefined) items[idx].id = 0;
      const updated: NivelData = { ...nd, consumibles: items };
      const modeloNiveles: ModeloNiveles = { ...(prev[modeloId] ?? {}), [nivel]: updated };
      return { ...prev, [modeloId]: modeloNiveles };
    });
    setDirty(true);
  }, []);

  const removeConsumible = useCallback((modeloId: number, nivel: string, idx: number) => {
    setForm((prev) => {
      const nd = getNd(prev, modeloId, nivel);
      const updated: NivelData = { ...nd, consumibles: nd.consumibles.filter((_, i) => i !== idx) };
      const modeloNiveles: ModeloNiveles = { ...(prev[modeloId] ?? {}), [nivel]: updated };
      return { ...prev, [modeloId]: modeloNiveles };
    });
    setDirty(true);
  }, []);

  const getCatalogOptions = (tipo: string) => {
    if (tipo === 'aceite') return (Array.isArray(aceites) ? aceites : []).filter((a: any) => a.activo);
    if (tipo === 'bateria') return (Array.isArray(baterias) ? baterias : []).filter((b: any) => b.activo);
    return (Array.isArray(consumiblesGen) ? consumiblesGen : []).filter((c: any) => c.activo);
  };

  const handleSave = async () => {
    const items: any[] = [];
    for (const [modeloId, niveles] of Object.entries(form)) {
      for (const [nivel, data] of Object.entries(niveles)) {
        items.push({
          modeloId: Number(modeloId),
          nivel,
          horas: data.horas ? Number(data.horas) : null,
          precioOtros: data.precioOtros ? Number(data.precioOtros) : null,
          consumibles: data.consumibles.filter((c) => c.id > 0),
        });
      }
    }
    try {
      await batchUpsert.mutateAsync(items);
      setDirty(false);
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error al guardar: ' + ((err as any)?.response?.data?.message || (err as Error).message));
    }
  };

  const activos = (Array.isArray(fabricantes) ? fabricantes : []).filter((f: any) => f.activo);

  return (
    <div className="space-y-6">
      <PageHeader title="Consumibles por nivel" description="Define consumibles, horas y costes por modelo y nivel de mantenimiento" />

      <div className="flex items-end gap-4">
        <div className="w-64">
          <Label>Fabricante</Label>
          <select
            value={fabId ?? ''}
            onChange={(e) => setFabId(e.target.value ? Number(e.target.value) : null)}
            className={SELECT_CLASS + ' !h-9 !text-sm'}
          >
            <option value="">Seleccionar fabricante...</option>
            {activos.map((f: any) => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </div>
        {dirty && (
          <Button onClick={handleSave} disabled={batchUpsert.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {batchUpsert.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando modelos...</p>}

      {!fabId && <p className="text-sm text-muted-foreground">Selecciona un fabricante para ver sus modelos.</p>}

      {fabId && Array.isArray(modelos) && modelos.length === 0 && (
        <p className="text-sm text-muted-foreground">Este fabricante no tiene modelos registrados.</p>
      )}

      {fabId && Array.isArray(modelos) && modelos.map((modelo: any) => (
        <div key={modelo.id} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {TIPO_COMP_LABELS[modelo.tipo] || modelo.tipo}
            </span>
            <h3 className="font-semibold">{modelo.nombre}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-2 py-1.5 text-left w-28">Nivel</th>
                  <th className="px-2 py-1.5 text-left w-20">Horas</th>
                  <th className="px-2 py-1.5 text-left w-24">€ Otros</th>
                  <th className="px-2 py-1.5 text-left">Consumibles</th>
                </tr>
              </thead>
              <tbody>
                {NIVELES.map((n) => {
                  const nd = form[modelo.id]?.[n.value] || emptyNivel();
                  return (
                    <tr key={n.value} className="border-b last:border-0">
                      <td className="px-2 py-2 font-medium">{n.label}</td>
                      <td className="px-2 py-2">
                        <Input
                          type="number" step="0.5" min="0"
                          className="h-7 text-xs w-16"
                          value={nd.horas}
                          onChange={(e) => updateField(modelo.id, n.value, 'horas', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number" step="0.01" min="0"
                          className="h-7 text-xs w-20"
                          value={nd.precioOtros}
                          onChange={(e) => updateField(modelo.id, n.value, 'precioOtros', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="space-y-1">
                          {(nd.consumibles || []).map((c, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <select
                                value={c.tipo}
                                onChange={(e) => updateConsumible(modelo.id, n.value, idx, { tipo: e.target.value as any })}
                                className="h-7 rounded border border-input bg-transparent px-1 text-xs w-24"
                              >
                                <option value="aceite">Aceite</option>
                                <option value="bateria">Batería</option>
                                <option value="consumible">Consumible</option>
                              </select>
                              <select
                                value={c.id}
                                onChange={(e) => updateConsumible(modelo.id, n.value, idx, { id: Number(e.target.value) })}
                                className="h-7 rounded border border-input bg-transparent px-1 text-xs flex-1 min-w-0"
                              >
                                <option value={0}>Seleccionar...</option>
                                {getCatalogOptions(c.tipo).map((item: any) => (
                                  <option key={item.id} value={item.id}>{item.nombre}</option>
                                ))}
                              </select>
                              <Input
                                type="number" min="1" step="1"
                                className="h-7 text-xs w-14"
                                value={c.cantidad}
                                onChange={(e) => updateConsumible(modelo.id, n.value, idx, { cantidad: Number(e.target.value) || 1 })}
                              />
                              <button
                                type="button"
                                onClick={() => removeConsumible(modelo.id, n.value, idx)}
                                className="text-destructive hover:text-destructive/80 text-xs px-1"
                              >✕</button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addConsumible(modelo.id, n.value)}
                            className="text-xs text-primary hover:underline"
                          >+ Añadir consumible</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
