import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Factory,
  Cpu,
  Wrench,
  Droplets,
  Settings,
  Bot,
  Zap,
  Move3d,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchTipo?: string; // for matching tipo query param on /modelos
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Fabricantes', href: '/fabricantes', icon: Factory },
      { name: 'Intervenciones', href: '/intervenciones', icon: Wrench },
    ],
  },
  {
    label: 'Catalogo de Modelos',
    items: [
      { name: 'Controladoras', href: '/modelos?tipo=controller', icon: Cpu, matchTipo: 'controller' },
      { name: 'Robots', href: '/modelos?tipo=mechanical_unit', icon: Bot, matchTipo: 'mechanical_unit' },
      { name: 'Drive Units', href: '/modelos?tipo=drive_unit', icon: Zap, matchTipo: 'drive_unit' },
      { name: 'Ejes Externos', href: '/modelos?tipo=external_axis', icon: Move3d, matchTipo: 'external_axis' },
    ],
  },
  {
    items: [
      { name: 'Catalogos', href: '/catalogos', icon: Droplets },
      { name: 'Configuracion', href: '/configuracion', icon: Settings },
    ],
  },
];

function SidebarLink({ item }: { item: NavItem }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // For catalog items with matchTipo, determine active state manually
  if (item.matchTipo) {
    const currentTipo = searchParams.get('tipo');
    const isOnModelos = location.pathname === '/modelos' || location.pathname.startsWith('/modelos/');
    const isActive = isOnModelos && currentTipo === item.matchTipo;

    return (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-primary'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.name}
      </NavLink>
    );
  }

  // Standard NavLink for non-catalog items
  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-primary'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )
      }
    >
      <item.icon className="h-4 w-4" />
      {item.name}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">PAS Robotics</h1>
          <p className="text-xs text-muted-foreground">Manage</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <SidebarLink key={item.href} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-6 py-3">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </div>
    </aside>
  );
}
