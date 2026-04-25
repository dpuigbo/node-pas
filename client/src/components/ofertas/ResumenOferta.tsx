import { Loader2 } from 'lucide-react';
import {
  useOfertaPlanificacion,
  useOfertaComponentesDisponibles,
} from '@/hooks/useOfertas';

interface Props {
  ofertaId: number;
  oferta: any;
}

function eur(v: number | null | undefined): string {
  if (v == null) return '0,00 €';
  return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function ResumenOferta({ ofertaId, oferta }: Props) {
  const { data: plan, isLoading: planLoading } = useOfertaPlanificacion(ofertaId);
  const { data: comps, isLoading: compsLoading } = useOfertaComponentesDisponibles(ofertaId);

  if (planLoading || compsLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Calculando totales...
      </div>
    );
  }

  const t = plan?.totales;
  if (!t) return <div className="text-sm text-muted-foreground py-4">Sin datos.</div>;

  // Totales consumibles desde oferta-componente
  const compsTotals = (comps?.componentes ?? []).reduce(
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

  const totalFinal = t.totalPlanificacion + compsTotals.precio;
  const horasComponentes = compsTotals.horas;
  const desfase = Math.abs(t.horasTrabajo - horasComponentes);

  return (
    <div className="space-y-4">
      {/* Aviso si no cuadran horas */}
      {horasComponentes > 0 && desfase > 0.5 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>Aviso:</strong> las horas planificadas de trabajo ({t.horasTrabajo.toFixed(1)} h)
          no coinciden con las horas de mantenimiento de los componentes ({horasComponentes.toFixed(1)} h).
        </div>
      )}

      {/* Bloque 1: planificacion */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/40 px-3 py-2 text-sm font-medium">Planificacion</div>
        <table className="w-full text-sm">
          <tbody>
            <Row label="Horas de trabajo" value={`${t.horasTrabajo.toFixed(1)} h`} importe={t.precioTrabajo} />
            <Row label="Horas de desplazamiento" value={`${t.horasDesplazamiento.toFixed(1)} h`} importe={t.precioDesplazamiento} />
            <Row label="Recargos por horario" value="" importe={t.precioRecargos} />
            <Row label={`Dietas (${t.diasOcupados} dias)`} value="" importe={t.precioDietas} />
            <Row label={`Hotel (${t.nochesFuera} noches)`} value="" importe={t.precioHotel} />
            <tr className="border-t bg-muted/30 font-medium">
              <td className="px-3 py-2">Subtotal planificacion</td>
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2 text-right font-mono">{eur(t.totalPlanificacion)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bloque 2: consumibles */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/40 px-3 py-2 text-sm font-medium">Consumibles + limpieza</div>
        <table className="w-full text-sm">
          <tbody>
            <Row label="Total consumibles + limpieza" value="" importe={compsTotals.precio} />
            <tr className="border-t bg-muted/30 font-medium">
              <td className="px-3 py-2">Subtotal consumibles</td>
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2 text-right font-mono">{eur(compsTotals.precio)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total final */}
      <div className="rounded-lg border-2 border-primary bg-primary/5 px-4 py-3 flex items-center justify-between">
        <div className="text-base font-medium">TOTAL OFERTA</div>
        <div className="text-2xl font-bold font-mono">{eur(totalFinal)}</div>
      </div>

      {/* Detalle de bloques con recargos */}
      {t.bloquesDesglose.length > 0 && (
        <details className="rounded-lg border">
          <summary className="px-3 py-2 cursor-pointer text-sm font-medium hover:bg-muted/30">
            Desglose por bloque ({t.bloquesDesglose.length} bloques)
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-2 py-1 text-left">Fecha</th>
                  <th className="px-2 py-1 text-left">Tipo</th>
                  <th className="px-2 py-1 text-right">Horas</th>
                  <th className="px-2 py-1 text-right">Base</th>
                  <th className="px-2 py-1 text-left">Franjas</th>
                  <th className="px-2 py-1 text-right">Recargos</th>
                </tr>
              </thead>
              <tbody>
                {t.bloquesDesglose.map((b) => (
                  <tr key={b.bloqueId} className="border-t">
                    <td className="px-2 py-1">
                      {new Date(b.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      {b.diaTipo === 'dom_festivo' && <span className="ml-1 text-amber-700">★</span>}
                      {b.diaTipo === 'especial' && <span className="ml-1 text-red-700">★★</span>}
                    </td>
                    <td className="px-2 py-1">{b.tipo}</td>
                    <td className="px-2 py-1 text-right font-mono">{b.horas.toFixed(1)}</td>
                    <td className="px-2 py-1 text-right font-mono">{eur(b.importeBase)}</td>
                    <td className="px-2 py-1 text-[10px]">
                      {b.franjas.filter((f) => f.recargoPct > 0).map((f, i) => (
                        <span key={i} className="inline-block mr-1 px-1 rounded bg-amber-100 text-amber-800">
                          {f.nombre}: +{f.recargoPct}% ({f.horas.toFixed(1)}h)
                        </span>
                      ))}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{b.importeRecargo > 0 ? eur(b.importeRecargo) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {oferta.notas && (
        <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
          <div className="text-xs text-muted-foreground mb-1">Notas</div>
          <div className="whitespace-pre-wrap">{oferta.notas}</div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, importe }: { label: string; value: string; importe: number }) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-1.5">{label}</td>
      <td className="px-3 py-1.5 font-mono text-muted-foreground">{value}</td>
      <td className="px-3 py-1.5 text-right font-mono">{eur(importe)}</td>
    </tr>
  );
}
