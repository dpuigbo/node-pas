import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useCreateComponente(sistemaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post(`/v1/sistemas/${sistemaId}/componentes`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sistemas', sistemaId] }),
  });
}

export function useUpdateComponente(sistemaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      api.put(`/v1/sistemas/${sistemaId}/componentes/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sistemas', sistemaId] }),
  });
}

export function useDeleteComponente(sistemaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/v1/sistemas/${sistemaId}/componentes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sistemas', sistemaId] }),
  });
}
