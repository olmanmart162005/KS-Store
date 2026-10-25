import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Sparkles,
  ExternalLink,
  Crown,
  Footprints,
  Shirt,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';
import { ProductFormModal, ProductViewModal } from '../../components/admin/ProductFormModal';

const ITEMS_PER_PAGE = 12;

export const ProductsAdmin = () => {
  const {
    products,
    categories,
    deleteProduct,
    duplicateProduct,
    toggleFeatured,
    loading,
  } = useProducts();
  const { showToast } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Abrir modal si viene con query param ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      const cat = searchParams.get('cat') || 'gorras';
      setEditingProduct(null);
      setCategoryFilter(cat === 'all' ? 'all' : cat);
      setFormModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Reiniciar paginación al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormModalOpen(true);
  };

  const handleDuplicate = async (id) => {
    setBusyId(id);
    try {
      const cloned = await duplicateProduct(id);
      if (cloned) {
        showToast(`Producto duplicado: "${cloned.name}"`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'No se pudo duplicar el producto.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFeatured = async (id) => {
    setBusyId(id);
    try {
      await toggleFeatured(id);
      showToast('Producto actualizado correctamente', 'success');
    } catch (err) {
      showToast(err.message || 'Error al cambiar estado destacado.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteProduct || deleting) return;
    setDeleting(true);
    try {
      await deleteProduct(confirmDeleteProduct.id);
      showToast(`"${confirmDeleteProduct.name}" eliminado permanentemente`, 'info');
      setConfirmDeleteProduct(null);
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar el producto.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);

      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'featured' ? p.featured : p.status === statusFilter);

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderStatusBadge = (p) => {
    if (p.status === 'sold_out' || p.stock === 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/80 uppercase">
          Agotado
        </span>
      );
    }
    if (p.status === 'hidden') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
          Oculto
        </span>
      );
    }
    if (p.status === 'low_stock' || p.stock <= 2) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/80 uppercase">
          Bajo Stock
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 uppercase">
        Disponible
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            <Package className="w-3.5 h-3.5 text-rose-500" />
            <span>Gestión de Catálogo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Productos ({products.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Crea, edita, duplica o elimina productos con persistencia directa en Supabase
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros Fija */}
      <div className="sticky top-[53px] md:top-0 z-30 bg-zinc-950/95 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-zinc-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU, marca o descripción..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold focus:outline-none focus:border-zinc-600"
            >
              <option value="all">Todas las Categorías ({products.length})</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({products.filter((p) => p.category === c.slug).length})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold focus:outline-none focus:border-zinc-600"
            >
              <option value="all">Todos los Estados</option>
              <option value="available">Disponibles</option>
              <option value="sold_out">Agotados</option>
              <option value="featured">★ Destacados</option>
              <option value="hidden">Ocultos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estado vacío o cargando */}
      {loading ? (
        <div className="py-16 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">Sincronizando catálogo con la base de datos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800 p-6 space-y-3">
          <Package className="w-10 h-10 text-zinc-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No se encontraron productos</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Intenta con otro término de búsqueda o limpia los filtros activos.
          </p>
        </div>
      ) : (
        <>
          {/* VISTA DE TARJETAS PARA MÓVIL (< 768px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {paginatedProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3 flex flex-col justify-between"
              >
                <div className="flex gap-3.5">
                  <img
                    src={p.main_image}
                    alt={p.name}
                    className="w-20 aspect-3/4 rounded-xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        {p.sku}
                      </span>
                      {renderStatusBadge(p)}
                    </div>
                    <h3 className="font-bold text-white text-sm line-clamp-2">{p.name}</h3>
                    <p className="text-[11px] text-zinc-400">
                      {p.brand} • <span className="capitalize">{p.category_name || p.category}</span>
                    </p>
                    <div className="pt-1 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-white">
                        {formatCurrency(p.price)}
                      </span>
                      <span className="text-xs font-bold text-zinc-300">
                        Stock: {p.stock}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción Móvil (Cómodos para tocar) */}
                <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setViewingProduct(p)}
                    className="py-2 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="py-2 px-2 rounded-xl bg-white text-zinc-950 text-[11px] font-extrabold flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDuplicate(p.id)}
                    disabled={busyId === p.id}
                    className="py-2 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copia</span>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteProduct(p)}
                    className="py-2 px-2 rounded-xl bg-rose-950/60 border border-rose-900/60 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* VISTA DE TABLA PARA ESCRITORIO (>= 768px) */}
          <div className="hidden md:block bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Producto</th>
                    <th className="py-3.5 px-4">Código SKU</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Precio</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Actualización</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.main_image}
                            alt={p.name}
                            className="w-12 h-15 rounded-xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-zinc-400">{p.brand}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {p.featured && (
                                <span className="text-[10px] text-amber-400 font-bold">
                                  ★ Destacado
                                </span>
                              )}
                              {p.is_new && (
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  • Nuevo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-300 font-semibold">
                        {p.sku}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 capitalize font-medium">
                          {p.category === 'gorras' ? (
                            <Crown className="w-3 h-3 text-amber-400" />
                          ) : p.category === 'tenis' ? (
                            <Footprints className="w-3 h-3 text-rose-400" />
                          ) : (
                            <Shirt className="w-3 h-3 text-blue-400" />
                          )}
                          {p.category_name || p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-white text-sm">
                          {formatCurrency(p.price)}
                        </span>
                        {p.compare_price && p.compare_price > p.price && (
                          <span className="block text-[10px] text-zinc-500 line-through">
                            {formatCurrency(p.compare_price)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            p.stock === 0
                              ? 'bg-rose-950/60 text-rose-300'
                              : p.stock <= 3
                              ? 'bg-amber-950/60 text-amber-300'
                              : 'bg-zinc-950 text-zinc-200'
                          }`}
                        >
                          {p.stock} uds
                        </span>
                      </td>

                      <td className="py-3.5 px-4">{renderStatusBadge(p)}</td>

                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        {p.updated_at
                          ? new Date(p.updated_at).toLocaleDateString('es-HN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleFeatured(p.id)}
                            disabled={busyId === p.id}
                            className={`p-2 rounded-xl transition-colors ${
                              p.featured
                                ? 'text-amber-400 bg-amber-950/40 hover:bg-amber-950/70'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                            title={p.featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Ver detalles completos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleDuplicate(p.id)}
                            disabled={busyId === p.id}
                            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
                            title="Duplicar producto"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setConfirmDeleteProduct(p)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-zinc-400">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} –{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} de{' '}
                {filteredProducts.length} productos
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Profesional de Crear / Editar */}
      <ProductFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        editingProduct={editingProduct}
        defaultCategory={categoryFilter === 'all' ? 'gorras' : categoryFilter}
      />

      {/* Modal de Ver Detalles */}
      <ProductViewModal
        product={viewingProduct}
        isOpen={Boolean(viewingProduct)}
        onClose={() => setViewingProduct(null)}
        onEdit={(prod) => handleOpenEdit(prod)}
        onDuplicate={(id) => handleDuplicate(id)}
      />

      {/* Modal de Confirmación de Eliminación */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base">¿Eliminar producto?</h3>
              <p className="text-xs text-zinc-300 font-semibold">{confirmDeleteProduct.name}</p>
              <p className="text-xs text-zinc-400">
                Esta acción eliminará el registro permanentemente de la base de datos.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDeleteProduct(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
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
