import { useState, Fragment } from 'react';
import { Loader2, Wrench, Battery, Droplet, ChevronDown, ChevronRight, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useOfertaComponentesDisponibles,
  useUpsertOfertaComponente,
  useModeloActividades,
  useModeloLubricacion,
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
  const [expandido, setExpandido] = useState<Set<number>>(new Set());

  const toggleExpand = (cmpId: number) => {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(cmpId)) next.delete(cmpId);
      else next.add(cmpId);
      return next;
    });
  };

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
                const isExpanded = expandido.has(c.componenteSistemaId);
                return (
                  <Fragment key={c.componenteSistemaId}>
                  <tr className="border-b last:border-0 hover:bg-muted/10">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(c.componenteSistemaId)}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                          title={isExpanded ? 'Ocultar actividades' : 'Ver actividades de mantenimiento'}
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                        <div>
                          <div className="font-medium">{c.etiqueta}</div>
                          <div className="text-xs text-muted-foreground">
                            {TIPO_LABEL[c.tipo] ?? c.tipo}
                            {c.tipoBateriaMedida && ` · ${c.tipoBateriaMedida.toUpperCase()}`}
                            {c.numEjes && ` · ${c.numEjes} ejes`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">{c.modeloNombre}</td>
                    <td className="px-3 py-2">
                      <Select
                        value={nivelValue}
                        onValueChange={(v) => handleNivelChange(c.componenteSistemaId, v, c)}
                        disabled={readOnly || isLoading}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="— Sin nivel —" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Sin nivel —</SelectItem>
                          {c.nivelesAplicables.length === 0 ? (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                              No hay niveles configurados
                            </div>
                          ) : (
                            c.nivelesAplicables.map((n) => (
                              <SelectItem key={n.codigo} value={n.codigo}>
                                {n.nombre}
                                <span className="ml-1 text-muted-foreground text-[10px]">({n.codigo})</span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        disabled={readOnly || isLoading}
                        onClick={() => handleToggle(c.componenteSistemaId, 'conBaterias', !(sel?.conBaterias ?? true), c)}
                        className={`inline-flex items-center justify-center h-7 w-7 rounded transition-colors ${
                          (sel?.conBaterias ?? true)
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-400 line-through hover:bg-gray-200'
                        } disabled:opacity-50`}
                        title={(sel?.conBaterias ?? true) ? 'Cambiar baterias (click para excluir)' : 'Baterias excluidas (click para incluir)'}
                      >
                        <Battery className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {(c.tipo === 'mechanical_unit' || c.tipo === 'external_axis') ? (
                        <button
                          type="button"
                          disabled={readOnly || isLoading || !sel?.nivel}
                          onClick={() => handleToggle(c.componenteSistemaId, 'conAceite', !(sel?.conAceite ?? true), c)}
                          className={`inline-flex items-center justify-center h-7 w-7 rounded transition-colors ${
                            (sel?.conAceite ?? true)
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-400 line-through hover:bg-gray-200'
                          } disabled:opacity-50`}
                          title={
                            !sel?.nivel
                              ? 'Selecciona nivel primero'
                              : (sel?.conAceite ?? true) ? 'Cambiar aceite (click para excluir)' : 'Aceite excluido (click para incluir)'
                          }
                        >
                          <Droplet className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
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
                  {isExpanded && (
                    <tr className="border-b last:border-0 bg-muted/5">
                      <td colSpan={8} className="px-6 py-3 space-y-4">
                        <ActividadesComponente modeloId={c.modeloId} nivel={sel?.nivel ?? null} />
                        {(c.tipo === 'mechanical_unit' || c.tipo === 'external_axis') && (
                          <LubricacionView modeloId={c.modeloId} />
                        )}
                      </td>
                    </tr>
                  )}
                  </Fragment>
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

function LubricacionView({ modeloId }: { modeloId: number }) {
  const { data, isLoading } = useModeloLubricacion(modeloId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Cargando lubricacion...
      </div>
    );
  }

  const filas = data?.lubricacion ?? [];
  if (filas.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No hay datos de lubricacion configurados para este modelo. Editalos en la vista de modelos.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Droplet className="h-3.5 w-3.5" />
        Lubricacion del modelo
        <span className="text-muted-foreground">({filas.length} ejes)</span>
        {data?.fuente === 'lubricacion_reductora_legacy' && (
          <Badge variant="outline" className="text-[10px]">legacy</Badge>
        )}
      </div>
      <div className="rounded border bg-background overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-2 py-1 text-left">Eje</th>
              <th className="px-2 py-1 text-left">Aceite/Consumible</th>
              <th className="px-2 py-1 text-right">Cantidad</th>
              <th className="px-2 py-1 text-left">Unidad</th>
              <th className="px-2 py-1 text-left">Notas</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="px-2 py-1 font-medium">{f.eje}</td>
                <td className="px-2 py-1 text-muted-foreground">
                  {f.consumible?.nombre ?? f.aceite?.nombre ?? f.tipoLubricanteLegacy ?? '—'}
                </td>
                <td className="px-2 py-1 text-right font-mono">
                  {f.cantidadValor != null ? Number(f.cantidadValor).toFixed(2) : (f.cantidadTextoLegacy ?? '—')}
                </td>
                <td className="px-2 py-1">{f.cantidadUnidad ?? '—'}</td>
                <td className="px-2 py-1 text-muted-foreground">{f.notas ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActividadesComponente({ modeloId, nivel }: { modeloId: number; nivel: string | null }) {
  const { data, isLoading } = useModeloActividades(modeloId, nivel ?? undefined);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Cargando actividades...
      </div>
    );
  }

  const acts = data?.actividades ?? [];
  if (acts.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        {nivel
          ? `No hay actividades de mantenimiento configuradas para nivel ${nivel} en la familia de este modelo.`
          : 'No hay actividades de mantenimiento configuradas para la familia de este modelo.'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ListChecks className="h-3.5 w-3.5" />
        Actividades de mantenimiento aplicables
        {nivel && <Badge variant="secondary" className="text-[10px]">Nivel {nivel}</Badge>}
        <span className="text-muted-foreground">({acts.length})</span>
      </div>
      <div className="rounded border bg-background overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-2 py-1 text-left">Actividad</th>
              <th className="px-2 py-1 text-left">Componente</th>
              <th className="px-2 py-1 text-left">Intervalo</th>
              <th className="px-2 py-1 text-left">Niveles</th>
              <th className="px-2 py-1 text-left">Consumibles</th>
            </tr>
          </thead>
          <tbody>
            {acts.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-2 py-1 font-medium">{a.tipoActividad.nombre}</td>
                <td className="px-2 py-1 text-muted-foreground">{a.componente}</td>
                <td className="px-2 py-1 text-muted-foreground">
                  {a.intervaloHoras ? `${a.intervaloHoras}h` : ''}
                  {a.intervaloHoras && a.intervaloMeses ? ' / ' : ''}
                  {a.intervaloMeses ? `${a.intervaloMeses}m` : ''}
                  {!a.intervaloHoras && !a.intervaloMeses && '—'}
                </td>
                <td className="px-2 py-1">
                  {a.nivelesAsignados && a.nivelesAsignados.length > 0 ? (
                    a.nivelesAsignados.map((n) => (
                      <Badge
                        key={n}
                        variant={a.obligatoria === false ? 'outline' : 'secondary'}
                        className="text-[10px] mr-0.5"
                      >
                        {n}{a.obligatoria === false && ' *'}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-[10px]">sin asignar</span>
                  )}
                </td>
                <td className="px-2 py-1">
                  {a.consumibles.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {a.consumibles.map((ac) => (
                        <span key={ac.id} className="inline-flex items-center gap-1 rounded bg-muted/40 px-1.5 py-0.5">
                          <span className="font-medium">{ac.consumible.nombre}</span>
                          {ac.cantidad != null && (
                            <span className="text-muted-foreground font-mono">
                              ×{Number(ac.cantidad).toFixed(2)}{ac.unidad ?? ac.consumible.unidad ?? ''}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
