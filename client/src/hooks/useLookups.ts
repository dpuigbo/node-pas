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
