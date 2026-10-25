import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Loader2,
  Edit2,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';
import { ProductFormModal } from '../../components/admin/ProductFormModal';

export const InventoryAdmin = () => {
  const { products, updateProduct } = useProducts();
  const { showToast } = useCart();

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out', 'in'
  const [busyId, setBusyId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const totalUnits = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0),
    [products]
  );
  const totalValuation = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= 3).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock === 0 || p.status === 'sold_out').length,
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (stockFilter === 'low') return p.stock > 0 && p.stock <= 3;
      if (stockFilter === 'out') return p.stock === 0 || p.status === 'sold_out';
      if (stockFilter === 'in') return p.stock > 3 && p.status !== 'sold_out';
      return true;
    });
  }, [products, search, stockFilter]);

  const handleAdjustStock = async (product, delta) => {
    const nextStock = Math.max(0, (Number(product.stock) || 0) + delta);
    const nextStatus =
      nextStock === 0
        ? 'sold_out'
        : product.status === 'sold_out'
        ? 'available'
        : product.status;

    setBusyId(product.id);
    try {
      await updateProduct(product.id, { stock: nextStock, status: nextStatus });
      showToast(`Stock de "${product.name}" actualizado a ${nextStock} uds`, 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el inventario.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
          <Boxes className="w-3.5 h-3.5" />
          <span>Control de Existencias</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          Inventario & Valorización Real
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Monitorea unidades disponibles, alertas de bajo stock y valor total del inventario en tiempo real
        </p>
      </div>

      {/* Tarjetas de Resumen Real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Unidades Totales
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading mt-1 block">
            {totalUnits} uds
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Valor del Inventario
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-heading mt-1 block">
            {formatCurrency(totalValuation)}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-800/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
            Bajo Stock (≤ 3 uds)
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-heading mt-1 block">
            {lowStockCount}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/30 border border-rose-800/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 block">
            Agotados (0 uds)
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-heading mt-1 block">
            {outOfStockCount}
          </span>
        </div>
      </div>

      {/* Filtros de Inventario */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por producto, SKU o marca..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Todos (${products.length})` },
            { id: 'in', label: 'Stock Óptimo' },
            { id: 'low', label: `Bajo Stock (${lowStockCount})` },
            { id: 'out', label: `Agotados (${outOfStockCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStockFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                stockFilter === tab.id
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista adaptable de inventario */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Precio Unit.</th>
                <th className="py-3.5 px-4">Valor Stock</th>
                <th className="py-3.5 px-4 text-center">Existencias</th>
                <th className="py-3.5 px-4 text-right">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.main_image}
                        alt={p.name}
                        className="w-10 h-12 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white line-clamp-1">{p.name}</p>
                        <p className="text-[11px] text-zinc-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-400">{p.sku}</td>
                  <td className="py-3 px-4 font-bold text-white">{formatCurrency(p.price)}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {formatCurrency(p.price * p.stock)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                        p.stock === 0
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : p.stock <= 3
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {p.stock === 0 ? (
                        <XCircle className="w-3 h-3" />
                      ) : p.stock <= 3 ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {p.stock} uds
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustStock(p, -1)}
                        disabled={busyId === p.id || p.stock <= 0}
                        className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 disabled:opacity-40"
                        title="Restar 1 unidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAdjustStock(p, 1)}
                        disabled={busyId === p.id}
                        className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 disabled:opacity-40"
                        title="Sumar 1 unidad"
                      >
                        {busyId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-bold"
                        title="Editar producto completo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
