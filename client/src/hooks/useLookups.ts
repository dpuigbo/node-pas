import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useFamilias(filters?: { fabricanteId?: number; tipo?: string }) {
  return useQuery({
    queryKey: ['lookups', 'familias', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fabricanteId) params.set('fabricanteId', String(filters.fabricanteId));
      if (filters?.tipo) params.set('tipo', filters.tipo);
      const { data } = await api.get(`/v1/lookups/familias?${params}`);
      return data as { id: number; fabricanteId: number; codigo: string; tipo: string; descripcion: string | null }[];
    },
    enabled: !!filters?.fabricanteId,
  });
}

export function useGeneracionesControlador() {
  return useQuery({
    queryKey: ['lookups', 'generaciones-controlador'],
    queryFn: async () => {
      const { data } = await api.get('/v1/lookups/generaciones-controlador');
      return data as { id: number; codigo: string; nombre: string }[];
    },
  });
}

export function useTiposActividad() {
  return useQuery({
    queryKey: ['lookups', 'tipos-actividad'],
    queryFn: async () => {
      const { data } = await api.get('/v1/lookups/tipos-actividad');
      return data as { id: number; codigo: string; nombre: string; categoria: string }[];
    },
  });
}

export function useNivelesMantenimiento() {
  return useQuery({
    queryKey: ['lookups', 'niveles-mantenimiento'],
    queryFn: async () => {
      const { data } = await api.get('/v1/lookups/niveles-mantenimiento');
      return data as { id: number; codigo: string; nombre: string; descripcion: string | null }[];
    },
  });
}

export function useConsumiblesCatalogo(filters?: { tipo?: string; subtipo?: string; q?: string }) {
  return useQuery({
    queryKey: ['lookups', 'consumibles-catalogo', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.tipo) params.set('tipo', filters.tipo);
      if (filters?.subtipo) params.set('subtipo', filters.subtipo);
      if (filters?.q) params.set('q', filters.q);
      const { data } = await api.get(`/v1/lookups/consumibles-catalogo?${params}`);
      return data as {
        id: number;
        tipo: string;
        subtipo: string | null;
        nombre: string;
        codigoAbb: string | null;
        fabricante: string | null;
        unidad: string | null;
        equivalencias: string | null;
        apariciones: number;
        notas: string | null;
      }[];
    },
  });
}

export function useCreateConsumibleCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/v1/lookups/consumibles-catalogo', body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookups', 'consumibles-catalogo'] }),
  });
}

export function useUpdateConsumibleCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/v1/lookups/consumibles-catalogo/${id}`, body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookups', 'consumibles-catalogo'] }),
  });
}

export function useDeleteConsumibleCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/lookups/consumibles-catalogo/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookups', 'consumibles-catalogo'] }),
  });
}

// v2.9: catalogo unificado de actividades preventivas (sustituye a
// equivalencias + puntos de control genericos, eliminados de la BD).
export function useActividadesPreventivas(filters?: { tipoComponente?: string; nivel?: string }) {
  return useQuery({
    queryKey: ['lookups', 'actividades-preventivas', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.tipoComponente) params.set('tipoComponente', filters.tipoComponente);
      if (filters?.nivel) params.set('nivel', filters.nivel);
      const { data } = await api.get(`/v1/lookups/actividades-preventivas?${params}`);
      return data as {
        id: number;
        tipoComponenteAplicable: string;
        componente: string;
        ejes: string[] | null;
        intervaloHoras: number | null;
        intervaloMeses: number | null;
        intervaloCondicion: string;
        obligatoria: boolean;
        observaciones: string | null;
        notas: string | null;
        orden: number;
        tipoActividad: { id: number; codigo: string; nombre: string; categoria: string };
        nivel: { id: number; codigo: string; nombre: string } | null;
        consumibles: { id: number; cantidad: number | null; unidad: string | null; consumible: { id: number; codigoInterno: string | null; nombre: string; tipo: string } }[];
        modelosAplicablesInfo: { id: number; nombre: string }[];
      }[];
    },
  });
}

// Montajes y protecciones (cohortes v2.9)
export function useMontajes() {
  return useQuery({
    queryKey: ['lookups', 'montajes'],
    queryFn: async () => {
      const { data } = await api.get('/v1/lookups/montajes');
      return data as { id: number; codigo: string; descripcion: string | null }[];
    },
  });
}

export function useProtecciones() {
  return useQuery({
    queryKey: ['lookups', 'protecciones'],
    queryFn: async () => {
      const { data } = await api.get('/v1/lookups/protecciones');
      return data as { id: number; codigo: string; nombre: string; afectaLubricacion: boolean | null }[];
    },
  });
}
