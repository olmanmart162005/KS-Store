import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Crown,
  Footprints,
  Shirt,
  Sparkles,
  ExternalLink,
  Copy,
  Edit2,
  Tag,
  Layers,
  DollarSign,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';

/**
 * Modal de Vista Detallada de Producto en el Administrador
 */
export const ProductViewModal = ({ product, isOpen, onClose, onEdit, onDuplicate }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 font-mono">
              {product.sku}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white font-heading truncate max-w-md">
              Detalles del Producto
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Imagen y Galería */}
          <div className="md:col-span-5 space-y-3">
            <div className="aspect-3/4 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
              <img
                src={product.main_image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.gallery && product.gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.gallery.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    className="w-14 aspect-3/4 rounded-lg object-cover border border-zinc-800 shrink-0"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Datos completos */}
          <div className="md:col-span-7 space-y-4 text-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400">
                {product.brand} • {product.category_name || product.category}
              </span>
              <h3 className="text-xl font-extrabold text-white font-heading mt-0.5">
                {product.name}
              </h3>
              {product.model && (
                <p className="text-zinc-400 text-xs mt-0.5">Modelo: {product.model}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <div>
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">Precio Venta</span>
                <span className="text-base font-extrabold text-white">{formatCurrency(product.price)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">Precio Anterior</span>
                <span className="text-sm font-bold text-zinc-400 line-through">
                  {product.compare_price ? formatCurrency(product.compare_price) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">Inventario</span>
                <span className={`text-sm font-extrabold ${product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {product.stock} unidades
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-zinc-400 block">Descripción</span>
              <p className="text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                {product.description || 'Sin descripción registrada.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1.5">Tallas</span>
                <div className="flex flex-wrap gap-1">
                  {(product.sizes || ['Unitalla']).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-semibold text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1.5">Colores</span>
                <div className="flex flex-wrap gap-1">
                  {(product.colors || ['Negro']).map((c, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-semibold text-[11px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                product.status === 'sold_out'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : product.status === 'hidden'
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                Estado: {product.status === 'sold_out' ? 'Agotado' : product.status === 'hidden' ? 'Oculto' : 'Disponible'}
              </span>
              {product.featured && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  ★ Destacado
                </span>
              )}
              {product.is_new && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-zinc-950">
                  Badge Nuevo
                </span>
              )}
              {product.is_sale && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                  En Oferta
                </span>
              )}
            </div>

            {product.updated_at && (
              <p className="text-[11px] text-zinc-500 pt-1">
                Última actualización: {new Date(product.updated_at).toLocaleString('es-HN')}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/producto/${product.slug}`}
            target="_blank"
            className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ver en tienda pública</span>
          </Link>

          <div className="flex items-center gap-2">
            {onDuplicate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDuplicate(product.id);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-extrabold uppercase flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Producto</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal Profesional de Creación y Edición de Producto (Organizado por Secciones)
 */
export const ProductFormModal = ({
  isOpen,
  onClose,
  editingProduct = null,
  defaultCategory = 'gorras',
}) => {
  const { addProduct, updateProduct, uploadImage, categories, generateNextSku } = useProducts();
  const { showToast } = useCart();

  const buildInitialState = (prod, catDefault) => {
    if (prod) {
      return {
        name: prod.name || '',
        brand: prod.brand || '',
        model: prod.model || '',
        category: prod.category || catDefault || 'gorras',
        sku: prod.sku || '',
        price: prod.price !== undefined && prod.price !== null ? String(prod.price) : '',
        compare_price: prod.compare_price ? String(prod.compare_price) : '',
        stock: prod.stock !== undefined && prod.stock !== null ? String(prod.stock) : '10',
        status: prod.status || 'available',
        featured: Boolean(prod.featured),
        is_new: Boolean(prod.is_new),
        is_sale: Boolean(prod.is_sale),
        description: prod.description || '',
        main_image: prod.main_image || '',
        gallery: Array.isArray(prod.gallery) ? prod.gallery : prod.main_image ? [prod.main_image] : [],
        sizes: Array.isArray(prod.sizes) ? prod.sizes.join(', ') : prod.sizes || 'Ajustable / Unitalla',
        colors: Array.isArray(prod.colors) ? prod.colors.join(', ') : prod.colors || 'Negro',
        visor_type: prod.attributes?.visor_type || 'Curva / Semi-curva',
        closure_type: prod.attributes?.closure_type || 'Snapback Ajustable',
        silhouette: prod.attributes?.silhouette || 'Low / Retro',
      };
    }

    const isTenis = catDefault === 'tenis';
    const autoSku =
      typeof generateNextSku === 'function' ? generateNextSku(catDefault || 'gorras') : '';

    return {
      name: '',
      brand: isTenis ? 'Nike' : 'New Era',
      model: '',
      category: catDefault || 'gorras',
      sku: autoSku,
      price: '',
      compare_price: '',
      stock: '10',
      status: 'available',
      featured: false,
      is_new: true,
      is_sale: false,
      description: '',
      main_image: '',
      gallery: [],
      sizes: isTenis ? '38, 39, 40, 41, 42, 43' : 'Ajustable / Unitalla',
      colors: 'Negro',
      visor_type: 'Curva / Semi-curva',
      closure_type: 'Snapback Ajustable',
      silhouette: 'Low / Retro',
    };
  };

  const [formData, setFormData] = useState(() => buildInitialState(editingProduct, defaultCategory));
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(buildInitialState(editingProduct, defaultCategory));
      setFormError('');
      setSaving(false);
      setNewGalleryUrl('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingProduct, defaultCategory]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat) => {
    setFormData((prev) => {
      const updated = { ...prev, category: newCat };
      if (!editingProduct) {
        if (typeof generateNextSku === 'function') {
          updated.sku = generateNextSku(newCat);
        }
        if (newCat === 'tenis') {
          if (prev.sizes === 'Ajustable / Unitalla') {
            updated.sizes = '38, 39, 40, 41, 42, 43';
          }
          if (prev.brand === 'New Era') {
            updated.brand = 'Nike';
          }
        } else if (newCat === 'gorras') {
          if (prev.sizes.includes('38') || prev.sizes.includes('40')) {
            updated.sizes = 'Ajustable / Unitalla';
          }
          if (prev.brand === 'Nike') {
            updated.brand = 'New Era';
          }
        }
      }
      return updated;
    });
  };

  const handleToggleSizeChip = (sizeValue) => {
    const currentList = String(formData.sizes || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => s !== 'Ajustable / Unitalla');

    const exists = currentList.includes(sizeValue);
    const nextList = exists
      ? currentList.filter((s) => s !== sizeValue)
      : [...currentList, sizeValue].sort((a, b) => Number(a) - Number(b));

    setFormData((prev) => ({
      ...prev,
      sizes: nextList.length > 0 ? nextList.join(', ') : sizeValue,
    }));
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMain(true);
    setFormError('');
    try {
      const publicUrl = await uploadImage(file);
      if (publicUrl) {
        setFormData((prev) => ({
          ...prev,
          main_image: publicUrl,
          gallery: Array.from(new Set([publicUrl, ...(prev.gallery || [])])),
        }));
        showToast('Fotografía principal subida correctamente');
      }
    } catch (err) {
      setFormError(err.message || 'No se pudo subir la fotografía. Inténtalo nuevamente.');
    } finally {
      setUploadingMain(false);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingGallery(true);
    setFormError('');
    try {
      const publicUrl = await uploadImage(file);
      if (publicUrl) {
        setFormData((prev) => ({
          ...prev,
          main_image: prev.main_image || publicUrl,
          gallery: Array.from(new Set([...(prev.gallery || []), publicUrl])),
        }));
        showToast('Imagen añadida a la galería');
      }
    } catch (err) {
      setFormError(err.message || 'Error al subir imagen a la galería.');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleAddGalleryUrl = () => {
    const clean = newGalleryUrl.trim();
    if (!clean) return;
    setFormData((prev) => ({
      ...prev,
      main_image: prev.main_image || clean,
      gallery: Array.from(new Set([...(prev.gallery || []), clean])),
    }));
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (imgUrl) => {
    setFormData((prev) => {
      const nextGallery = (prev.gallery || []).filter((item) => item !== imgUrl);
      const nextMain = prev.main_image === imgUrl ? nextGallery[0] || '' : prev.main_image;
      return {
        ...prev,
        main_image: nextMain,
        gallery: nextGallery,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || uploadingMain || uploadingGallery) return;
    setFormError('');

    // Validaciones exhaustivas
    if (!formData.name.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return;
    }
    if (!formData.brand.trim()) {
      setFormError('La marca del producto es obligatoria.');
      return;
    }
    const numericPrice = Number(formData.price);
    if (formData.price === '' || isNaN(numericPrice) || numericPrice <= 0) {
      setFormError('Ingresa un precio de venta válido mayor a L. 0.00.');
      return;
    }
    const numericCompare =
      formData.compare_price !== '' && formData.compare_price !== null
        ? Number(formData.compare_price)
        : null;
    if (numericCompare !== null && (isNaN(numericCompare) || numericCompare < 0)) {
      setFormError('El precio anterior debe ser un número válido.');
      return;
    }
    const numericStock = Number(formData.stock);
    if (isNaN(numericStock) || numericStock < 0) {
      setFormError('La cantidad en inventario (stock) no puede ser negativa.');
      return;
    }
    if (!formData.main_image.trim()) {
      setFormError('Debes proporcionar o subir una fotografía principal para el producto.');
      return;
    }

    const parsedSizes = String(formData.sizes || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedColors = String(formData.colors || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const finalGallery = Array.from(
      new Set([formData.main_image.trim(), ...(formData.gallery || [])].filter(Boolean))
    );

    const payload = {
      name: formData.name.trim(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      category: formData.category,
      sku: formData.sku.trim(),
      price: numericPrice,
      compare_price: numericCompare && numericCompare > 0 ? numericCompare : null,
      stock: numericStock,
      status: numericStock === 0 && formData.status === 'available' ? 'sold_out' : formData.status,
      featured: Boolean(formData.featured),
      is_new: Boolean(formData.is_new),
      is_sale: Boolean(formData.is_sale),
      description: formData.description.trim(),
      main_image: formData.main_image.trim(),
      gallery: finalGallery,
      sizes: parsedSizes.length > 0 ? parsedSizes : ['Ajustable / Unitalla'],
      colors: parsedColors.length > 0 ? parsedColors : ['Negro'],
      attributes: {
        model: formData.model.trim(),
        visor_type: formData.visor_type,
        closure_type: formData.closure_type,
        silhouette: formData.silhouette,
      },
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        showToast('Producto actualizado correctamente', 'success');
      } else {
        await addProduct(payload);
        showToast('Producto agregado al catálogo', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Error guardando producto:', err);
      setFormError(
        err.message || 'No se pudieron guardar los cambios. Inténtalo nuevamente.'
      );
      showToast('No se pudieron guardar los cambios. Inténtalo nuevamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl my-auto flex flex-col max-h-[94vh]">
        {/* Cabecera fija del modal */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-zinc-800 bg-zinc-950/80 rounded-t-3xl shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block">
              {editingProduct ? `Editando ID / SKU: ${editingProduct.sku}` : 'Nuevo Registro en Base de Datos'}
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white font-heading">
              {editingProduct ? 'Editar Producto' : 'Agregar Producto al Catálogo'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario con scroll interno */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8 overflow-y-auto flex-1">
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white">No se pudieron guardar los cambios</p>
                <p>{formError}</p>
              </div>
            </div>
          )}

          {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Tag className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                1. Información General
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Gorra New Era Negra Premium"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Código / SKU *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ej: KS-G015"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                  {!categories.some((c) => c.slug === 'gorras') && <option value="gorras">Gorras</option>}
                  {!categories.some((c) => c.slug === 'tenis') && <option value="tenis">Tenis</option>}
                  {!categories.some((c) => c.slug === 'moda-urbana') && (
                    <option value="moda-urbana">Moda Urbana</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Marca *
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder={
                    formData.category === 'tenis'
                      ? 'Ej: Nike, Jordan, Adidas, New Balance...'
                      : 'Ej: New Era, Rico o Muerto, 31 Hats...'
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(formData.category === 'tenis'
                    ? ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Yeezy', 'Puma', 'Converse']
                    : ['New Era', 'Rico o Muerto', '31 Hats', 'Dandy Hats', 'Barbas Hats', 'JC Hats']
                  ).map((brandName) => (
                    <button
                      key={brandName}
                      type="button"
                      onClick={() => setFormData({ ...formData, brand: brandName })}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                        formData.brand === brandName
                          ? 'bg-white text-zinc-950'
                          : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {brandName}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Modelo / Silueta
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ej: 59FIFTY, Air Jordan 1, Snapback..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                Descripción del Producto
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe materiales, bordados, acabados y detalles del producto..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white focus:outline-none focus:border-white resize-none"
              />
            </div>
          </div>

          {/* SECCIÓN 2: PRECIO E INVENTARIO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                2. Precio e Inventario (Lempiras L.)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Precio de Venta (L.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="650.00"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm font-extrabold text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Precio Anterior (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.compare_price}
                  onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                  placeholder="850.00"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-zinc-300 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Cantidad Disponible (Stock) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = Number(val);
                    setFormData((prev) => ({
                      ...prev,
                      stock: val,
                      status: num === 0 ? 'sold_out' : prev.status === 'sold_out' ? 'available' : prev.status,
                    }));
                  }}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Estado del Producto
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-white"
                >
                  <option value="available">Disponible</option>
                  <option value="low_stock">Pocas unidades</option>
                  <option value="sold_out">Agotado</option>
                  <option value="hidden">Oculto en tienda</option>
                </select>
              </div>
            </div>

            {/* Badges / Estados */}
            <div className="flex flex-wrap gap-3 pt-2">
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                />
                <span className="font-semibold">★ Destacar en Portada</span>
              </label>

              <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_new}
                  onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                  className="rounded bg-zinc-900 border-zinc-700 text-white focus:ring-0"
                />
                <span className="font-semibold">Etiqueta "Nuevo"</span>
              </label>

              <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_sale}
                  onChange={(e) => setFormData({ ...formData, is_sale: e.target.checked })}
                  className="rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-0"
                />
                <span className="font-semibold">Etiqueta "En Oferta"</span>
              </label>
            </div>
          </div>

          {/* SECCIÓN 3: CARACTERÍSTICAS (TALLAS, COLORES, ATRIBUTOS) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                3. Características (Tallas, Colores y Atributos)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Tallas Disponibles (Separadas por coma o selecciona abajo)
                </label>
                <input
                  type="text"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  placeholder="Ej: Ajustable / Unitalla o 38, 39, 40, 41, 42"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
                {formData.category === 'tenis' && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map((sz) => {
                      const activeSizes = String(formData.sizes || '')
                        .split(',')
                        .map((s) => s.trim());
                      const isSelected = activeSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSizeChip(sz)}
                          className={`text-[10px] w-7 h-7 rounded-lg font-bold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white border border-rose-400'
                              : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizes: 'Ajustable / Unitalla' })}
                    className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    + Unitalla (Gorras)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizes: '38, 39, 40, 41, 42, 43' })}
                    className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    + Tallas 38-43 (Tenis)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizes: '36, 37, 38, 39, 40' })}
                    className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    + Tallas 36-40 (Dama)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizes: 'S, M, L, XL' })}
                    className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    + Ropa (S-XL)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Colores (Separados por coma)
                </label>
                <input
                  type="text"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="Ej: Negro / Rojo, Triple Black, Blanco"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: FOTOGRAFÍAS E IMÁGENES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                4. Fotografías del Producto
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Vista previa imagen principal */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="w-full max-w-[200px] aspect-3/4 rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center relative group">
                  {formData.main_image ? (
                    <>
                      <img
                        src={formData.main_image}
                        alt="Vista previa principal"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, main_image: '' })}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Quitar imagen principal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 text-zinc-500 space-y-2">
                      <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
                      <span className="text-[11px] block">Sin fotografía principal</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold mt-2">
                  Vista Previa Principal (3:4)
                </span>
              </div>

              {/* Controles de carga y galería */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Fotografía Principal (Subir archivo o pegar URL) *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={formData.main_image}
                      onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                      placeholder="/images/products/gorras/... o https://..."
                      required
                      className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-white"
                    />
                    <label className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-colors shrink-0">
                      {uploadingMain ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Reemplazar / Subir Foto</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        disabled={uploadingMain}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Galería secundaria */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-zinc-400">
                      Galería de Imágenes ({formData.gallery?.length || 0})
                    </span>
                    <label className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1">
                      {uploadingGallery ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingGallery ? 'Subiendo...' : 'Subir otra foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGalleryUpload}
                        disabled={uploadingGallery}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="Añadir URL de imagen adicional a la galería..."
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryUrl}
                      className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white"
                    >
                      Añadir
                    </button>
                  </div>

                  {formData.gallery && formData.gallery.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {formData.gallery.map((img, i) => (
                        <div
                          key={i}
                          className={`relative w-16 aspect-3/4 rounded-lg overflow-hidden border-2 group ${
                            formData.main_image === img ? 'border-emerald-400' : 'border-zinc-800'
                          }`}
                        >
                          <img src={img} alt={`Galería ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            {formData.main_image !== img && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, main_image: img })}
                                className="text-[9px] font-bold bg-white text-zinc-950 px-1.5 py-0.5 rounded"
                              >
                                Principal
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(img)}
                              className="p-1 rounded bg-rose-600 text-white"
                              title="Eliminar imagen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pie fijo de botones del formulario */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadingMain || uploadingGallery}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando en Base de Datos...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Guardar Cambios' : 'Agregar al Catálogo'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
