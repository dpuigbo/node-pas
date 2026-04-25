import { useQuery } from '@tanstack/react-query';
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

export function useEquivalencias(filters?: { familiaId?: number; tipo?: string }) {
  return useQuery({
    queryKey: ['lookups', 'equivalencias', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.familiaId) params.set('familiaId', String(filters.familiaId));
      if (filters?.tipo) params.set('tipo', filters.tipo);
      const { data } = await api.get(`/v1/lookups/equivalencias?${params}`);
      return data as {
        id: number;
        familiaId: number;
        tipoEquivalencia: string;
        descripcion: string;
        fuenteDoc: string | null;
        notas: string | null;
        familia: { id: number; codigo: string; tipo: string };
      }[];
    },
  });
}

export function usePuntosControl(categoria?: string) {
  return useQuery({
    queryKey: ['lookups', 'puntos-control', categoria],
    queryFn: async () => {
      const params = categoria ? `?categoria=${categoria}` : '';
      const { data } = await api.get(`/v1/lookups/puntos-control${params}`);
      return data as {
        id: number;
        categoria: string;
        componente: string;
        descripcionAccion: string;
        intervaloTexto: string | null;
        condicion: string | null;
        generacionAplica: string | null;
        notas: string | null;
        orden: number;
      }[];
    },
  });
}
