import { LogOut, Menu, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, isLoading, logout } = useAuth();
  const initials = (user?.nombre ?? '')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="-ml-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          title="Menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold sm:text-lg">PAS Robotics Manage</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          title="Notificaciones"
        >
          <Bell className="h-4 w-4" />
        </button>
        {!isLoading && user && (
          <>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1 sm:pr-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials || 'U'}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-medium">{user.nombre}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{user.rol}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
