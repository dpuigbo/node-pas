import { useEffect, useState } from 'react';
import { Wrench, Plus, Filter } from 'lucide-react';

const ESTADO_COLORS = {
  borrador: 'bg-gray-100 text-gray-600',
  en_curso: 'bg-blue-50 text-blue-700',
  completada: 'bg-green-50 text-green-700',
  facturada: 'bg-purple-50 text-purple-700',
};

const ESTADO_LABELS = {
  borrador: 'Borrador',
  en_curso: 'En curso',
  completada: 'Completada',
  facturada: 'Facturada',
};

export default function Intervenciones() {
  const [intervenciones, setIntervenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const params = filtro ? `?estado=${filtro}` : '';
    fetch(`/api/intervenciones${params}`)
      .then((r) => r.json())
      .then(setIntervenciones)
      .finally(() => setLoading(false));
  }, [filtro]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intervenciones</h1>
          <p className="text-gray-500 mt-1">Mantenimientos preventivos y correctivos</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Nueva intervención
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        <button
          onClick={() => setFiltro('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filtro ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Todas
        </button>
        {Object.entries(ESTADO_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : intervenciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Wrench size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay intervenciones{filtro ? ` con estado "${ESTADO_LABELS[filtro]}"` : ''}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 font-medium">Referencia</th>
                <th className="px-6 py-3 font-medium">Título</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Inicio</th>
              </tr>
            </thead>
            <tbody>
              {intervenciones.map((int) => (
                <tr key={int.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-3 font-mono text-xs text-gray-600">{int.referencia || '—'}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{int.titulo}</td>
                  <td className="px-6 py-3 text-gray-600">{int.cliente_nombre}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      int.tipo === 'preventiva' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {int.tipo === 'preventiva' ? 'Preventiva' : 'Correctiva'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[int.estado] || ''}`}>
                      {ESTADO_LABELS[int.estado] || int.estado}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{int.fecha_inicio || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
