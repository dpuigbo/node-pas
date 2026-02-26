import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useModelos(filters?: { fabricanteId?: number; tipo?: string }) {
  return useQuery({
    queryKey: ['modelos', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fabricanteId) params.set('fabricanteId', String(filters.fabricanteId));
      if (filters?.tipo) params.set('tipo', filters.tipo);
      const { data } = await api.get(`/v1/modelos?${params}`);
      return data;
    },
  });
}

export function useModelo(id: number | undefined) {
  return useQuery({
    queryKey: ['modelos', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/modelos/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/modelos', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos'] }),
  });
}

export function useUpdateModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/modelos/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos'] }),
  });
}

export function useDeleteModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/modelos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos'] }),
  });
}

// Versiones
export function useVersiones(modeloId: number | undefined) {
  return useQuery({
    queryKey: ['modelos', modeloId, 'versiones'],
    queryFn: async () => {
      const { data } = await api.get(`/v1/modelos/${modeloId}/versiones`);
      return data;
    },
    enabled: !!modeloId,
  });
}

export function useVersion(modeloId: number | undefined, versionId: number | undefined) {
  return useQuery({
    queryKey: ['modelos', modeloId, 'versiones', versionId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/modelos/${modeloId}/versiones/${versionId}`);
      return data;
    },
    enabled: !!modeloId && !!versionId,
  });
}

export function useCreateVersion(modeloId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post(`/v1/modelos/${modeloId}/versiones`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos', modeloId] }),
  });
}

export function useUpdateVersion(modeloId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/modelos/${modeloId}/versiones/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos', modeloId] }),
  });
}

export function useActivateVersion(modeloId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      api.patch(`/v1/modelos/${modeloId}/versiones/${id}/estado`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos', modeloId] }),
  });
}

export function useModelosCompatibles(sistemaId: number | undefined, tipo: string | undefined) {
  return useQuery({
    queryKey: ['modelos', 'compatible', sistemaId, tipo],
    queryFn: async () => {
      const { data } = await api.get(`/v1/modelos/compatible?sistemaId=${sistemaId}&tipo=${tipo}`);
      return data as { modelos: any[]; warning: string | null };
    },
    enabled: !!sistemaId && !!tipo && tipo !== 'controller',
  });
}
