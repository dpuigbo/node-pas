import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await api.get('/v1/clientes');
      return data;
    },
  });
}

export function useCliente(id: number | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/clientes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/clientes', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/clientes/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/clientes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useUploadLogo(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('logo', file);
      return api.post(`/v1/clientes/${clienteId}/logo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useDeleteLogo(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/v1/clientes/${clienteId}/logo`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

// Maquinas
export function useMaquinas(clienteId: number | undefined) {
  return useQuery({
    queryKey: ['clientes', clienteId, 'maquinas'],
    queryFn: async () => {
      const { data } = await api.get(`/v1/clientes/${clienteId}/maquinas`);
      return data;
    },
    enabled: !!clienteId,
  });
}

export function useCreateMaquina(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post(`/v1/clientes/${clienteId}/maquinas`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', clienteId] }),
  });
}

export function useUpdateMaquina(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/clientes/${clienteId}/maquinas/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', clienteId] }),
  });
}

export function useDeleteMaquina(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/clientes/${clienteId}/maquinas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', clienteId] }),
  });
}
