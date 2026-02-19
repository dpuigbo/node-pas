import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface DashboardData {
  stats: {
    totalClientes: number;
    totalSistemas: number;
    intervencionesActivas: number;
    informesPendientes: number;
  };
  ultimasIntervenciones: any[];
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/v1/dashboard');
      return data;
    },
    staleTime: 30 * 1000,
  });
}
