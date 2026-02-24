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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboard, useCalendario } from '@/hooks/useDashboard';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, description, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

const ESTADO_COLORS: Record<string, string> = {
  borrador: 'bg-gray-200 text-gray-700 border-gray-300',
  en_curso: 'bg-blue-100 text-blue-700 border-blue-300',
  completada: 'bg-green-100 text-green-700 border-green-300',
  facturada: 'bg-purple-100 text-purple-700 border-purple-300',
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
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      intervenciones: [],
    });
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    const dayIntervenciones = intervenciones.filter((intv) => {
      const start = intv.fechaInicio ? new Date(intv.fechaInicio) : null;
      const end = intv.fechaFin ? new Date(intv.fechaFin) : null;
      return isDateInRange(d, start, end);
    });
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, today),
      intervenciones: dayIntervenciones,
    });
  }

  // Fill remaining days to complete the grid (6 rows max)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      intervenciones: [],
    });
  }

  return days;
}

function CalendarioIntervenciones() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const mes = formatMes(currentDate);
  const { data: intervenciones, isLoading } = useCalendario(mes);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(
    () => buildCalendarDays(year, month, intervenciones ?? []),
    [year, month, intervenciones],
  );

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">
            {MES_NOMBRES[month]} {year}
          </h3>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs mr-2">
            Hoy
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {dia}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[100px] border-b border-r p-1 ${
              !day.isCurrentMonth ? 'bg-muted/30' : ''
            } ${day.isToday ? 'bg-blue-50/50' : ''} ${
              idx % 7 === 6 ? 'border-r-0' : ''
            }`}
          >
            <div className={`text-right text-xs px-1 py-0.5 ${
              day.isToday
                ? 'font-bold text-white bg-primary rounded-full w-6 h-6 flex items-center justify-center ml-auto'
                : day.isCurrentMonth
                  ? 'text-foreground'
                  : 'text-muted-foreground/50'
            }`}>
              {day.date.getDate()}
            </div>

            <div className="space-y-0.5 mt-0.5">
              {day.intervenciones.slice(0, 3).map((intv: any) => (
                <div
                  key={intv.id}
                  onClick={() => navigate(`/intervenciones/${intv.id}`)}
                  className={`rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer truncate border ${
                    ESTADO_COLORS[intv.estado] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                  } hover:opacity-80 transition-opacity`}
                  title={`${intv.titulo} — ${intv.cliente?.nombre}`}
                >
                  <div className="flex items-center gap-0.5">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${TIPO_DOT[intv.tipo] ?? 'bg-gray-400'}`} />
                    <span className="truncate">{intv.titulo}</span>
                  </div>
                </div>
              ))}
              {day.intervenciones.length > 3 && (
                <p className="text-[10px] text-muted-foreground px-1">
                  +{day.intervenciones.length - 3} mas
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Preventiva
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          Correctiva
        </div>
        <span className="mx-2">|</span>
        <div className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${ESTADO_DOT.borrador}`} />
          Borrador
        </div>
        <div className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${ESTADO_DOT.en_curso}`} />
          En curso
        </div>
        <div className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${ESTADO_DOT.completada}`} />
          Completada
        </div>
        <div className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${ESTADO_DOT.facturada}`} />
          Facturada
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de mantenimiento
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Intervenciones Activas"
          value={stats?.intervencionesActivas ?? 0}
          description="En curso actualmente"
          icon={Wrench}
          color="bg-blue-600"
        />
        <StatCard
          title="Informes Pendientes"
          value={stats?.informesPendientes ?? 0}
          description="Por completar"
          icon={FileText}
          color="bg-amber-500"
        />
        <StatCard
          title="Clientes"
          value={stats?.totalClientes ?? 0}
          description="Clientes activos"
          icon={Users}
          color="bg-emerald-500"
        />
        <StatCard
          title="Sistemas"
          value={stats?.totalSistemas ?? 0}
          description="Sistemas registrados"
          icon={Cpu}
          color="bg-purple-500"
        />
      </div>

      {/* Calendar */}
      <CalendarioIntervenciones />
    </div>
  );
}
