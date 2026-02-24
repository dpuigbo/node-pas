import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useConsumiblesNivelByFabricante(fabricanteId: number | null) {
  return useQuery({
    queryKey: ['consumibles-nivel', 'fabricante', fabricanteId],
    queryFn: async () => {
      if (!fabricanteId) return [];
      const { data } = await api.get(`/v1/consumibles-nivel/por-fabricante/${fabricanteId}`);
      return data;
    },
    enabled: !!fabricanteId,
  });
}

export function useConsumiblesNivelByModelo(modeloId: number | null) {
  return useQuery({
    queryKey: ['consumibles-nivel', 'modelo', modeloId],
    queryFn: async () => {
      if (!modeloId) return [];
      const { data } = await api.get(`/v1/consumibles-nivel?modeloId=${modeloId}`);
      return data;
    },
    enabled: !!modeloId,
  });
}

export function useUpsertConsumibleNivel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.put('/v1/consumibles-nivel', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consumibles-nivel'] }),
  });
}

export function useBatchUpsertConsumibleNivel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: any[]) => api.put('/v1/consumibles-nivel/batch', items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consumibles-nivel'] }),
  });
}
