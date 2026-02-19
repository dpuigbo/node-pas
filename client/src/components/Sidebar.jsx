import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Bot,
  Factory,
  Settings,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/intervenciones', label: 'Intervenciones', icon: Wrench },
  { to: '/sistemas', label: 'Sistemas', icon: Bot },
  { to: '/fabricantes', label: 'Fabricantes', icon: Factory },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gray-900 text-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
          PAS
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight">PAS Robotics</h1>
          <p className="text-xs text-gray-400">Manage</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <NavLink
          to="/ajustes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          <Settings size={18} />
          Ajustes
        </NavLink>
      </div>
    </aside>
  );
}
