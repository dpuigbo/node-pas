import { useEffect, useState } from 'react';
import {
  Users,
  Bot,
  Wrench,
  FileText,
  Cog,
  Droplets,
  ClipboardList,
  ListChecks,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';

const ESTADO_COLORS = {
  borrador: '#94a3b8',
  en_curso: '#3b82f6',
  completada: '#22c55e',
  facturada: '#a855f7',
};

const ESTADO_LABELS = {
  borrador: 'Borrador',
  en_curso: 'En curso',
  completada: 'Completada',
  facturada: 'Facturada',
};

const TIPO_LABELS = {
  controller: 'Controladoras',
  mechanical_unit: 'Unidades mecánicas',
  drive_unit: 'Drive units',
  external_axis: 'Ejes externos',
};

const TIPO_COLORS = {
  controller: '#3b82f6',
  mechanical_unit: '#22c55e',
  drive_unit: '#f59e0b',
  external_axis: '#a855f7',
};

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES');
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Error al cargar datos');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
        <AlertCircle size={20} />
        <p>{error}</p>
      </div>
    );
  }

  const { stats, intervenciones_por_estado, modelos_por_tipo, intervenciones_recientes, ofertas_recientes } = data;

  const pieData = modelos_por_tipo.map((m) => ({
    name: TIPO_LABELS[m.tipo] || m.tipo,
    value: m.total,
    color: TIPO_COLORS[m.tipo] || '#94a3b8',
  }));

  const intData = intervenciones_por_estado.map((e) => ({
    name: ESTADO_LABELS[e.estado] || e.estado,
    total: e.total,
    color: ESTADO_COLORS[e.estado] || '#94a3b8',
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Vista general de PAS Robotics Manage</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Clientes" value={stats.clientes} icon={Users} color="blue" />
        <StatsCard label="Sistemas" value={stats.sistemas} icon={Bot} color="purple" />
        <StatsCard label="Ofertas" value={stats.ofertas} icon={FileText} color="green" />
        <StatsCard label="Intervenciones" value={stats.intervenciones} icon={Wrench} color="amber" />
        <StatsCard label="Modelos en catálogo" value={stats.modelos} icon={Cog} color="cyan" />
        <StatsCard label="Consumibles" value={stats.consumibles} icon={Droplets} color="rose" />
        <StatsCard label="Actividades preventivas" value={stats.actividades} icon={ListChecks} color="green" />
        <StatsCard label="Informes" value={stats.informes} icon={ClipboardList} color="blue" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie — Catálogo de modelos por tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Catálogo de modelos por tipo</h2>
          {pieData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">Sin datos</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-600">{entry.name}</span>
                    <span className="font-semibold text-gray-900 ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar — Intervenciones por estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Intervenciones por estado</h2>
          {intData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">Sin intervenciones</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={intData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={24}>
                  {intData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Ofertas recientes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Ofertas recientes</h2>
          <Link to="/ofertas" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
        {ofertas_recientes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No hay ofertas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Referencia</th>
                  <th className="px-6 py-3 font-medium">Título</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {ofertas_recientes.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">{o.referencia || '—'}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{o.titulo}</td>
                    <td className="px-6 py-3 text-gray-600">{o.cliente_nombre}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        o.tipo === 'preventiva' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {o.tipo === 'preventiva' ? 'Preventiva' : 'Correctiva'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                        {o.estado}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatFecha(o.fecha_oferta)}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                      {o.total_precio != null ? `${Number(o.total_precio).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Intervenciones recientes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Intervenciones recientes</h2>
          <Link to="/intervenciones" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
        {intervenciones_recientes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No hay intervenciones</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Referencia</th>
                  <th className="px-6 py-3 font-medium">Título</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {intervenciones_recientes.map((int) => (
                  <tr key={int.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">{int.referencia || '—'}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{int.titulo}</td>
                    <td className="px-6 py-3 text-gray-600">{int.cliente_nombre}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        int.tipo === 'preventiva'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {int.tipo === 'preventiva' ? 'Preventiva' : 'Correctiva'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: (ESTADO_COLORS[int.estado] || '#94a3b8') + '20',
                          color: ESTADO_COLORS[int.estado] || '#94a3b8',
                        }}
                      >
                        {ESTADO_LABELS[int.estado] || int.estado}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatFecha(int.fecha_inicio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
