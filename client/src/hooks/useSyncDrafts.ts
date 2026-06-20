import { useEffect } from 'react';
import { syncDrafts } from '@/lib/syncDrafts';

/**
 * Lanza la sincronizacion de borradores pendientes al cargar la app y cada vez que
 * se recupera la conexion. Se monta una sola vez en la raiz de la app.
 */
export function useSyncDrafts(): void {
  useEffect(() => {
    void syncDrafts();
    const onOnline = () => { void syncDrafts(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);
}
