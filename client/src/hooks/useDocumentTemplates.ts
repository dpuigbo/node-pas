import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useDocumentTemplates() {
  return useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const { data } = await api.get('/v1/document-templates');
      return data as { id: number; tipo: string; nombre: string; schema: unknown; updatedAt: string }[];
    },
  });
}

export function useDocumentTemplate(id: number | undefined) {
  return useQuery({
    queryKey: ['document-templates', id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/document-templates/${id}`);
      return data as { id: number; tipo: string; nombre: string; schema: unknown; updatedAt: string };
    },
    enabled: !!id,
  });
}

export function useUpdateDocumentTemplate(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { schema?: unknown; nombre?: string }) => {
      const { data } = await api.put(`/v1/document-templates/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document-templates'] });
      qc.invalidateQueries({ queryKey: ['document-templates', id] });
    },
  });
}
