import {
  Wrench,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

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

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de mantenimiento
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Intervenciones Activas"
          value={0}
          description="En curso actualmente"
          icon={Wrench}
          color="bg-blue-600"
        />
        <StatCard
          title="Informes Pendientes"
          value={0}
          description="Por completar"
          icon={FileText}
          color="bg-amber-500"
        />
        <StatCard
          title="Clientes"
          value={0}
          description="Clientes registrados"
          icon={Users}
          color="bg-emerald-500"
        />
        <StatCard
          title="Alertas"
          value={0}
          description="Requieren atencion"
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Intervenciones Recientes</h3>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="mb-2 h-8 w-8" />
            <p className="text-sm">No hay intervenciones registradas</p>
            <p className="text-xs">Las intervenciones apareceran aqui</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Informes Completados</h3>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="mb-2 h-8 w-8" />
            <p className="text-sm">No hay informes completados</p>
            <p className="text-xs">Los informes finalizados apareceran aqui</p>
          </div>
        </div>
      </div>
    </div>
  );
}
