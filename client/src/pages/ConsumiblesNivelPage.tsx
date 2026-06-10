import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useFabricantes } from '@/hooks/useFabricantes';
import { useConsumiblesNivelByFabricante, useBatchUpsertConsumibleNivel } from '@/hooks/useConsumiblesNivel';
import { getNivelesModelo, NIVEL_SHORT, NIVELES_ALL } from '@/lib/niveles';

// v2.9: esta pantalla edita las HORAS de trabajo por (modelo, nivel) en
// mantenimiento_horas_modelo (D-073). Los consumibles ya no se configuran a
// mano: salen de lubricacion + actividad_preventiva.

const TIPO_COMP_LABELS: Record<string, string> = {
  controller: 'Controladora',
  mechanical_unit: 'Manipulador',
  drive_unit: 'Drive Unit',
  external_axis: 'Eje Externo',
};

const SELECT_CLASS = 'flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

type FormData = Record<number, Record<string, string>>; // modeloId → nivel → horas (string)

export default function ConsumiblesNivelPage() {
  const { data: fabricantes } = useFabricantes();
  const [fabId, setFabId] = useState<number | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  const { data: modelos, isLoading } = useConsumiblesNivelByFabricante(fabId);
  const batchUpsert = useBatchUpsertConsumibleNivel();

  const [form, setForm] = useState<FormData>({});
  const [dirty, setDirty] = useState(false);

  // Build form data from fetched modelos
  useEffect(() => {
    if (!Array.isArray(modelos)) return;
    const fd: FormData = {};
    for (const m of modelos) {
      const niveles: Record<string, string> = {};
      for (const nv of getNivelesModelo(m)) {
        const existing = (m.horasNivel || []).find((h: any) => h.nivel === nv);
        niveles[nv] = existing?.horas != null ? String(existing.horas) : '';
      }
      fd[m.id] = niveles;
    }
    setForm(fd);
    setDirty(false);
  }, [modelos]);

  const updateHoras = useCallback((modeloId: number, nivel: string, val: string) => {
    setForm((prev) => ({
      ...prev,
      [modeloId]: { ...(prev[modeloId] ?? {}), [nivel]: val },
    }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    const items: any[] = [];
    for (const [modeloId, niveles] of Object.entries(form)) {
      for (const [nivel, horas] of Object.entries(niveles)) {
        items.push({
          modeloId: Number(modeloId),
          nivel,
          horas: horas !== '' ? Number(horas) : null,
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

  const modelosFiltrados = useMemo(() => {
    if (!Array.isArray(modelos)) return [];
    return tipoFiltro ? modelos.filter((m: any) => m.tipo === tipoFiltro) : modelos;
  }, [modelos, tipoFiltro]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Horas por nivel"
        description="Horas de trabajo del técnico por modelo y nivel de mantenimiento (el total del sistema suma manipulador + controlador)"
      />

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
        <div className="w-52">
          <Label>Tipo</Label>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className={SELECT_CLASS + ' !h-9 !text-sm'}
          >
            <option value="">Todos</option>
            {Object.entries(TIPO_COMP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
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

      <p className="text-xs text-muted-foreground">
        Las horas se redondean al alza en incrementos de 0,5 h (D-074).
        Deja una casilla vacía para eliminar las horas de ese nivel.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando modelos...</p>}

      {!fabId && <p className="text-sm text-muted-foreground">Selecciona un fabricante para ver sus modelos.</p>}

      {fabId && modelosFiltrados.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">No hay modelos para este filtro.</p>
      )}

      {fabId && modelosFiltrados.map((modelo: any) => {
        const niveles = getNivelesModelo(modelo);
        if (niveles.length === 0) return null;
        return (
          <div key={modelo.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {TIPO_COMP_LABELS[modelo.tipo] || modelo.tipo}
              </span>
              <h3 className="font-semibold">{modelo.nombre}</h3>
              {modelo.familia && <Badge variant="outline" className="text-[10px]">{modelo.familia}</Badge>}
            </div>

            <div className="flex flex-wrap gap-6">
              {niveles.map((nv) => {
                const nivelLabel = NIVELES_ALL.find((n) => n.value === nv)?.label ?? NIVEL_SHORT[nv] ?? nv;
                return (
                  <div key={nv} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-28">{nivelLabel}</span>
                    <Input
                      type="number" step="0.5" min="0"
                      className="h-7 text-xs w-20"
                      value={form[modelo.id]?.[nv] ?? ''}
                      onChange={(e) => updateHoras(modelo.id, nv, e.target.value)}
                    />
                    <span className="text-[10px] text-muted-foreground">h</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
