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
