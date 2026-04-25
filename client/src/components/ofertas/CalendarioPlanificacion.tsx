import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Briefcase, Car, Coffee, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useOfertaPlanificacion, useCreateBloque, useUpdateBloque, useDeleteBloque,
  type BloqueCalendario, type TipoBloque,
} from '@/hooks/useOfertas';

// Cuadrante: 30 minutos
const SLOT_MINUTES = 30;
const SLOT_PX = 22; // alto en pixeles de cada slot (30 min)
const HOUR_START = 0;
const HOUR_END = 24;
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * SLOTS_PER_HOUR;

const TIPO_COLOR: Record<TipoBloque, { bg: string; border: string; text: string; icon: any }> = {
  trabajo: { bg: 'bg-blue-100/80', border: 'border-blue-400', text: 'text-blue-900', icon: Briefcase },
  desplazamiento: { bg: 'bg-amber-100/80', border: 'border-amber-400', text: 'text-amber-900', icon: Car },
  comida: { bg: 'bg-green-100/80', border: 'border-green-400', text: 'text-green-900', icon: Coffee },
};

const TIPO_LABEL: Record<TipoBloque, string> = {
  trabajo: 'Trabajo',
  desplazamiento: 'Desplazamiento',
  comida: 'Comida',
};

const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

interface Props {
  ofertaId: number;
  fechaInicio?: string | null; // ISO
  fechaFin?: string | null;
  readOnly?: boolean;
}

function parseHora(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function CalendarioPlanificacion({ ofertaId, fechaInicio, fechaFin, readOnly = false }: Props) {
  const { data, isLoading } = useOfertaPlanificacion(ofertaId);
  const create = useCreateBloque(ofertaId);
  const update = useUpdateBloque(ofertaId);
  const del = useDeleteBloque(ofertaId);

  // Semana visible
  const initialMonday = useMemo(() => {
    if (fechaInicio) return getMonday(new Date(fechaInicio));
    return getMonday(new Date());
  }, [fechaInicio]);
  const [weekStart, setWeekStart] = useState<Date>(initialMonday);

  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoBloque>('trabajo');
  const [drag, setDrag] = useState<null | { dayIdx: number; startSlot: number; endSlot: number }>(null);
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<{ dayIdx: number; startSlot: number; endSlot: number } | null>(null);

  // Limites de fecha (de la oferta)
  const limMin = fechaInicio ? new Date(fechaInicio) : null;
  const limMax = fechaFin ? new Date(fechaFin) : null;
  if (limMin) limMin.setHours(0, 0, 0, 0);
  if (limMax) limMax.setHours(0, 0, 0, 0);

  const dias = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const fechasStr = dias.map(formatDate);

  const bloques = data?.bloques ?? [];
  const bloquesPorDia = useMemo(() => {
    const map = new Map<string, BloqueCalendario[]>();
    for (const b of bloques) {
      const list = map.get(b.fecha) ?? [];
      list.push(b);
      map.set(b.fecha, list);
    }
    return map;
  }, [bloques]);

  const handleSlotMouseDown = (dayIdx: number, slot: number, e: React.MouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const next = { dayIdx, startSlot: slot, endSlot: slot + 1 };
    setDrag(next);
    dragRef.current = next;
  };

  const handleSlotMouseEnter = (dayIdx: number, slot: number) => {
    if (!dragRef.current) return;
    if (dragRef.current.dayIdx !== dayIdx) return;
    const startSlot = Math.min(dragRef.current.startSlot, slot);
    const endSlot = Math.max(dragRef.current.startSlot, slot) + 1;
    const next = { dayIdx, startSlot, endSlot };
    setDrag(next);
    dragRef.current = next;
  };

  const handleMouseUp = async () => {
    if (!dragRef.current) return;
    const { dayIdx, startSlot, endSlot } = dragRef.current;
    setDrag(null);
    dragRef.current = null;
    const fecha = fechasStr[dayIdx];
    const horaInicio = minutesToHHMM(startSlot * SLOT_MINUTES);
    const horaFin = minutesToHHMM(endSlot * SLOT_MINUTES);
    setBusy(true);
    try {
      await create.mutateAsync({ fecha, horaInicio, horaFin, tipo: tipoSeleccionado });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteBloque = async (id: number) => {
    setBusy(true);
    try {
      await del.mutateAsync(id);
    } finally {
      setBusy(false);
    }
  };

  const handleChangeTipoBloque = async (b: BloqueCalendario, tipo: TipoBloque) => {
    setBusy(true);
    try {
      await update.mutateAsync({ id: b.id, tipo });
    } finally {
      setBusy(false);
    }
  };

  const totales = data?.totales;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando planificacion...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium min-w-[180px] text-center">
            {dias[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            {' - '}
            {dias[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <Button size="sm" variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setWeekStart(initialMonday)}>
            Hoy
          </Button>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tipo bloque al arrastrar:</span>
            <Select value={tipoSeleccionado} onValueChange={(v: any) => setTipoSeleccionado(v)}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trabajo">
                  <span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Trabajo</span>
                </SelectItem>
                <SelectItem value="desplazamiento">
                  <span className="flex items-center gap-2"><Car className="h-3.5 w-3.5" /> Desplazamiento</span>
                </SelectItem>
                <SelectItem value="comida">
                  <span className="flex items-center gap-2"><Coffee className="h-3.5 w-3.5" /> Comida</span>
                </SelectItem>
              </SelectContent>
            </Select>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-lg border overflow-hidden select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (drag) handleMouseUp(); }}
      >
        {/* Header dias */}
        <div className="grid bg-muted/40 text-xs font-medium border-b" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="px-2 py-1.5"></div>
          {dias.map((d, i) => {
            const fecha = fechasStr[i];
            const blocks = bloquesPorDia.get(fecha) ?? [];
            const horasDia = blocks.reduce((sum, b) => {
              if (b.tipo === 'comida') return sum;
              const mins = parseHora(b.horaFin) - parseHora(b.horaInicio);
              return sum + (mins > 0 ? mins / 60 : 0);
            }, 0);
            const fueraRango = (limMin && d < limMin) || (limMax && d > limMax);
            return (
              <div key={i} className={`px-2 py-1.5 text-center border-l ${fueraRango ? 'bg-muted/60 text-muted-foreground' : ''}`}>
                <div>{DIAS_SEMANA[i]}</div>
                <div className="text-base font-semibold">{d.getDate()}</div>
                {horasDia > 0 && <div className="text-[10px] text-muted-foreground">{horasDia.toFixed(1)}h</div>}
              </div>
            );
          })}
        </div>

        {/* Slots */}
        <div className="grid relative" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          {/* Hora labels */}
          <div className="border-r">
            {Array.from({ length: HOUR_END - HOUR_START }, (_, h) => (
              <div
                key={h}
                className="text-[10px] text-muted-foreground text-right pr-1.5 border-b"
                style={{ height: SLOTS_PER_HOUR * SLOT_PX }}
              >
                {String(HOUR_START + h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dias.map((dia, dayIdx) => {
            const fecha = fechasStr[dayIdx];
            const dayBlocks = bloquesPorDia.get(fecha) ?? [];
            const fueraRango = (limMin && dia < limMin) || (limMax && dia > limMax);
            return (
              <div key={dayIdx} className={`relative border-l ${fueraRango ? 'bg-muted/30' : ''}`}>
                {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
                  const isHourMark = slot % SLOTS_PER_HOUR === 0;
                  const isHalfHour = slot % SLOTS_PER_HOUR === SLOTS_PER_HOUR / 2;
                  const inDrag =
                    drag &&
                    drag.dayIdx === dayIdx &&
                    slot >= drag.startSlot &&
                    slot < drag.endSlot;
                  return (
                    <div
                      key={slot}
                      onMouseDown={(e) => handleSlotMouseDown(dayIdx, slot, e)}
                      onMouseEnter={() => handleSlotMouseEnter(dayIdx, slot)}
                      className={`
                        ${isHourMark ? 'border-t' : ''}
                        ${isHalfHour ? 'border-t border-dashed border-muted' : ''}
                        ${inDrag ? 'bg-primary/20' : ''}
                        ${!readOnly && !fueraRango ? 'cursor-pointer hover:bg-primary/5' : ''}
                      `}
                      style={{ height: SLOT_PX }}
                    />
                  );
                })}

                {/* Bloques renderizados absolutos */}
                {dayBlocks.map((b) => {
                  const startMin = parseHora(b.horaInicio);
                  const endMin = parseHora(b.horaFin);
                  const top = (startMin / SLOT_MINUTES) * SLOT_PX;
                  const height = ((endMin - startMin) / SLOT_MINUTES) * SLOT_PX;
                  const c = TIPO_COLOR[b.tipo];
                  const Icon = c.icon;
                  return (
                    <div
                      key={b.id}
                      className={`absolute left-0.5 right-0.5 rounded border ${c.bg} ${c.border} ${c.text} px-1 py-0.5 text-[11px] overflow-hidden group`}
                      style={{ top, height }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 font-medium leading-tight">
                        <Icon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{b.horaInicio}-{b.horaFin}</span>
                      </div>
                      {!readOnly && (
                        <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 flex gap-0.5">
                          <Select value={b.tipo} onValueChange={(v: any) => handleChangeTipoBloque(b, v)}>
                            <SelectTrigger className="h-4 w-4 p-0 border-none bg-white/70" />
                            <SelectContent>
                              <SelectItem value="trabajo">Trabajo</SelectItem>
                              <SelectItem value="desplazamiento">Desplazamiento</SelectItem>
                              <SelectItem value="comida">Comida</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            onClick={() => handleDeleteBloque(b.id)}
                            className="h-4 w-4 rounded bg-white/70 hover:bg-red-200 text-red-700 flex items-center justify-center"
                            title="Eliminar bloque"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen rapido */}
      {totales && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <Stat label="Horas trabajo" value={`${totales.horasTrabajo.toFixed(1)} h`} color="blue" />
          <Stat label="Horas viaje" value={`${totales.horasDesplazamiento.toFixed(1)} h`} color="amber" />
          <Stat label="Dias ocupados" value={`${totales.diasOcupados}`} color="green" />
          <Stat label="Noches fuera" value={`${totales.nochesFuera}`} color="violet" />
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-300 border border-blue-500"></span>Trabajo</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-300 border border-amber-500"></span>Desplazamiento</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-300 border border-green-500"></span>Comida</span>
        {!readOnly && (
          <span className="ml-auto text-[11px] italic">Arrastra en celdas vacias para crear · hover sobre bloque para editar/borrar</span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-300 bg-blue-50',
    amber: 'border-amber-300 bg-amber-50',
    green: 'border-green-300 bg-green-50',
    violet: 'border-violet-300 bg-violet-50',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${colorMap[color] ?? ''}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}
