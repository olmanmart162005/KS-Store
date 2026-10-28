import React, { useState, useEffect, useMemo } from 'react';
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
  X,
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
  const [brandFilter, setBrandFilter] = useState('all');

  // Estados de modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const tenis = useMemo(
    () => products.filter((p) => p.category === 'tenis'),
    [products]
  );

  const brands = useMemo(() => {
    const unique = new Set(tenis.map((t) => t.brand?.trim()).filter(Boolean));
    return Array.from(unique);
  }, [tenis]);

  const filteredTenis = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tenis.filter((t) => {
      const matchSearch =
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.brand?.toLowerCase().includes(q) ||
        t.model?.toLowerCase().includes(q) ||
        t.sku?.toLowerCase().includes(q);
      const matchBrand =
        brandFilter === 'all' || t.brand?.toLowerCase() === brandFilter.toLowerCase();
      return matchSearch && matchBrand;
    });
  }, [tenis, search, brandFilter]);

  const handlePriceChange = async (id, newPrice) => {
    try {
      await updateProduct(id, { price: newPrice });
      showToast('Precio de tenis actualizado correctamente', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudieron guardar los cambios.', 'error');
      throw err;
    }
  };

  const handleStockChange = async (id, newStock) => {
    try {
      const status = newStock === 0 ? 'sold_out' : 'available';
      await updateProduct(id, { stock: newStock, status });
      showToast('Inventario de tenis actualizado correctamente', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudieron guardar los cambios.', 'error');
      throw err;
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (busyId === id) return;
    setBusyId(id);
    try {
      const newStatus = currentStatus === 'sold_out' ? 'available' : 'sold_out';
      const newStock = newStatus === 'sold_out' ? 0 : 5;
      await updateProduct(id, { status: newStatus, stock: newStock });
      showToast(
        `Tenis marcado como ${newStatus === 'sold_out' ? 'Agotado' : 'Disponible'}`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Error al actualizar estado.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    if (busyId === id) return;
    setBusyId(id);
    try {
      await updateProduct(id, { featured: !currentFeatured });
      showToast(
        `Tenis ${!currentFeatured ? 'destacado en portada' : 'removido de destacados'}`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Error al actualizar destacado.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (id) => {
    if (busyId === id) return;
    setBusyId(id);
    try {
      const cloned = await duplicateProduct(id);
      if (cloned) showToast(`Tenis duplicado como "${cloned.name}"`, 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo duplicar el producto.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteProduct || deleting) return;
    const targetToDelete = confirmDeleteProduct;
    setDeleting(true);
    try {
      await deleteProduct(targetToDelete.id);
      setConfirmDeleteProduct(null);
      showToast(`"${targetToDelete.name}" eliminado permanentemente`, 'info');
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
            Administra modelos, marcas (Nike, Jordan, Yeezy, New Balance, etc.), tallas, precios y fotografías sin demoras
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setFormModalOpen(true);
          }}
          className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Tenis</span>
        </button>
      </div>

      {/* Buscador y Filtro por Marca Fijo (Sticky) */}
      <div className="sticky top-[53px] md:top-0 z-30 bg-zinc-950/95 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-zinc-800/80 mb-4 shadow-xl space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tenis por nombre, modelo, marca o código SKU..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-600 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {brands.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setBrandFilter('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
                brandFilter === 'all'
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Todas ({tenis.length})
            </button>
            {brands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBrandFilter(b)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
                  brandFilter.toLowerCase() === b.toLowerCase()
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid de Sneakers o Estado Vacío */}
      {filteredTenis.length === 0 ? (
        <div className="p-12 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center space-y-3">
          <Footprints className="w-10 h-10 text-zinc-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">
            {tenis.length === 0
              ? 'No hay tenis registrados todavía'
              : 'No se encontraron tenis con ese filtro'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {tenis.length === 0
              ? 'Agrega tu primer modelo de tenis o sneakers al catálogo oficial.'
              : 'Prueba con otro término de búsqueda o selecciona "Todas" las marcas.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {(search || brandFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setBrandFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase"
              >
                Limpiar Filtros
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setFormModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-extrabold uppercase flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Tenis</span>
            </button>
          </div>
        </div>
      ) : (
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
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {sneaker.is_new && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-zinc-950 uppercase shadow">
                        Nuevo
                      </span>
                    )}
                    {sneaker.featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950 uppercase shadow">
                        Destacado
                      </span>
                    )}
                    {sneaker.is_sale && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white uppercase shadow">
                        Oferta
                      </span>
                    )}
                  </div>

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
                {sneaker.model && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{sneaker.model}</p>
                )}

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

              {/* Controles Rápidos de Precio, Stock y Estado */}
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

                {/* Botones rápidos de Destacado y Disponibilidad */}
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    disabled={busyId === sneaker.id}
                    onClick={() => handleToggleFeatured(sneaker.id, sneaker.featured)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                      sneaker.featured
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    ★ {sneaker.featured ? 'Destacado' : 'Normal'}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === sneaker.id}
                    onClick={() => handleToggleStatus(sneaker.id, sneaker.status)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                      sneaker.status === 'sold_out' || sneaker.stock === 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {sneaker.status === 'sold_out' || sneaker.stock === 0 ? 'Agotado' : 'Disponible'}
                  </button>
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
                    type="button"
                    onClick={() => {
                      setEditingProduct(sneaker);
                      setFormModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Todo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingProduct(sneaker)}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Ver detalles"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={busyId === sneaker.id}
                    onClick={() => handleDuplicate(sneaker.id)}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    title="Duplicar tenis"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteProduct(sneaker)}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eliminar tenis"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base">¿Eliminar estos tenis?</h3>
              <p className="text-xs text-zinc-300 font-semibold">{confirmDeleteProduct.name}</p>
              <p className="text-[11px] text-zinc-400">
                Se eliminará de forma permanente del catálogo y de la base de datos.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold uppercase hover:bg-rose-500 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Borrando...</span>
                  </>
                ) : (
                  <span>Eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
