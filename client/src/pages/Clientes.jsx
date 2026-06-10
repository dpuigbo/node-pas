import { useEffect, useState } from 'react';
import { Users, Plus, MapPin, Bot, Wrench, Mail, Phone } from 'lucide-react';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clientes')
      .then((r) => r.json())
      .then(setClientes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gestión de clientes y sus instalaciones</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientes.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{c.nombre}</h3>
                {!c.activo && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">Inactivo</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {[c.ciudad, c.provincia].filter(Boolean).join(', ') || c.sede || 'Sin ubicación'}
              </p>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                {c.persona_contacto && <p className="text-gray-600">{c.persona_contacto}</p>}
                {c.email && (
                  <p className="flex items-center gap-1.5"><Mail size={11} /> {c.email}</p>
                )}
                {c.telefono && (
                  <p className="flex items-center gap-1.5"><Phone size={11} /> {c.telefono}</p>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={12} /> {c.total_plantas} plantas</span>
                <span className="flex items-center gap-1"><Bot size={12} /> {c.total_sistemas} sistemas</span>
                <span className="flex items-center gap-1"><Wrench size={12} /> {c.total_intervenciones} interv.</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
