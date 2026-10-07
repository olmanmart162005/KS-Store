import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  ShieldCheck, 
  Flame, 
  Crown, 
  Footprints,
  PhoneCall
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { totalItems, setIsDrawerOpen } = useCart();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // Escuchar scroll para fondo dinámico
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchModalOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Gorras', path: '/gorras', highlight: true, icon: Crown },
    { label: 'Tenis', path: '/tenis', icon: Footprints },
    { label: 'Catálogo', path: '/catalogo' },
    { label: 'Nosotros', path: '/nosotros' },
    { label: 'Contacto', path: '/contacto' },
  ];

  return (
    <>
      {/* Top Banner de Anuncio Urbano */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800/80 py-1.5 px-4 text-center text-[11px] font-semibold tracking-widest uppercase text-zinc-400">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>Colección Exclusiva 2026 • Envíos a toda Honduras • Pedidos directos vía WhatsApp</span>
        </div>
      </div>

      {/* Header Principal */}
      <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shadow-xl shadow-black/40' 
          : 'bg-zinc-950/60 backdrop-blur-sm border-b border-zinc-900'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo KS Store */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md shadow-zinc-900 group-hover:scale-105 transition-transform">
              <img
                src="/images/logo/logo.png"
                alt="KS Store - Tienda de Gorras y Sneakers en Honduras"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tighter text-white font-heading leading-tight group-hover:text-zinc-200 transition-colors">
                KS STORE
              </span>
              <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-bold">
                Streetwear & Caps
              </span>
            </div>
          </Link>

          {/* Menú de Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Acciones del Header (Búsqueda, Carrito, Admin) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Buscador Botón */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Buscar productos"
              title="Buscar productos"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Carrito con Contador */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-800 transition-all duration-200 hover:scale-105 group"
              aria-label="Ver carrito"
              title="Carrito de compras"
            >
              <ShoppingBag className="w-5 h-5 group-hover:text-rose-400 transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg shadow-rose-900/50 animate-scale">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Acceso Admin */}
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className="hidden sm:inline-flex p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Panel administrativo"
              title={isAdmin ? "Panel Admin" : "Acceso Administrativo"}
            >
              <ShieldCheck className={`w-5 h-5 ${isAdmin ? 'text-emerald-400' : ''}`} />
            </Link>

            {/* Botón Menú Hamburguesa Móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    isActive
                      ? 'bg-white text-zinc-950 font-bold'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-2 border-t border-zinc-800/80 flex items-center justify-between px-2">
              <Link
                to="/carrito"
                className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
              >
                <ShoppingBag className="w-4 h-4 text-rose-500" />
                <span>Ver Carrito ({totalItems})</span>
              </Link>
              <Link
                to={isAdmin ? '/admin' : '/admin/login'}
                className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Modal de Búsqueda Rápida */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-2xl p-5 shadow-2xl relative">
            <button
              onClick={() => setSearchModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-3">Buscar en KS Store</h3>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: Rico o Muerto, New Era, Air Max, Jordan..."
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white transition-colors"
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-zinc-400">
                <span>Presiona Enter para buscar</span>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 font-bold uppercase tracking-wider text-[11px]"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
