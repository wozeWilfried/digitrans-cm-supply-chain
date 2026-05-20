import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Truck, ArrowLeftRight, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/stocks',       icon: Package,         label: 'Stocks'          },
  { to: '/fournisseurs', icon: Users,           label: 'Fournisseurs'    },
  { to: '/commandes',    icon: ShoppingCart,    label: 'Commandes'       },
  { to: '/livraisons',   icon: Truck,           label: 'Livraisons'      },
  { to: '/mouvements',   icon: ArrowLeftRight,  label: 'Mouvements'      },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-16'}
          bg-blue-900 text-white flex flex-col
          transition-all duration-300 ease-in-out
          flex-shrink-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-blue-800">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Truck size={18} className="text-blue-900" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight">DIGITRANS-SCM</p>
              <p className="text-blue-300 text-xs">Supply Chain</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                transition-colors duration-150 text-sm font-medium
                ${isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'}
              `}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
              {sidebarOpen && <ChevronRight size={14} className="ml-auto opacity-40" />}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-blue-800 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-blue-200 hover:text-white
                       text-sm w-full py-2 px-2 rounded-lg hover:bg-blue-800
                       transition-colors duration-150"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4
                           flex items-center justify-between h-16 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">AGROCAM S.A.</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center
                            justify-center text-blue-700 font-bold text-sm">
              DW
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
