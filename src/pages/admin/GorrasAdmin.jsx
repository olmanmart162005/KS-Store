import React, { useState } from 'react';
import { 
  Crown, 
  Search, 
  Plus, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';
import { Link } from 'react-router-dom';

export const GorrasAdmin = () => {
  const { products, updateProduct, deleteProduct } = useProducts();
  const { showToast } = useCart();
  const [search, setSearch] = useState('');

  const gorras = products.filter((p) => p.category === 'gorras');

  const filteredGorras = gorras.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.sku.toLowerCase().includes(search.toLowerCase()) ||
    g.brand.toLowerCase().includes(search.toLowerCase())
  );

  const handlePriceChange = async (id, newPrice) => {
    const val = Number(newPrice);
    if (!isNaN(val) && val >= 0) {
      await updateProduct(id, { price: val });
      showToast('Precio actualizado');
    }
  };

  const handleStockChange = async (id, newStock) => {
    const val = Number(newStock);
    if (!isNaN(val) && val >= 0) {
      const status = val === 0 ? 'sold_out' : 'available';
      await updateProduct(id, { stock: val, status });
      showToast('Stock actualizado');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'sold_out' ? 'available' : 'sold_out';
    const newStock = newStatus === 'sold_out' ? 0 : 5;
    await updateProduct(id, { status: newStatus, stock: newStock });
    showToast(`Estado cambiado a ${newStatus === 'sold_out' ? 'Agotado' : 'Disponible'}`);
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    await updateProduct(id, { featured: !currentFeatured });
    showToast(`Gorra ${!currentFeatured ? 'marcada como destacada' : 'removida de destacados'}`);
  };

  const handleToggleNew = async (id, currentNew) => {
    await updateProduct(id, { is_new: !currentNew });
    showToast(`Badge nuevo ${!currentNew ? 'activado' : 'desactivado'}`);
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
            Control de inventario, precios y estados de las 43 piezas fotográficas reales
          </p>
        </div>

        <Link
          to="/admin/productos?new=true"
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Gorra</span>
        </Link>
      </div>

      {/* Buscador Fijo (Sticky) */}
      <div className="sticky top-16 sm:top-20 z-20 bg-zinc-950/95 backdrop-blur-md py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar gorra por modelo, pedrería, marca o SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-600 transition-colors shadow-lg"
          />
        </div>
      </div>

      {/* Grid de Gorras para Control Visual Directo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredGorras.map((gorra) => (
          <div
            key={gorra.id}
            className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-colors"
          >
            <div>
              {/* Fotografía con Badges */}
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
                  className="absolute bottom-2 right-2 p-2 rounded-lg bg-zinc-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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

            {/* Controles Rápidos de Precio y Stock */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Precio (L.)</label>
                  <input
                    type="number"
                    step="1"
                    defaultValue={gorra.price}
                    onBlur={(e) => handlePriceChange(gorra.id, e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Stock</label>
                  <input
                    type="number"
                    min="0"
                    defaultValue={gorra.stock}
                    onBlur={(e) => handleStockChange(gorra.id, e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Botones de Alternancia de Estado */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  onClick={() => handleToggleFeatured(gorra.id, gorra.featured)}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    gorra.featured ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  ★ {gorra.featured ? 'Destacada' : 'Normal'}
                </button>

                <button
                  onClick={() => handleToggleStatus(gorra.id, gorra.status)}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    gorra.status === 'sold_out' 
                      ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {gorra.status === 'sold_out' ? 'Agotada' : 'Disponible'}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
