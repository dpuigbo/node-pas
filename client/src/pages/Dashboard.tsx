import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  FileText,
  Users,
  Cpu,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDashboard } from '@/hooks/useDashboard';

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

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  en_curso: 'En curso',
  completada: 'Completada',
  facturada: 'Facturada',
};

const ESTADO_COLORS: Record<string, 'secondary' | 'warning' | 'success' | 'default'> = {
  borrador: 'secondary',
  en_curso: 'warning',
  completada: 'success',
  facturada: 'default',
};

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const navigate = useNavigate();

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

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Ultimas Intervenciones</h3>
        {data?.ultimasIntervenciones?.length ? (
          <div className="space-y-3">
            {data.ultimasIntervenciones.map((i: any) => (
              <div
                key={i.id}
                onClick={() => navigate(`/intervenciones/${i.id}`)}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <div>
                  <p className="font-medium">{i.titulo}</p>
                  <p className="text-sm text-muted-foreground">{i.cliente?.nombre} - {new Date(i.createdAt).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={ESTADO_COLORS[i.estado]}>{ESTADO_LABELS[i.estado]}</Badge>
                  <Badge variant="outline">{i._count?.sistemas ?? 0} sist.</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="mb-2 h-8 w-8" />
            <p className="text-sm">No hay intervenciones registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
