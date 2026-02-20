import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  rol: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, isFetched } = useQuery<AuthUser>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    // No refetch on window focus for auth — prevents loops
    refetchOnWindowFocus: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return {
    user,
    isLoading,
    // Only authenticated if we have user data and no error
    // isFetched ensures we don't flash "not authenticated" before the query runs
    isAuthenticated: isFetched && !!user && !error,
    isAdmin: user?.rol === 'admin',
    logout: logoutMutation.mutate,
  };
}
