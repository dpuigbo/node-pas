import { Navigate } from 'react-router-dom';
import { Bot, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mientras verifica el estado de auth, mostrar spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Si ya esta autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Bot className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">PAS Robotics</h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestion de Mantenimiento
            </p>
          </div>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <a
            href="/api/auth/microsoft"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Iniciar sesion con Microsoft
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Solo usuarios autorizados pueden acceder al sistema
        </p>
      </div>
    </div>
  );
}
