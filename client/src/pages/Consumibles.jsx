import { useEffect, useState } from 'react';
import { Droplets, Search } from 'lucide-react';

export default function Consumibles() {
  const [consumibles, setConsumibles] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetch('/api/consumibles/tipos')
      .then((r) => r.json())
      .then(setTipos);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (tipo) params.set('tipo', tipo);
    if (busqueda) params.set('q', busqueda);
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/consumibles?${params}`)
        .then((r) => r.json())
        .then(setConsumibles)
        .finally(() => setLoading(false));
    }, busqueda ? 300 : 0);
    return () => clearTimeout(timer);
  }, [tipo, busqueda]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consumibles</h1>
        <p className="text-gray-500 mt-1">Catálogo de aceites, grasas, baterías, filtros y repuestos</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTipo('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!tipo ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          {tipos.map((t) => (
            <button
              key={t.tipo}
              onClick={() => setTipo(t.tipo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${tipo === t.tipo ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t.tipo.replace('_', ' ')} ({t.total})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : consumibles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Droplets size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay consumibles con estos filtros</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 font-medium">Código</th>
                  <th className="px-6 py-3 font-medium">Nombre</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Fabricante</th>
                  <th className="px-6 py-3 font-medium">Proveedor</th>
                  <th className="px-6 py-3 font-medium text-right">Coste</th>
                  <th className="px-6 py-3 font-medium text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {consumibles.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">{c.codigo_interno || '—'}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{c.nombre}</td>
                    <td className="px-6 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 capitalize">
                        {(c.tipo || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{c.fabricante || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{c.proveedor || '—'}</td>
                    <td className="px-6 py-3 text-right text-gray-600">
                      {c.coste != null ? `${Number(c.coste).toFixed(2)} ${c.moneda || '€'}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                      {c.precio != null ? `${Number(c.precio).toFixed(2)} ${c.moneda || '€'}` : '—'}
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
