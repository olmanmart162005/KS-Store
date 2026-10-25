import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Crown,
  Footprints,
  Shirt,
  Sparkles,
  Check,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';

export const CategoriesAdmin = () => {
  const { categories, products, addCategory, updateCategory } = useProducts();
  const { showToast } = useCart();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Crown');
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setIcon('Sparkles');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCat(cat);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setIcon(cat.icon || 'Crown');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name, description, icon });
        showToast('Categoría actualizada correctamente', 'success');
      } else {
        await addCategory({ name, description, icon });
        showToast('Categoría agregada al catálogo', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err.message || 'No se pudieron guardar los cambios.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryIcon = (iconName) => {
    if (iconName === 'Crown') return <Crown className="w-6 h-6 text-amber-400" />;
    if (iconName === 'Footprints') return <Footprints className="w-6 h-6 text-rose-400" />;
    if (iconName === 'Shirt') return <Shirt className="w-6 h-6 text-blue-400" />;
    return <Sparkles className="w-6 h-6 text-emerald-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            <Tags className="w-3.5 h-3.5 text-amber-400" />
            <span>Estructura del Catálogo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Categorías ({categories.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Organiza las líneas de productos de KS Store y consulta sus métricas reales
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.category === cat.slug);
          const totalUnits = catProducts.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
          const totalValue = catProducts.reduce(
            (acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0),
            0
          );

          return (
            <div
              key={cat.id || cat.slug}
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-6 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                    {renderCategoryIcon(cat.icon)}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                    title="Editar categoría"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">
                    /{cat.slug}
                  </span>
                  <h2 className="text-xl font-extrabold text-white font-heading">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {cat.description || 'Categoría oficial del catálogo KS Store.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800/80 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Modelos registrados:</span>
                  <span className="font-extrabold text-white">{catProducts.length}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Unidades en stock:</span>
                  <span className="font-extrabold text-emerald-400">{totalUnits} uds</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Valor de inventario:</span>
                  <span className="font-extrabold text-white">{formatCurrency(totalValue)}</span>
                </div>

                <div className="pt-2">
                  <Link
                    to={
                      cat.slug === 'gorras'
                        ? '/admin/gorras'
                        : cat.slug === 'tenis'
                        ? '/admin/tenis'
                        : '/admin/productos'
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Administrar Productos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-white text-lg font-heading">
                {editingCat ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej: Gorras, Tenis, Accesorios..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                  Ícono Representativo
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                >
                  <option value="Crown">Corona (Gorras)</option>
                  <option value="Footprints">Calzado (Tenis / Sneakers)</option>
                  <option value="Shirt">Prenda (Moda Urbana)</option>
                  <option value="Sparkles">Estrella (Exclusivos)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-extrabold uppercase flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
