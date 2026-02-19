import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useSistemas(filters?: { clienteId?: number }) {
  return useQuery({
    queryKey: ['sistemas', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.clienteId) params.set('clienteId', String(filters.clienteId));
      const { data } = await api.get(`/v1/sistemas?${params}`);
      return data;
    },
  });
}

export function useSistema(id: number | undefined) {
  return useQuery({
    queryKey: ['sistemas', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/sistemas/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSistema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/sistemas', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sistemas'] }),
  });
}

export function useUpdateSistema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/sistemas/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sistemas'] }),
  });
}

export function useDeleteSistema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/sistemas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sistemas'] }),
  });
}
