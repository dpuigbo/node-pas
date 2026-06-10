import { useEffect, useState } from 'react';
import { Cog, Search } from 'lucide-react';

const TIPO_LABELS = {
  controller: 'Controladora',
  mechanical_unit: 'Unidad mecánica',
  drive_unit: 'Drive unit',
  external_axis: 'Eje externo',
};

const TIPO_BADGES = {
  controller: 'bg-blue-50 text-blue-700',
  mechanical_unit: 'bg-green-50 text-green-700',
  drive_unit: 'bg-amber-50 text-amber-700',
  external_axis: 'bg-purple-50 text-purple-700',
};

export default function Modelos() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ activa: '1' });
    if (tipo) params.set('tipo', tipo);
    if (busqueda) params.set('q', busqueda);
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/modelos?${params}`)
        .then((r) => r.json())
        .then(setModelos)
        .finally(() => setLoading(false));
    }, busqueda ? 300 : 0);
    return () => clearTimeout(timer);
  }, [tipo, busqueda]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de modelos</h1>
        <p className="text-gray-500 mt-1">Modelos de componentes con sus datos de mantenimiento</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar modelo..."
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTipo('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!tipo ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          {Object.entries(TIPO_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTipo(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tipo === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : modelos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Cog size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay modelos con estos filtros</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 text-xs text-gray-500">
            {modelos.length} modelo{modelos.length !== 1 ? 's' : ''}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 font-medium">Modelo</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Familia</th>
                  <th className="px-6 py-3 font-medium">Fabricante</th>
                  <th className="px-6 py-3 font-medium">Niveles</th>
                </tr>
              </thead>
              <tbody>
                {modelos.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-medium text-gray-900">{m.nombre}</span>
                      {m.type_variant && <span className="text-gray-400 ml-2 text-xs">{m.type_variant}</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_BADGES[m.tipo] || ''}`}>
                        {TIPO_LABELS[m.tipo] || m.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{m.familia_codigo || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{m.fabricante_nombre}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-1">
                        {m.nivel_n1 ? <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">N1</span> : null}
                        {m.nivel_n2_inf ? <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">N2i</span> : null}
                        {m.nivel_n2_sup ? <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">N2s</span> : null}
                        {m.nivel_n3 ? <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-xs font-medium">N3</span> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
