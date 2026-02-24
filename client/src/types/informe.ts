import type { TemplateSchema } from './editor';

export type EstadoInforme = 'inactivo' | 'activo' | 'finalizado';

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
    numEjes: number | null;
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
  intervencion: {
    id: number;
    titulo: string;
    tipo: string;
    estado: string;
    referencia: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    cliente: { id: number; nombre: string; sede: string | null };
  };
  sistema: {
    id: number;
    nombre: string;
    descripcion: string | null;
    fabricante: { id: number; nombre: string };
    planta: { id: number; nombre: string } | null;
    maquina: { id: number; nombre: string } | null;
  };
  creadoPor: { id: number; nombre: string } | null;
  componentes: ComponenteInformeDetalle[];
}

// ===== Assembled Report Types =====

export interface AssembledBlock {
  id: string;
  type: string;
  config: Record<string, unknown>;
  _source: 'document' | 'component';
  _componenteInformeId?: number;
  _componenteEtiqueta?: string;
  _dataKey?: string;
  _dataValue?: unknown;
}

export interface AssembledReportData {
  blocks: AssembledBlock[];
  pageConfig: {
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    fontSize: number;
    fontFamily: string;
  };
}

export interface AssembledReportResponse {
  informe: {
    id: number;
    estado: EstadoInforme;
    intervencion: {
      id: number;
      titulo: string;
      tipo: string;
      referencia: string | null;
      fechaInicio: string | null;
    };
    sistema: {
      id: number;
      nombre: string;
      fabricante: { id: number; nombre: string };
      planta: { id: number; nombre: string } | null;
      maquina: { id: number; nombre: string } | null;
    };
  };
  assembled: AssembledReportData;
  documentTemplate: {
    id: number;
    tipo: string;
    nombre: string;
  };
}
