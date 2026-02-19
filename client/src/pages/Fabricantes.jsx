import { useEffect, useState } from 'react';
import { Factory, Plus } from 'lucide-react';

export default function Fabricantes() {
  const [fabricantes, setFabricantes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fabricantes')
      .then((r) => r.json())
      .then(setFabricantes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fabricantes</h1>
          <p className="text-gray-500 mt-1">Catálogo de fabricantes de robots industriales</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Nuevo fabricante
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fabricantes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Factory size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay fabricantes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {fabricantes.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{f.nombre}</h3>
                <span className={`w-2.5 h-2.5 rounded-full ${f.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {f.total_modelos} modelo{f.total_modelos !== 1 ? 's' : ''} de componente
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
