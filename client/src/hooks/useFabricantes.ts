import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useFabricantes() {
  return useQuery({
    queryKey: ['fabricantes'],
    queryFn: async () => {
      const { data } = await api.get('/v1/fabricantes');
      return data;
    },
  });
}

export function useFabricante(id: number | undefined) {
  return useQuery({
    queryKey: ['fabricantes', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/fabricantes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateFabricante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/fabricantes', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fabricantes'] }),
  });
}

export function useUpdateFabricante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/fabricantes/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fabricantes'] }),
  });
}

export function useDeleteFabricante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/fabricantes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fabricantes'] }),
  });
}
