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
