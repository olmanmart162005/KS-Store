import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Crown, 
  Footprints, 
  Settings, 
  LogOut, 
  Store, 
  Menu, 
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../ui/Toast';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Productos', path: '/admin/productos', icon: Package },
    { label: 'Gorras', path: '/admin/gorras', icon: Crown },
    { label: 'Tenis', path: '/admin/tenis', icon: Footprints },
    { label: 'Configuración', path: '/admin/configuracion', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-zinc-950 border-r border-zinc-800 flex-col justify-between shrink-0 h-screen sticky top-0 p-5">
        <div className="space-y-6">
          
          {/* Logo KS Store Admin */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shadow-md">
              <img src="/images/logo/logo.png" alt="KS Store" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block font-heading">
                KS STORE
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Panel de Control
              </span>
            </div>
          </div>

          <hr className="border-zinc-800/80" />

          {/* Menú de Navegación (Sección 43) */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span>Ver Tienda</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Header Móvil para Admin */}
      <header className="md:hidden bg-zinc-950 border-b border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1">
            <img src="/images/logo/logo.png" alt="KS" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-sm text-white">KS STORE ADMIN</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Menú Móvil Desplegable */}
      {sidebarOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  isActive ? 'bg-white text-zinc-950' : 'text-zinc-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs">
            <Link to="/" target="_blank" className="text-zinc-400">Ver Tienda</Link>
            <button onClick={handleLogout} className="text-rose-400 font-bold">Cerrar Sesión</button>
          </div>
        </div>
      )}

      {/* Área de Contenido Principal */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">
        <Outlet />
      </main>

      <Toast />
    </div>
  );
};
