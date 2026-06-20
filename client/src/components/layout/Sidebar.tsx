import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, Users, Factory, Cpu, Wrench, Droplets, Settings, Bot, Zap, Move3d,
  FileText, ClipboardList, PanelLeftClose, PanelLeft, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppLogo } from '@/hooks/useCatalogos';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchTipo?: string;
}
interface NavGroup { label?: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  { items: [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }] },
  {
    label: 'Catálogos Generales',
    items: [
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Fabricantes', href: '/fabricantes', icon: Factory },
      { name: 'Consumibles', href: '/catalogos', icon: Droplets },
      { name: 'Consumibles/Nivel', href: '/consumibles-nivel', icon: ClipboardList },
      { name: 'Intervenciones', href: '/intervenciones', icon: Wrench },
    ],
  },
  { label: 'Ofertas', items: [{ name: 'Ofertas', href: '/ofertas', icon: FileText }] },
  {
    label: 'Catálogo de Componentes',
    items: [
      { name: 'Controladoras', href: '/modelos?tipo=controller', icon: Cpu, matchTipo: 'controller' },
      { name: 'Robots', href: '/modelos?tipo=mechanical_unit', icon: Bot, matchTipo: 'mechanical_unit' },
      { name: 'Drive Units', href: '/modelos?tipo=drive_unit', icon: Zap, matchTipo: 'drive_unit' },
      { name: 'Ejes Externos', href: '/modelos?tipo=external_axis', icon: Move3d, matchTipo: 'external_axis' },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { name: 'General', href: '/configuracion', icon: Settings },
      { name: 'Plantillas', href: '/configuracion/plantillas', icon: FileText },
    ],
  },
];

function SidebarLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate: () => void }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  let isActive: boolean;
  if (item.matchTipo) {
    const onModelos = location.pathname === '/modelos' || location.pathname.startsWith('/modelos/');
    isActive = onModelos && searchParams.get('tipo') === item.matchTipo;
  } else {
    isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href.split('?')[0] ?? item.href);
  }

  return (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      title={collapsed ? item.name : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl text-sm font-medium transition-colors',
        collapsed ? 'h-10 w-10 justify-center' : 'px-3 py-2.5',
        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.name}</span>}
    </NavLink>
  );
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const appLogo = useAppLogo();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-[transform,width] duration-200',
        'lg:static lg:m-3 lg:translate-x-0 lg:rounded-2xl lg:border lg:border-sidebar-border',
        collapsed ? 'lg:w-[68px] lg:items-center' : 'lg:w-64',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo + cerrar (móvil) */}
      <div className={cn('flex items-center gap-3 px-3 py-3', collapsed && 'lg:justify-center lg:px-0')}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary">
          {appLogo ? <img src={appLogo} alt="Logo" className="h-7 w-7 object-contain" /> : <Bot className="h-5 w-5 text-primary-foreground" />}
        </div>
        {(!collapsed || mobileOpen) && (
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="truncate text-sm font-bold leading-tight">PAS Robotics</p>
            <p className="text-xs text-muted-foreground">Manage</p>
          </div>
        )}
        <button onClick={onCloseMobile} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent lg:hidden" title="Cerrar"><X className="h-4 w-4" /></button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-2">
        {navGroups.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.label && !collapsed && <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</p>}
            {group.label && collapsed && gi > 0 && <div className="mx-auto my-2 h-px w-6 bg-sidebar-border lg:block" />}
            {group.items.map((item) => <SidebarLink key={item.href} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />)}
          </div>
        ))}
      </nav>

      {/* Pie: colapsar (solo desktop) */}
      <div className="hidden border-t border-sidebar-border px-3 py-2 lg:block">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir' : 'Contraer'}
          className={cn('flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', collapsed ? 'h-10 w-10 justify-center' : 'px-3 py-2.5')}
        >
          {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <><PanelLeftClose className="h-[18px] w-[18px]" /><span>Contraer</span></>}
        </button>
      </div>
    </aside>
  );
}
