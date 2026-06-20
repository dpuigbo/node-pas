import Dexie, { type Table } from 'dexie';

/**
 * Almacenamiento local (IndexedDB via Dexie) para el modo offline / local-first.
 *
 * Fase B1: `drafts` — borradores del modo tecnico (cambios sin guardar del informe).
 *   Se persisten en el dispositivo asi sobreviven a cerrar la app o quedarse sin conexion,
 *   y se restauran al reabrir el informe. Se borran cuando el guardado al servidor tiene exito.
 *
 * (Fase B2 anadira una tabla `syncQueue` para reintentar los guardados hechos sin conexion.)
 */
export interface InformeDraft {
  informeId: number;
  compDatos: Record<number, Record<string, unknown>>;
  docDatos: Record<string, unknown>;
  updatedAt: number;
}

class PasRoboticsDB extends Dexie {
  drafts!: Table<InformeDraft, number>;

  constructor() {
    super('pas-robotics');
    this.version(1).stores({
      drafts: 'informeId',
    });
  }
}

export const db = new PasRoboticsDB();
