import React, { useState, useEffect } from 'react';
import {
  Footprints,
  Search,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';
import { Link } from 'react-router-dom';
import { ProductFormModal, ProductViewModal } from '../../components/admin/ProductFormModal';

const QuickNumberField = ({ initialValue, onSave, step = '1', min = '0' }) => {
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

export const TenisAdmin = () => {
  const { products, updateProduct, deleteProduct, duplicateProduct } = useProducts();
  const { showToast } = useCart();
  const [search, setSearch] = useState('');

  // Estados de modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const tenis = products.filter((p) => p.category === 'tenis');

  const filteredTenis = tenis.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.brand?.toLowerCase().includes(search.toLowerCase()) ||
      t.sku?.toLowerCase().includes(search.toLowerCase())
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

  const handleDuplicate = async (id) => {
    try {
      const cloned = await duplicateProduct(id);
      if (cloned) showToast(`Tenis duplicado como "${cloned.name}"`, 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo duplicar el producto.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteProduct || deleting) return;
    setDeleting(true);
    try {
      await deleteProduct(confirmDeleteProduct.id);
      showToast('Tenis eliminado del catálogo', 'info');
      setConfirmDeleteProduct(null);
    } catch (err) {
      showToast(err.message || 'Error al eliminar el producto.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-400 mb-1">
            <Footprints className="w-3.5 h-3.5" />
            <span>Gestión de Sneakers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Catálogo de Tenis & Sneakers ({tenis.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Administra modelos, marcas (Nike, Jordan, Yeezy, New Balance, etc.), tallas, precios y fotografías
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
          <span>Agregar Tenis</span>
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
              placeholder="Buscar tenis por modelo, marca o código SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid de Sneakers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTenis.map((sneaker) => (
          <div
            key={sneaker.id}
            className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-colors"
          >
            <div>
              {/* Fotografía con Badges */}
              <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 mb-3 group">
                <img
                  src={sneaker.main_image}
                  alt={sneaker.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <Link
                  to={`/producto/${sneaker.slug}`}
                  target="_blank"
                  className="absolute bottom-2 right-2 p-2 rounded-lg bg-zinc-950/85 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Ver en tienda"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Título y Marca */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                {sneaker.brand} • <span className="font-mono text-zinc-400">{sneaker.sku}</span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 mt-0.5">
                {sneaker.name}
              </h3>

              {/* Tallas disponibles */}
              <div className="mt-2 flex flex-wrap gap-1">
                {sneaker.sizes?.map((sz) => (
                  <span
                    key={sz}
                    className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-300"
                  >
                    {sz}
                  </span>
                ))}
              </div>
            </div>

            {/* Controles Rápidos de Precio y Stock */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">
                    Precio (L.)
                  </label>
                  <QuickNumberField
                    initialValue={sneaker.price}
                    step="0.01"
                    onSave={(val) => handlePriceChange(sneaker.id, val)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">
                    Stock
                  </label>
                  <QuickNumberField
                    initialValue={sneaker.stock}
                    step="1"
                    onSave={(val) => handleStockChange(sneaker.id, val)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px]">Valor en stock:</span>
                <span className="font-bold text-white">
                  {formatCurrency(sneaker.price * sneaker.stock)}
                </span>
              </div>

              {/* Acciones completas */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => {
                    setEditingProduct(sneaker);
                    setFormModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Todo</span>
                </button>

                <button
                  onClick={() => setViewingProduct(sneaker)}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDuplicate(sneaker.id)}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  title="Duplicar tenis"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setConfirmDeleteProduct(sneaker)}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-zinc-400 hover:text-rose-400 transition-colors"
                  title="Eliminar tenis"
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
        defaultCategory="tenis"
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
            <h3 className="font-extrabold text-white text-base">¿Eliminar estos tenis?</h3>
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
