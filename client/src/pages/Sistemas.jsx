import { useEffect, useState } from 'react';
import { Bot, Plus } from 'lucide-react';

export default function Sistemas() {
  const [sistemas, setSistemas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sistemas')
      .then((r) => r.json())
      .then(setSistemas)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistemas Robóticos</h1>
          <p className="text-gray-500 mt-1">Robots instalados en las plantas de clientes</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Nuevo sistema
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sistemas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bot size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay sistemas registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sistemas.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.nombre}</h3>
                  <p className="text-sm text-gray-500 mt-1">{s.fabricante_nombre}</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {s.fabricante_nombre}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                <p>Cliente: {s.cliente_nombre}</p>
                <p>Planta: {s.planta_nombre}</p>
                <p>Máquina: {s.maquina_nombre}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
