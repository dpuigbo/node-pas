import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Factory,
  Cpu,
  Wrench,
  FileText,
  Droplets,
  Settings,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Fabricantes', href: '/fabricantes', icon: Factory },
  { name: 'Modelos', href: '/modelos', icon: Cpu },
  { name: 'Intervenciones', href: '/intervenciones', icon: Wrench },
  { name: 'Informes', href: '/informes', icon: FileText },
  { name: 'Catalogos', href: '/catalogos', icon: Droplets },
  { name: 'Configuracion', href: '/configuracion', icon: Settings },
];

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
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
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
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-6 py-3">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </div>
    </aside>
  );
}
