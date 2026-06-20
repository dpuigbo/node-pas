import { db } from './db';
import api from './api';
import { queryClient } from './queryClient';

/**
 * Sincronizacion de borradores locales (Fase B2).
 *
 * El borrador local (Dexie, ver db.ts) guarda los cambios del modo tecnico hechos sin
 * conexion. Este procesador los SUBE al servidor cuando hay red: al arrancar la app y
 * cada vez que se recupera la conexion (ver useSyncDrafts).
 *
 * El informe abierto ahora mismo en el modo tecnico lo sincroniza el PROPIO wizard
 * (respeta lo que el tecnico tiene en pantalla), asi que el sync global se lo salta
 * para no pisar ediciones en curso.
 */
let openInformeId: number | null = null;
export function setOpenInforme(id: number | null): void {
  openInformeId = id;
}

let syncing = false;

/** Sube al servidor los borradores pendientes (todos menos el informe abierto en el wizard). */
export async function syncDrafts(): Promise<void> {
  if (syncing || !navigator.onLine) return;
  syncing = true;
  try {
    const drafts = await db.drafts.toArray();
    for (const d of drafts) {
      if (d.informeId === openInformeId) continue; // lo gestiona el wizard abierto
      try {
        const ops: Promise<unknown>[] = [];
        for (const [cid, datos] of Object.entries(d.compDatos || {})) {
          if (datos && Object.keys(datos).length) {
            ops.push(api.patch(`/v1/componentes-informe/${cid}/datos`, { datos }));
          }
        }
        if (d.docDatos && Object.keys(d.docDatos).length) {
          ops.push(api.patch(`/v1/informes/${d.informeId}/datos-documento`, { datos: d.docDatos }));
        }
        if (ops.length === 0) {
          await db.drafts.delete(d.informeId);
          continue;
        }
        await Promise.all(ops);
        await db.drafts.delete(d.informeId);
        queryClient.invalidateQueries({ queryKey: ['informes', d.informeId, 'assembled'] });
      } catch {
        // Sin conexion o error puntual: se deja el borrador para reintentar mas tarde.
      }
    }
  } finally {
    syncing = false;
  }
}
