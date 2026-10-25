import React, { useState } from 'react';
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
  Boxes,
  Tags,
  Edit2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';
import { ProductFormModal } from '../../components/admin/ProductFormModal';

export const Dashboard = () => {
  const { products, orders = [], toggleFeatured, refreshCatalog, loading } = useProducts();
  const { showToast } = useCart();

  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => !o.status || o.status === 'pending').length;
  const totalGorras = products.filter((p) => p.category === 'gorras').length;
  const totalTenis = products.filter((p) => p.category === 'tenis').length;
  const totalAvailable = products.filter((p) => p.status !== 'sold_out' && p.stock > 0).length;
  const totalSoldOut = products.filter((p) => p.status === 'sold_out' || p.stock === 0).length;
  const totalFeatured = products.filter((p) => p.featured).length;
  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalValuation = products.reduce(
    (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
    0
  );

  // Ordenar por fecha de actualización más reciente
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 8);

  const stats = [
    { label: 'Total Productos', count: totalProducts, icon: Package, color: 'text-white', bg: 'bg-zinc-900/80 border-zinc-800' },
    { label: 'Gorras en Catálogo', count: totalGorras, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-800/60' },
    { label: 'Tenis & Sneakers', count: totalTenis, icon: Footprints, color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-800/60' },
    { label: 'Disponibles', count: totalAvailable, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-800/60' },
    { label: 'Agotados', count: totalSoldOut, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-950/30 border-orange-800/60' },
    { label: 'Destacados', count: totalFeatured, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-950/30 border-purple-800/60' },
  ];

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCatalog();
      showToast('Catálogo sincronizado con Supabase', 'success');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await toggleFeatured(id);
      showToast('Estado destacado actualizado en la base de datos', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el producto.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Dashboard Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Métricas en tiempo real calculadas desde la base de datos de KS Store ({totalStockUnits} unidades • Valor: {formatCurrency(totalValuation)})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Sincronizar con base de datos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          <Link
            to="/admin/productos?new=true"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* Grid de Métricas Reales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-2xl border flex flex-col justify-between ${stat.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider line-clamp-1">
                  {stat.label}
                </span>
                <Icon className={`w-4 h-4 ${stat.color} shrink-0`} />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                {stat.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Banner de Módulos de Gestión */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/pedidos"
          className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Pedidos y Reportes</h3>
              <p className="text-[11px] text-zinc-400">
                {totalOrders} pedidos ({pendingOrders} pendientes)
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/gorras"
          className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Gestión de Gorras</h3>
              <p className="text-[11px] text-zinc-400">{totalGorras} modelos registrados</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/tenis"
          className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center shrink-0">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Gestión de Tenis</h3>
              <p className="text-[11px] text-zinc-400">{totalTenis} pares registrados</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/inventario"
          className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Control de Inventario</h3>
              <p className="text-[11px] text-zinc-400">{totalStockUnits} uds en existencia</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Tabla de Productos Actualizados Recientemente */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white font-heading">
              Productos Recientes / Actualizados
            </h2>
            <p className="text-xs text-zinc-400">
              Haz clic en Editar para modificar cualquier campo o fotografía directamente
            </p>
          </div>
          <Link
            to="/admin/productos"
            className="text-xs font-bold text-zinc-300 hover:text-white uppercase tracking-wider flex items-center gap-1"
          >
            <span>Ver todos ({products.length})</span>
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
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {recentProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.main_image}
                        alt={p.name}
                        className="w-10 h-12 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white text-xs line-clamp-1">{p.name}</div>
                        <div className="text-[11px] text-zinc-500">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-300 capitalize">{p.category}</td>
                  <td className="py-3 px-4 font-mono text-zinc-400">{p.sku}</td>
                  <td className="py-3 px-4 font-bold text-white">{formatCurrency(p.price)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'sold_out' || p.stock === 0
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {p.stock} uds
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleFeatured(p.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        p.featured
                          ? 'text-amber-400 bg-amber-950/50'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                      title="Alternar destacado"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-[11px] uppercase tracking-wider inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        editingProduct={editingProduct}
      />
    </div>
  );
};
