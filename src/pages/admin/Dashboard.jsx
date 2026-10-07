import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Crown, 
  Footprints, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Store
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { formatCurrency } from '../../services/whatsappService';

export const Dashboard = () => {
  const { products, toggleFeatured } = useProducts();

  const totalProducts = products.length;
  const totalGorras = products.filter((p) => p.category === 'gorras').length;
  const totalTenis = products.filter((p) => p.category === 'tenis').length;
  const totalAvailable = products.filter((p) => p.status === 'available').length;
  const totalSoldOut = products.filter((p) => p.status === 'sold_out').length;
  const totalFeatured = products.filter((p) => p.featured).length;

  const recentProducts = products.slice(0, 8);

  const stats = [
    { label: 'Total Productos', count: totalProducts, icon: Package, color: 'text-white', bg: 'bg-zinc-800' },
    { label: 'Gorras en Stock', count: totalGorras, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/60' },
    { label: 'Tenis & Sneakers', count: totalTenis, icon: Footprints, color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-800/60' },
    { label: 'Disponibles', count: totalAvailable, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/60' },
    { label: 'Agotados', count: totalSoldOut, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-950/40 border-orange-800/60' },
    { label: 'Destacados', count: totalFeatured, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-800/60' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Resumen General
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Métricas de inventario y estado del catálogo de KS Store
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/productos?new=true"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* Grid de Métricas (Sección 13) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between ${stat.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider line-clamp-1">
                  {stat.label}
                </span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                {stat.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Banner de Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/gorras"
          className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Gestión Rápida de Gorras</h3>
              <p className="text-xs text-zinc-400">Administra las 43 fotografías reales, precios y stock</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/tenis"
          className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Gestión de Tenis & Sneakers</h3>
              <p className="text-xs text-zinc-400">Controla marcas ilimitadas, modelos y tallas</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Tabla de Productos Recientes */}
      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white font-heading">
            Inventario Activo Reciente
          </h2>
          <Link
            to="/admin/productos"
            className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
          >
            <span>Ver todos los {products.length}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Precio</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-center">Destacado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {recentProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={p.main_image}
                      alt={p.name}
                      className="w-10 h-12 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-white text-xs">{p.name}</div>
                      <div className="text-[11px] text-zinc-500">{p.brand}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-300 capitalize">
                    {p.category}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-400">
                    {p.sku}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'sold_out' 
                        ? 'bg-rose-950 text-rose-300' 
                        : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {p.stock} unids
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleFeatured(p.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        p.featured ? 'text-amber-400 bg-amber-950/50' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                      title="Alternar destacado"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
