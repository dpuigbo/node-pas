import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

/**
 * QueryClient con cache persistente (IndexedDB) para uso OFFLINE.
 * - gcTime alto: la cache no se descarta, sobrevive a recargar/cerrar la app.
 * - networkMode 'offlineFirst': sin conexion usa la cache en vez de fallar.
 * La cache persistida permite abrir un informe ya visto aunque no haya red.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 dias
      retry: 1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => (await get<string>(key)) ?? null,
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: 'pas-rq-cache',
});
