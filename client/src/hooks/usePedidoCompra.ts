import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function usePedidoCompra(intervencionId: number | undefined) {
  return useQuery({
    queryKey: ['pedido-compra', intervencionId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/pedidos-compra/intervencion/${intervencionId}`);
      return data;
    },
    enabled: !!intervencionId,
    retry: false, // Don't retry on 404
  });
}

export function useGenerarPedidoCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (intervencionId: number) => {
      const { data } = await api.post(`/v1/pedidos-compra/generar/${intervencionId}`);
      return data;
    },
    onSuccess: (_data, intervencionId) => {
      qc.invalidateQueries({ queryKey: ['pedido-compra', intervencionId] });
    },
  });
}

export function useUpdatePedidoCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; [key: string]: any }) => {
      const { data } = await api.put(`/v1/pedidos-compra/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedido-compra'] });
    },
  });
}

export function useUpdateEstadoPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      const { data } = await api.patch(`/v1/pedidos-compra/${id}/estado`, { estado });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedido-compra'] });
    },
  });
}

export function useDeletePedidoCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/v1/pedidos-compra/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedido-compra'] });
    },
  });
}
