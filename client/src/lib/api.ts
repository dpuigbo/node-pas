import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 handling: ProtectedRoute + useAuth already handle redirects.
    // Only force-redirect for 401 on non-auth endpoints (e.g., session expired mid-use).
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/') &&
      window.location.pathname !== '/login'
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
