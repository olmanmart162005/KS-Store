import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  Upload, 
  X, 
  Check, 
  AlertCircle,
  Sparkles,
  ExternalLink,
  Crown,
  Footprints
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';

export const ProductsAdmin = () => {
  const { products, addProduct, updateProduct, deleteProduct, duplicateProduct, uploadImage } = useProducts();
  const { showToast } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal de Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    brand: '',
    category: 'gorras',
    sku: '',
    price: '',
    compare_price: '',
    stock: 5,
    status: 'available',
    featured: false,
    is_new: true,
    is_sale: false,
    description: '',
    main_image: '',
    sizes: 'Ajustable / Unitalla',
    colors: 'Negro',
  };

  const [formData, setFormData] = useState(initialForm);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [formError, setFormError] = useState('');

  // Abrir modal si viene con query param ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData(initialForm);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category,
      sku: product.sku,
      price: product.price,
      compare_price: product.compare_price || '',
      stock: product.stock,
      status: product.status,
      featured: product.featured,
      is_new: product.is_new,
      is_sale: product.is_sale,
      description: product.description,
      main_image: product.main_image,
      sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : 'Unitalla',
      colors: Array.isArray(product.colors) ? product.colors.join(', ') : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setFormData((prev) => ({ ...prev, main_image: url }));
        showToast('Imagen cargada con éxito');
      }
    } catch {
      setFormError('Error al subir la imagen');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.price || !formData.main_image) {
      setFormError('Por favor completa los campos requeridos (Nombre, Precio e Imagen).');
      return;
    }

    const parsedSizes = formData.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedColors = formData.colors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      price: Number(formData.price),
      compare_price: formData.compare_price ? Number(formData.compare_price) : null,
      stock: Number(formData.stock) || 0,
      sizes: parsedSizes.length > 0 ? parsedSizes : ['Unitalla'],
      colors: parsedColors,
      category_name: formData.category === 'gorras' ? 'Gorras' : formData.category === 'tenis' ? 'Tenis' : 'Moda Urbana',
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
      showToast(`"${payload.name}" actualizado`);
    } else {
      await addProduct(payload);
      showToast(`"${payload.name}" agregado`);
    }

    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    setConfirmDeleteId(null);
    showToast('Producto eliminado exitosamente', 'info');
  };

  const handleDuplicate = async (id) => {
    const cloned = await duplicateProduct(id);
    if (cloned) {
      showToast(`Producto duplicado como "${cloned.name}"`);
    }
  };

  // Filtrado de la tabla
  const filteredProducts = products.filter((p) => {
    const matchSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Catálogo & CRUD de Productos
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Administra precios, descripciones, stock e imágenes del catálogo
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU, marca..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold focus:outline-none"
        >
          <option value="all">Todas las Categorías ({products.length})</option>
          <option value="gorras">Gorras</option>
          <option value="tenis">Tenis</option>
          <option value="moda-urbana">Moda Urbana</option>
        </select>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Precio</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img
                      src={p.main_image}
                      alt={p.name}
                      className="w-12 h-14 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-white text-xs">{p.name}</div>
                      <div className="text-[11px] text-zinc-400">{p.brand}</div>
                      {p.featured && (
                        <span className="text-[10px] text-amber-400 font-semibold">★ Destacado</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300 capitalize">
                    {p.category}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400">
                    {p.sku}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    {formatCurrency(p.price)}
                    {p.compare_price && (
                      <span className="block text-[10px] text-zinc-500 line-through">
                        {formatCurrency(p.compare_price)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.stock === 0 ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-zinc-300 capitalize">{p.status}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDuplicate(p.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                        title="Duplicar producto"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                        title="Editar producto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40"
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

      {/* Modal de Crear / Editar Producto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-xl font-extrabold text-white font-heading">
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-zinc-400 hover:text-white" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-950 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">Marca *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    placeholder="Ej: Rico o Muerto, Nike, Jordan..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  >
                    <option value="gorras">Gorras</option>
                    <option value="tenis">Tenis</option>
                    <option value="moda-urbana">Moda Urbana</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">SKU / Código</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="KS-G099"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">Precio (L.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="850.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">Precio Anterior / Oferta (L.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                    placeholder="1000.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Imagen Principal */}
              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                  Fotografía Principal *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.main_image}
                    onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                    placeholder="URL de la imagen o ruta local"
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImg ? 'Subiendo...' : 'Subir'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                {formData.main_image && (
                  <div className="mt-2 w-16 aspect-3/4 rounded-lg overflow-hidden border border-zinc-700">
                    <img src={formData.main_image} alt="Vista previa" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Tallas y Colores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                    Tallas (Separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="38, 39, 40, 41, 42 o Unitalla"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                    Colores (Separados por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Negro, Rojo, Blanco"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded bg-zinc-950 border-zinc-700"
                  />
                  <span>Producto Destacado</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    className="rounded bg-zinc-950 border-zinc-700"
                  />
                  <span>Badge Nuevo</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_sale}
                    onChange={(e) => setFormData({ ...formData, is_sale: e.target.checked })}
                    className="rounded bg-zinc-950 border-zinc-700"
                  />
                  <span>Badge Oferta</span>
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-extrabold uppercase hover:bg-zinc-200"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 text-center">
            <h3 className="font-extrabold text-white text-base">¿Eliminar este producto?</h3>
            <p className="text-xs text-zinc-400">Esta acción removerá el producto del catálogo.</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase hover:bg-rose-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
