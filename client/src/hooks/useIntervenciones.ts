import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useIntervenciones(filters?: { clienteId?: number; estado?: string }) {
  return useQuery({
    queryKey: ['intervenciones', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.clienteId) params.set('clienteId', String(filters.clienteId));
      if (filters?.estado) params.set('estado', filters.estado);
      const { data } = await api.get(`/v1/intervenciones?${params}`);
      return data;
    },
  });
}

export function useIntervencion(id: number | undefined) {
  return useQuery({
    queryKey: ['intervenciones', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/intervenciones/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/intervenciones', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intervenciones'] }),
  });
}

export function useUpdateIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/intervenciones/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intervenciones'] }),
  });
}

export function useDeleteIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/intervenciones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intervenciones'] }),
  });
}
