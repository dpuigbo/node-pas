import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Aceites
export function useAceites() {
  return useQuery({
    queryKey: ['catalogos', 'aceites'],
    queryFn: async () => {
      const { data } = await api.get('/v1/catalogos/aceites');
      return data;
    },
  });
}

export function useCreateAceite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/catalogos/aceites', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos', 'aceites'] }),
  });
}

export function useUpdateAceite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/catalogos/aceites/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos', 'aceites'] }),
  });
}

export function useDeleteAceite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/catalogos/aceites/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos', 'aceites'] }),
  });
}

// Consumibles
export function useConsumibles() {
  return useQuery({
    queryKey: ['catalogos', 'consumibles'],
    queryFn: async () => {
      const { data } = await api.get('/v1/catalogos/consumibles');
      return data;
    },
  });
}

export function useCreateConsumible() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/catalogos/consumibles', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos', 'consumibles'] }),
  });
}

export function useUpdateConsumible() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/catalogos/consumibles/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos', 'consumibles'] }),
  });
}

export function useDeleteConsumible() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/catalogos/consumibles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos', 'consumibles'] }),
  });
}

// Configuracion
export function useConfiguracion() {
  return useQuery({
    queryKey: ['catalogos', 'configuracion'],
    queryFn: async () => {
      const { data } = await api.get('/v1/catalogos/configuracion');
      return data;
    },
  });
}

export function useUpdateConfiguracion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { clave: string; valor: string }[]) => api.put('/v1/catalogos/configuracion', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos', 'configuracion'] }),
  });
}
