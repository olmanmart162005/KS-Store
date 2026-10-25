import React, { useState, useEffect } from 'react';
import {
  Crown,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';
import { Link } from 'react-router-dom';
import { ProductFormModal, ProductViewModal } from '../../components/admin/ProductFormModal';

const QuickNumberField = ({ initialValue, onSave, step = '1', min = '0', prefix = '' }) => {
  const [val, setVal] = useState(String(initialValue ?? ''));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVal(String(initialValue ?? ''));
  }, [initialValue]);

  const commit = async () => {
    const num = Number(val);
    if (isNaN(num) || num < 0 || num === Number(initialValue)) {
      setVal(String(initialValue ?? ''));
      return;
    }
    setBusy(true);
    try {
      await onSave(num);
    } catch {
      setVal(String(initialValue ?? ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="number"
        step={step}
        min={min}
        value={val}
        disabled={busy}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.target.blur();
          }
        }}
        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-white disabled:opacity-50"
      />
      {busy && (
        <Loader2 className="w-3 h-3 text-white animate-spin absolute right-2 top-1/2 -translate-y-1/2" />
      )}
    </div>
  );
};

export const GorrasAdmin = () => {
  const { products, updateProduct, deleteProduct, duplicateProduct } = useProducts();
  const { showToast } = useCart();
  const [search, setSearch] = useState('');

  // Estados de modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const gorras = products.filter((p) => p.category === 'gorras');

  const filteredGorras = gorras.filter(
    (g) =>
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.sku?.toLowerCase().includes(search.toLowerCase()) ||
      g.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePriceChange = async (id, newPrice) => {
    try {
      await updateProduct(id, { price: newPrice });
      showToast('Producto actualizado correctamente', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudieron guardar los cambios.', 'error');
      throw err;
    }
  };

  const handleStockChange = async (id, newStock) => {
    try {
      const status = newStock === 0 ? 'sold_out' : 'available';
      await updateProduct(id, { stock: newStock, status });
      showToast('Inventario actualizado correctamente', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudieron guardar los cambios.', 'error');
      throw err;
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'sold_out' ? 'available' : 'sold_out';
      const newStock = newStatus === 'sold_out' ? 0 : 5;
      await updateProduct(id, { status: newStatus, stock: newStock });
      showToast(
        `Estado actualizado a ${newStatus === 'sold_out' ? 'Agotado' : 'Disponible'}`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Error al actualizar estado.', 'error');
    }
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    try {
      await updateProduct(id, { featured: !currentFeatured });
      showToast(
        `Gorra ${!currentFeatured ? 'marcada como destacada' : 'removida de destacados'}`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Error al actualizar destacado.', 'error');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const cloned = await duplicateProduct(id);
      if (cloned) showToast(`Gorra duplicada como "${cloned.name}"`, 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo duplicar la gorra.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteProduct || deleting) return;
    setDeleting(true);
    try {
      await deleteProduct(confirmDeleteProduct.id);
      showToast('Gorra eliminada del catálogo', 'info');
      setConfirmDeleteProduct(null);
    } catch (err) {
      showToast(err.message || 'Error al eliminar la gorra.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
            <Crown className="w-3.5 h-3.5" />
            <span>Gestión de Gorras</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Catálogo Oficial de Gorras ({gorras.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Edita nombre, precio, stock, descripción o fotografía de cualquier gorra con guardado permanente
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setFormModalOpen(true);
          }}
          className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Gorra</span>
        </button>
      </div>

      {/* Buscador Fijo (Sticky) */}
      <div className="sticky top-[53px] md:top-0 z-30 bg-zinc-950/95 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-zinc-800/80 mb-4 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar gorra por nombre, marca o código SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid de Gorras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredGorras.map((gorra) => (
          <div
            key={gorra.id}
            className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-colors"
          >
            <div>
              {/* Fotografía con Badges y Acciones Rápidas */}
              <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 mb-3 group">
                <img
                  src={gorra.main_image}
                  alt={gorra.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {gorra.is_new && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-zinc-950 uppercase">
                      Nuevo
                    </span>
                  )}
                  {gorra.featured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950 uppercase">
                      Destacado
                    </span>
                  )}
                </div>

                <Link
                  to={`/producto/${gorra.slug}`}
                  target="_blank"
                  className="absolute bottom-2 right-2 p-2 rounded-lg bg-zinc-950/85 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Ver en tienda"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Título y Marca */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {gorra.brand} • <span className="font-mono text-zinc-400">{gorra.sku}</span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 mt-0.5">
                {gorra.name}
              </h3>
            </div>

            {/* Controles Rápidos de Precio, Stock y Edición Completa */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">
                    Precio (L.)
                  </label>
                  <QuickNumberField
                    initialValue={gorra.price}
                    step="0.01"
                    onSave={(val) => handlePriceChange(gorra.id, val)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">
                    Stock
                  </label>
                  <QuickNumberField
                    initialValue={gorra.stock}
                    step="1"
                    onSave={(val) => handleStockChange(gorra.id, val)}
                  />
                </div>
              </div>

              {/* Botones de Estado */}
              <div className="flex items-center justify-between text-[11px]">
                <button
                  onClick={() => handleToggleFeatured(gorra.id, gorra.featured)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    gorra.featured
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  ★ {gorra.featured ? 'Destacada' : 'Normal'}
                </button>

                <button
                  onClick={() => handleToggleStatus(gorra.id, gorra.status)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    gorra.status === 'sold_out'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {gorra.status === 'sold_out' ? 'Agotada' : 'Disponible'}
                </button>
              </div>

              {/* Barra de acciones completas (Ver, Editar todo, Duplicar, Eliminar) */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => {
                    setEditingProduct(gorra);
                    setFormModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Todo</span>
                </button>

                <button
                  onClick={() => setViewingProduct(gorra)}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDuplicate(gorra.id)}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  title="Duplicar gorra"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setConfirmDeleteProduct(gorra)}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-zinc-400 hover:text-rose-400 transition-colors"
                  title="Eliminar gorra"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar */}
      <ProductFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        editingProduct={editingProduct}
        defaultCategory="gorras"
      />

      {/* Modal Ver Detalles */}
      <ProductViewModal
        product={viewingProduct}
        isOpen={Boolean(viewingProduct)}
        onClose={() => setViewingProduct(null)}
        onEdit={(prod) => {
          setEditingProduct(prod);
          setFormModalOpen(true);
        }}
        onDuplicate={(id) => handleDuplicate(id)}
      />

      {/* Modal Confirmar Eliminación */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">¿Eliminar esta gorra?</h3>
            <p className="text-xs text-zinc-300 font-semibold">{confirmDeleteProduct.name}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteProduct(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase hover:bg-rose-500 disabled:opacity-50"
              >
                {deleting ? 'Borrando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
