import { useState } from 'react';
import { Loader2, Wrench, Battery, Droplet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useOfertaComponentesDisponibles,
  useUpsertOfertaComponente,
  type OfertaComponenteItem,
} from '@/hooks/useOfertas';

interface Props {
  ofertaId: number;
  readOnly?: boolean;
}

const TIPO_LABEL: Record<string, string> = {
  controller: 'Controladora',
  drive_unit: 'Drive Unit',
  mechanical_unit: 'Robot',
  external_axis: 'Eje externo',
};

function formatEuros(v: number | null | undefined): string {
  if (v == null) return '-';
  return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function MantenimientoComponentes({ ofertaId, readOnly = false }: Props) {
  const { data, isLoading } = useOfertaComponentesDisponibles(ofertaId);
  const upsert = useUpsertOfertaComponente(ofertaId);

  const [busy, setBusy] = useState<number | null>(null);

  const handleNivelChange = async (cmpId: number, nivel: string, current: OfertaComponenteItem) => {
    setBusy(cmpId);
    try {
      await upsert.mutateAsync({
        cmpId,
        nivel: nivel === '__none__' ? null : nivel,
        conBaterias: current.seleccion?.conBaterias ?? true,
        conAceite: current.seleccion?.conAceite ?? true,
      });
    } finally {
      setBusy(null);
    }
  };

  const handleToggle = async (
    cmpId: number,
    field: 'conBaterias' | 'conAceite',
    value: boolean,
    current: OfertaComponenteItem
  ) => {
    setBusy(cmpId);
    try {
      await upsert.mutateAsync({
        cmpId,
        nivel: current.seleccion?.nivel ?? null,
        conBaterias: field === 'conBaterias' ? value : (current.seleccion?.conBaterias ?? true),
        conAceite: field === 'conAceite' ? value : (current.seleccion?.conAceite ?? true),
      });
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando componentes...
      </div>
    );
  }

  if (!data || data.componentes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No hay componentes en esta oferta.
      </div>
    );
  }

  // Agrupar por sistema
  const porSistema = new Map<number, { sistemaNombre: string; componentes: OfertaComponenteItem[] }>();
  for (const c of data.componentes) {
    if (!porSistema.has(c.sistemaId)) {
      porSistema.set(c.sistemaId, { sistemaNombre: c.sistemaNombre, componentes: [] });
    }
    porSistema.get(c.sistemaId)!.componentes.push(c);
  }

  // Totales globales
  const totales = data.componentes.reduce(
    (acc, c) => {
      if (c.seleccion) {
        acc.horas += c.seleccion.horas ?? 0;
        acc.coste += (c.seleccion.costeConsumibles ?? 0) + (c.seleccion.costeLimpieza ?? 0);
        acc.precio += c.seleccion.precioConsumibles ?? 0;
      }
      return acc;
    },
    { horas: 0, coste: 0, precio: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          <h4 className="font-medium">Mantenimiento por componente</h4>
          <Badge variant="secondary" className="text-xs">
            {data.tipoOferta === 'solo_limpieza' ? 'Solo limpieza' : 'Mantenimiento'}
          </Badge>
        </div>
      </div>

      {Array.from(porSistema.entries()).map(([sistemaId, { sistemaNombre, componentes }]) => (
        <div key={sistemaId} className="rounded-lg border overflow-hidden">
          <div className="bg-muted/40 px-3 py-2 text-sm font-medium">{sistemaNombre}</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/20">
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-3 py-1.5 text-left">Componente</th>
                <th className="px-3 py-1.5 text-left">Modelo</th>
                <th className="px-3 py-1.5 text-left w-40">Nivel</th>
                <th className="px-3 py-1.5 text-center">Bat.</th>
                <th className="px-3 py-1.5 text-center">Aceite</th>
                <th className="px-3 py-1.5 text-right">Horas</th>
                <th className="px-3 py-1.5 text-right">Coste</th>
                <th className="px-3 py-1.5 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {componentes.map((c) => {
                const sel = c.seleccion;
                const nivelValue = sel?.nivel ?? '__none__';
                const isLoading = busy === c.componenteSistemaId;
                const totalCoste = (sel?.costeConsumibles ?? 0) + (sel?.costeLimpieza ?? 0);
                return (
                  <tr key={c.componenteSistemaId} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.etiqueta}</div>
                      <div className="text-xs text-muted-foreground">
                        {TIPO_LABEL[c.tipo] ?? c.tipo}
                        {c.tipoBateriaMedida && ` · ${c.tipoBateriaMedida.toUpperCase()}`}
                        {c.numEjes && ` · ${c.numEjes} ejes`}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">{c.modeloNombre}</td>
                    <td className="px-3 py-2">
                      <Select
                        value={nivelValue}
                        onValueChange={(v) => handleNivelChange(c.componenteSistemaId, v, c)}
                        disabled={readOnly || isLoading || c.nivelesAplicables.length === 0}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Sin nivel —</SelectItem>
                          {c.nivelesAplicables.map((n) => (
                            <SelectItem key={n.codigo} value={n.codigo}>
                              {n.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        disabled={readOnly || isLoading || !sel?.nivel}
                        onClick={() => handleToggle(c.componenteSistemaId, 'conBaterias', !(sel?.conBaterias ?? true), c)}
                        className={`inline-flex items-center justify-center h-7 w-7 rounded ${
                          sel?.conBaterias ?? true
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-400 line-through'
                        } disabled:opacity-50`}
                        title={(sel?.conBaterias ?? true) ? 'Cambiar baterias' : 'Sin baterias'}
                      >
                        <Battery className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        disabled={readOnly || isLoading || !sel?.nivel}
                        onClick={() => handleToggle(c.componenteSistemaId, 'conAceite', !(sel?.conAceite ?? true), c)}
                        className={`inline-flex items-center justify-center h-7 w-7 rounded ${
                          sel?.conAceite ?? true
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-400 line-through'
                        } disabled:opacity-50`}
                        title={(sel?.conAceite ?? true) ? 'Cambiar aceite' : 'Sin aceite'}
                      >
                        <Droplet className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {sel?.horas != null ? Number(sel.horas).toFixed(1) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {totalCoste > 0 ? formatEuros(totalCoste) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatEuros(sel?.precioConsumibles)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="flex items-center justify-end gap-6 text-sm pt-2 border-t">
        <div>
          <span className="text-muted-foreground">Horas:</span>{' '}
          <span className="font-mono font-medium">{totales.horas.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Coste:</span>{' '}
          <span className="font-mono font-medium">{formatEuros(totales.coste)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Precio:</span>{' '}
          <span className="font-mono font-medium">{formatEuros(totales.precio)}</span>
        </div>
      </div>
    </div>
  );
}
