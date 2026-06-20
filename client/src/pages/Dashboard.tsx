import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  FileText,
  Users,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboard, useCalendario } from '@/hooks/useDashboard';
import { useConfiguracion } from '@/hooks/useCatalogos';
import { useAuth } from '@/hooks/useAuth';

// ---------- Tarjeta de estadística (estilo Haulix) ----------
function StatCard({ title, value, icon: Icon, tint }: { title: string; value: string | number; icon: React.ElementType; tint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-3xl font-bold leading-none">{value}</p>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{title}</p>
    </div>
  );
}

const ESTADO_COLORS: Record<string, string> = {
  borrador: 'bg-neutral-700/50 text-neutral-300 border-neutral-600',
  en_curso: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  completada: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  facturada: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
};

const ESTADO_DOT: Record<string, string> = {
  borrador: 'bg-gray-400',
  en_curso: 'bg-blue-500',
  completada: 'bg-green-500',
  facturada: 'bg-purple-500',
};

const TIPO_DOT: Record<string, string> = {
  preventiva: 'bg-blue-400',
  correctiva: 'bg-orange-400',
};

const MES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function formatMes(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return false;
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (start && end) {
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return d >= s && d <= e;
  }
  if (start) {
    return isSameDay(d, new Date(start.getFullYear(), start.getMonth(), start.getDate()));
  }
  return false;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  intervenciones: any[];
}

function buildCalendarDays(year: number, month: number, intervenciones: any[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();

  // Monday=0, Sunday=6 (ISO week)
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days: CalendarDay[] = [];

  // Previous month days
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false, isToday: isSameDay(d, today), intervenciones: [] });
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    const dayIntervenciones = intervenciones.filter((intv) => {
      const start = intv.fechaInicio ? new Date(intv.fechaInicio) : null;
      const end = intv.fechaFin ? new Date(intv.fechaFin) : null;
      return isDateInRange(d, start, end);
    });
    days.push({ date: d, isCurrentMonth: true, isToday: isSameDay(d, today), intervenciones: dayIntervenciones });
  }

  // Fill remaining days to complete the grid (6 rows max)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ date: d, isCurrentMonth: false, isToday: isSameDay(d, today), intervenciones: [] });
  }

  return days;
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDiaCorto(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ---------- Widget: últimas intervenciones ----------
function UltimasIntervenciones({ items }: { items: any[] }) {
  const navigate = useNavigate();
  const lista = Array.isArray(items) ? items.slice(0, 6) : [];

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">Últimas intervenciones</h3>
        </div>
        <button onClick={() => navigate('/intervenciones')} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
          Ver todas
        </button>
      </div>
      {lista.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">No hay intervenciones recientes</p>
      ) : (
        <div className="grid gap-x-6 p-2 sm:grid-cols-2">
          {lista.map((r: any) => (
            <button
              key={r.id}
              onClick={() => navigate(`/intervenciones/${r.id}`)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${TIPO_DOT[r.tipo] ?? 'bg-muted-foreground'}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.titulo ?? 'Intervención'}</p>
                <p className="truncate text-xs text-muted-foreground">{r.cliente?.nombre ?? '—'}</p>
              </div>
              <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">{formatDiaCorto(r.fechaInicio ?? r.fechaFin)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Widget: intervenciones abiertas (ring real activas/pendientes) ----------
function AbiertasRing({ activas, pendientes }: { activas: number; pendientes: number }) {
  const total = activas + pendientes;
  const pct = total > 0 ? activas / total : 0;
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold">Intervenciones abiertas</h3>
      </div>
      <div className="flex flex-1 items-center justify-center gap-4 py-2">
        <div className="relative h-24 w-24">
          <svg viewBox="0 0 64 64" className="h-24 w-24 -rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="currentColor" className="text-muted" strokeWidth="6" />
            <circle
              cx="32" cy="32" r={R} fill="none"
              stroke="currentColor" className="text-primary" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{total}</span>
            <span className="text-[10px] text-muted-foreground">abiertas</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="block w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">{activas} activas</span>
          <span className="block w-fit rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{pendientes} pendientes</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Calendario (lógica intacta, estilo Haulix) ----------
function CalendarioIntervenciones() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const mes = formatMes(currentDate);
  const { data: intervenciones, isLoading } = useCalendario(mes);
  const { data: config } = useConfiguracion();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const festivosSet = useMemo(() => {
    try { return new Set(JSON.parse(config?.festivos || '[]') as string[]); } catch { return new Set<string>(); }
  }, [config?.festivos]);
  const especialesSet = useMemo(() => {
    try { return new Set(JSON.parse(config?.festivos_especiales || '[]') as string[]); } catch { return new Set<string>(); }
  }, [config?.festivos_especiales]);

  const safeIntervenciones = Array.isArray(intervenciones) ? intervenciones : [];
  const days = useMemo(() => buildCalendarDays(year, month, safeIntervenciones), [year, month, safeIntervenciones]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <CalendarIcon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-semibold">{MES_NOMBRES[month]} {year}</h3>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1">
          {festivosSet.size > 0 && (
            <span className="mr-2 hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
              <span className="h-2 w-3 rounded-sm border border-amber-500/40 bg-amber-500/20" /> Festivo
            </span>
          )}
          <Button variant="outline" size="sm" onClick={goToToday} className="mr-1 text-xs">Hoy</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Cabeceras de día */}
      <div className="grid grid-cols-7 border-b border-border">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="px-1 py-2 text-center text-[11px] font-medium text-muted-foreground">{dia}</div>
        ))}
      </div>

      {/* Rejilla */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dateStr = formatDateStr(day.date);
          const isFestivo = festivosSet.has(dateStr);
          const isEspecial = especialesSet.has(dateStr);
          const isSunday = day.date.getDay() === 0;
          return (
            <div
              key={idx}
              className={`min-h-[78px] border-b border-r border-border/60 p-1 sm:min-h-[100px] sm:p-1.5 ${
                !day.isCurrentMonth ? 'bg-muted/20' : isEspecial ? 'bg-red-500/15' : isFestivo ? 'bg-amber-500/[0.08]' : isSunday ? 'bg-muted/10' : ''
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  day.isToday ? 'bg-primary font-bold text-primary-foreground' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {day.date.getDate()}
                </div>
                {isFestivo && <span className="hidden rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-medium text-amber-300 sm:inline">Festivo</span>}
              </div>

              <div className="mt-0.5 space-y-0.5">
                {day.intervenciones.slice(0, 3).map((intv: any) => (
                  <div
                    key={intv.id}
                    onClick={() => navigate(`/intervenciones/${intv.id}`)}
                    className={`cursor-pointer truncate rounded border px-1 py-0.5 text-[10px] leading-tight transition-opacity hover:opacity-80 ${ESTADO_COLORS[intv.estado] ?? 'border-border bg-muted text-muted-foreground'}`}
                    title={`${intv.titulo} — ${intv.cliente?.nombre ?? ''}`}
                  >
                    <div className="flex items-center gap-0.5">
                      <span className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${TIPO_DOT[intv.tipo] ?? 'bg-gray-400'}`} />
                      <span className="truncate">{intv.titulo}</span>
                    </div>
                  </div>
                ))}
                {day.intervenciones.length > 3 && (
                  <p className="px-1 text-[10px] text-muted-foreground">+{day.intervenciones.length - 3} mas</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">
        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Preventiva</div>
        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" /> Correctiva</div>
        <span className="mx-1 hidden sm:inline">|</span>
        <div className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${ESTADO_DOT.en_curso}`} /> En curso</div>
        <div className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${ESTADO_DOT.completada}`} /> Completada</div>
        <div className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${ESTADO_DOT.facturada}`} /> Facturada</div>
        {(festivosSet.size > 0 || especialesSet.size > 0) && (
          <>
            <span className="mx-1 hidden sm:inline">|</span>
            {festivosSet.size > 0 && (
              <div className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm border border-amber-500/40 bg-amber-500/20" /> Festivo</div>
            )}
            {especialesSet.size > 0 && (
              <div className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm border border-red-500/40 bg-red-500/20" /> Especial</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = (user?.nombre ?? '').split(' ')[0];
  const fechaLarga = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fechaCap = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats;
  const activas = stats?.intervencionesActivas ?? 0;
  const pendientes = stats?.informesPendientes ?? 0;

  return (
    <div className="space-y-5">
      {/* Saludo + fecha + acción */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{saludo}{nombre ? `, ${nombre}` : ''}</h1>
          <p className="text-sm text-muted-foreground">{fechaCap}</p>
        </div>
        <button
          onClick={() => navigate('/intervenciones')}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Wrench className="h-4 w-4" /> Ver intervenciones
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Intervenciones activas" value={activas} icon={Wrench} tint="bg-blue-500/15 text-blue-400" />
        <StatCard title="Informes pendientes" value={pendientes} icon={FileText} tint="bg-amber-500/15 text-amber-400" />
        <StatCard title="Clientes" value={stats?.totalClientes ?? 0} icon={Users} tint="bg-emerald-500/15 text-emerald-400" />
        <StatCard title="Sistemas" value={stats?.totalSistemas ?? 0} icon={Cpu} tint="bg-purple-500/15 text-purple-400" />
      </div>

      {/* Widget de intervenciones (encima del calendario) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><UltimasIntervenciones items={data?.ultimasIntervenciones ?? []} /></div>
        <div className="lg:col-span-1"><AbiertasRing activas={activas} pendientes={pendientes} /></div>
      </div>

      {/* Calendario */}
      <CalendarioIntervenciones />
    </div>
  );
}
