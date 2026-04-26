import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useOfertas(filters?: { clienteId?: number; estado?: string }) {
  return useQuery({
    queryKey: ['ofertas', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.clienteId) params.set('clienteId', String(filters.clienteId));
      if (filters?.estado) params.set('estado', filters.estado);
      const { data } = await api.get(`/v1/ofertas?${params}`);
      return data;
    },
  });
}

export function useOferta(id: number | undefined) {
  return useQuery({
    queryKey: ['ofertas', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/ofertas/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateOferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/ofertas', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ofertas'] }),
  });
}

export function useUpdateOferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/ofertas/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ofertas'] }),
  });
}

export function useUpdateEstadoOferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      api.patch(`/v1/ofertas/${id}/estado`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ofertas'] }),
  });
}

export function useRecalcularOferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/v1/ofertas/${id}/recalcular`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ofertas'] }),
  });
}

export function useGenerarIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fechaInicio, fechaFin }: { id: number; fechaInicio: string; fechaFin: string }) =>
      api.post(`/v1/ofertas/${id}/generar-intervencion`, { fechaInicio, fechaFin }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ofertas'] });
      qc.invalidateQueries({ queryKey: ['intervenciones'] });
    },
  });
}

export function useDeleteOferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/ofertas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ofertas'] }),
  });
}

// ===== OFERTA-COMPONENTE (mantenimiento por componente) =====

export interface NivelAplicable {
  codigo: string;
  nombre: string;
  orden: number;
  horas: number | null;
  costeLimpieza: number | null;
  tieneConsumibles: boolean;
}

export interface OfertaComponenteSeleccion {
  nivel: string | null;
  conBaterias: boolean;
  conAceite: boolean;
  horas: number | null;
  costeConsumibles: number | null;
  precioConsumibles: number | null;
  costeLimpieza: number | null;
  notas: string | null;
}

export interface OfertaComponenteItem {
  componenteSistemaId: number;
  sistemaId: number;
  sistemaNombre: string;
  tipo: string;
  etiqueta: string;
  numeroSerie: string | null;
  numEjes: number | null;
  componentePadreId: number | null;
  modeloId: number;
  modeloNombre: string;
  tipoBateriaMedida: 'smb' | 'eib' | null;
  nivelesAplicables: NivelAplicable[];
  seleccion: OfertaComponenteSeleccion | null;
}

export function useOfertaComponentesDisponibles(ofertaId: number | undefined) {
  return useQuery({
    queryKey: ['ofertas', ofertaId, 'componentes-disponibles'],
    queryFn: async () => {
      const { data } = await api.get<{
        ofertaId: number;
        tipoOferta: 'mantenimiento' | 'solo_limpieza';
        componentes: OfertaComponenteItem[];
      }>(`/v1/ofertas/${ofertaId}/componentes-disponibles`);
      return data;
    },
    enabled: !!ofertaId,
  });
}

export function useUpsertOfertaComponente(ofertaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cmpId, ...body }: {
      cmpId: number;
      nivel?: string | null;
      conBaterias?: boolean;
      conAceite?: boolean;
      notas?: string | null;
    }) => api.put(`/v1/ofertas/${ofertaId}/componente/${cmpId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'componentes-disponibles'] });
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId] });
    },
  });
}

export function useDeleteOfertaComponente(ofertaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cmpId: number) =>
      api.delete(`/v1/ofertas/${ofertaId}/componente/${cmpId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'componentes-disponibles'] });
    },
  });
}

export interface LubricacionFila {
  id: number;
  modeloComponenteId: number;
  eje: string;
  cantidadValor: number | null;
  cantidadUnidad: 'ml' | 'l' | 'g' | 'kg' | 'pcs' | 'n_a' | null;
  cantidadTextoLegacy: string | null;
  varianteTrmLegacy: string | null;
  tipoLubricanteLegacy: string | null;
  webConfig: string | null;
  notas: string | null;
  aceite: { id: number; nombre: string; fabricante: string | null } | null;
  consumible: { id: number; nombre: string; tipo: string; unidad: string | null } | null;
}

export function useModeloLubricacion(modeloId: number | undefined) {
  return useQuery({
    queryKey: ['modelos', modeloId, 'lubricacion'],
    queryFn: async () => {
      const { data } = await api.get<{
        modeloId: number;
        lubricacion: LubricacionFila[];
        fuente?: 'lubricacion' | 'lubricacion_reductora_legacy' | 'ninguna';
      }>(`/v1/modelos/${modeloId}/lubricacion`);
      return data;
    },
    enabled: !!modeloId,
  });
}

export function useUpdateLubricacion(modeloId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lubId, ...body }: {
      lubId: number;
      eje?: string;
      cantidadValor?: number | null;
      cantidadUnidad?: string | null;
      notas?: string | null;
    }) => api.put(`/v1/modelos/${modeloId}/lubricacion/${lubId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modelos', modeloId, 'lubricacion'] });
    },
  });
}

export interface ActividadModelo {
  id: number;
  componente: string;
  niveles: string | null;            // legacy CSV (deprecated)
  nivelesAsignados: string[];        // codigos canonicos asignados via actividad_nivel
  obligatoria: boolean | null;       // solo si se filtra por nivel concreto
  intervaloHoras: number | null;
  intervaloMeses: number | null;
  intervaloCondicion: string;
  notas: string | null;
  tipoActividad: { codigo: string; nombre: string; categoria: string };
  consumibles: Array<{
    id: number;
    cantidad: number | null;
    unidad: string | null;
    notas: string | null;
    consumible: { id: number; nombre: string; tipo: string; unidad: string | null; coste: number | null; precio: number | null };
  }>;
}

export function useModeloActividades(modeloId: number | undefined, nivel?: string | null) {
  return useQuery({
    queryKey: ['modelos', modeloId, 'actividades', nivel ?? '_all'],
    queryFn: async () => {
      const params = nivel ? `?nivel=${encodeURIComponent(nivel)}` : '';
      const { data } = await api.get<{ modeloId: number; nivel: string | null; actividades: ActividadModelo[] }>(
        `/v1/modelos/${modeloId}/actividades${params}`
      );
      return data;
    },
    enabled: !!modeloId,
  });
}

export function useNivelesAplicables(modeloId: number | undefined) {
  return useQuery({
    queryKey: ['modelos', modeloId, 'niveles-aplicables'],
    queryFn: async () => {
      const { data } = await api.get<{ modeloId: number; niveles: NivelAplicable[] }>(
        `/v1/modelos/${modeloId}/niveles-aplicables`
      );
      return data;
    },
    enabled: !!modeloId,
  });
}

// ===== PLANIFICACION (calendario) =====

export type TipoBloque = 'trabajo' | 'desplazamiento' | 'comida';

export interface BloqueCalendario {
  id: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM
  horaFin: string;
  tipo: TipoBloque;
  ofertaComponenteId: number | null;
  origenTipo: 'componente' | 'desplazamiento' | 'manual' | 'comida';
  notas: string | null;
}

export interface CandidatoBloque {
  id: string;
  tipo: 'trabajo' | 'desplazamiento';
  origenTipo: 'componente' | 'desplazamiento';
  ofertaComponenteId: number | null;
  componenteIds: number[];
  label: string;
  horasTotal: number;
  horasColocadas: number;
  horasPendientes: number;
  sinHoras: boolean;
  actividades: string[];
  meta: {
    sistemaNombre?: string;
    componenteEtiqueta?: string;
    componenteTipo?: string;
    nivel?: string;
  };
}

export interface BloqueRecargoDesglose {
  bloqueId: number;
  fecha: string;
  tipo: 'trabajo' | 'desplazamiento';
  horas: number;
  diaTipo: 'normal' | 'dom_festivo' | 'especial';
  franjas: { nombre: string; horas: number; recargoPct: number; importe: number }[];
  importeBase: number;
  importeRecargo: number;
}

export interface PlanificacionTotales {
  horasTrabajo: number;
  horasDesplazamiento: number;
  horasComida: number;
  precioTrabajo: number;
  precioDesplazamiento: number;
  precioRecargos: number;
  diasOcupados: number;
  diasNormales: number;
  diasDomFestivos: number;
  diasEspeciales: number;
  nochesFuera: number;
  precioDietas: number;
  precioHotel: number;
  bloquesDesglose: BloqueRecargoDesglose[];
  totalPlanificacion: number;
}

export function useOfertaPlanificacion(ofertaId: number | undefined) {
  return useQuery({
    queryKey: ['ofertas', ofertaId, 'planificacion'],
    queryFn: async () => {
      const { data } = await api.get<{
        ofertaId: number;
        bloques: BloqueCalendario[];
        totales: PlanificacionTotales;
      }>(`/v1/ofertas/${ofertaId}/planificacion`);
      return data;
    },
    enabled: !!ofertaId,
  });
}

export function useCreateBloque(ofertaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      fecha: string;
      horaInicio: string;
      horaFin: string;
      tipo: TipoBloque;
      ofertaComponenteId?: number | null;
      origenTipo?: 'componente' | 'desplazamiento' | 'manual' | 'comida';
      notas?: string | null;
    }) => api.post(`/v1/ofertas/${ofertaId}/bloques`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'planificacion'] });
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'bloques-candidatos'] });
    },
  });
}

export function useBloquesCandidatos(ofertaId: number | undefined) {
  return useQuery({
    queryKey: ['ofertas', ofertaId, 'bloques-candidatos'],
    queryFn: async () => {
      const { data } = await api.get<{
        ofertaId: number;
        candidatos: CandidatoBloque[];
      }>(`/v1/ofertas/${ofertaId}/bloques-candidatos`);
      return data;
    },
    enabled: !!ofertaId,
  });
}

export function useUpdateBloque(ofertaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: {
      id: number;
      fecha?: string;
      horaInicio?: string;
      horaFin?: string;
      tipo?: TipoBloque;
      notas?: string | null;
    }) => api.put(`/v1/ofertas/${ofertaId}/bloques/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'planificacion'] });
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'bloques-candidatos'] });
    },
  });
}

export function useDeleteBloque(ofertaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/ofertas/${ofertaId}/bloques/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'planificacion'] });
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'bloques-candidatos'] });
    },
  });
}

export function useReplaceBloques(ofertaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bloques: Array<{
      fecha: string;
      horaInicio: string;
      horaFin: string;
      tipo: TipoBloque;
      notas?: string | null;
    }>) => api.put(`/v1/ofertas/${ofertaId}/bloques`, { bloques }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ofertas', ofertaId, 'planificacion'] });
    },
  });
}
