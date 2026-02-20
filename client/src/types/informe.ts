import type { TemplateSchema } from './editor';

export type EstadoInforme = 'borrador' | 'finalizado' | 'entregado';

export interface ComponenteInformeDetalle {
  id: number;
  informeId: number;
  componenteSistemaId: number;
  versionTemplateId: number;
  tipoComponente: string;
  etiqueta: string;
  orden: number;
  schemaCongelado: TemplateSchema;
  datos: Record<string, unknown>;
  componenteSistema: {
    id: number;
    etiqueta: string;
    tipo: string;
    numeroSerie: string | null;
    modeloComponente: { id: number; nombre: string; tipo: string };
  };
}

export interface InformeDetalle {
  id: number;
  intervencionId: number;
  sistemaId: number;
  estado: EstadoInforme;
  fechaRealizacion: string | null;
  notas: string | null;
  creadoPorId: number | null;
  createdAt: string;
  updatedAt: string;
  intervencion: { id: number; titulo: string; tipo: string; estado: string };
  sistema: { id: number; nombre: string; fabricante: { nombre: string } };
  creadoPor: { id: number; nombre: string } | null;
  componentes: ComponenteInformeDetalle[];
}
