import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { InformeDetalle } from '@/types/informe';

/** Create informes for all sistemas in an intervencion (atomic) */
export function useCrearInformes(intervencionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(`/v1/intervenciones/${intervencionId}/informes`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intervenciones', intervencionId] });
    },
  });
}

/** Fetch a single informe with all componentes, schemas and datos */
export function useInforme(id: number | undefined) {
  return useQuery<InformeDetalle>({
    queryKey: ['informes', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/informes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/** Save partial datos for a single ComponenteInforme */
export function useSaveDatos(componenteInformeId: number, informeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: Record<string, unknown>) =>
      api.patch(`/v1/componentes-informe/${componenteInformeId}/datos`, { datos }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['informes', informeId] });
    },
  });
}

/** Change informe estado (admin only) */
export function useUpdateEstadoInforme(informeId: number, intervencionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (estado: string) =>
      api.patch(`/v1/informes/${informeId}/estado`, { estado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['informes', informeId] });
      qc.invalidateQueries({ queryKey: ['intervenciones', intervencionId] });
    },
  });
}
