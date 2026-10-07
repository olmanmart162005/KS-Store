import React, { useState } from 'react';
import { 
  Footprints, 
  Search, 
  Plus, 
  ExternalLink,
  Edit2,
  Trash2
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';
import { Link } from 'react-router-dom';

export const TenisAdmin = () => {
  const { products, updateProduct } = useProducts();
  const { showToast } = useCart();
  const [search, setSearch] = useState('');

  const tenis = products.filter((p) => p.category === 'tenis');

  const filteredTenis = tenis.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.brand.toLowerCase().includes(search.toLowerCase()) ||
    t.sku.toLowerCase().includes(search.toLowerCase())
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
            Control de marcas abiertas (Nike, Jordan, Yeezy, New Balance), tallas y stock
          </p>
        </div>

        <Link
          to="/admin/productos?new=true"
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Tenis</span>
        </Link>
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
              placeholder="Buscar tenis por modelo, marca o SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-600 transition-colors shadow-inner"
            />
          </div>
          <Link
            to="/admin/productos?new=true"
            className="sm:hidden px-3.5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs shrink-0 flex items-center justify-center gap-1 shadow-md hover:bg-zinc-200 transition-colors"
            title="Agregar Tenis"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo</span>
          </Link>
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
                  className="absolute bottom-2 right-2 p-2 rounded-lg bg-zinc-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <span key={sz} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                    {sz}
                  </span>
                ))}
              </div>
            </div>

            {/* Controles Rápidos de Precio y Stock */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Precio (L.)</label>
                  <input
                    type="number"
                    step="1"
                    defaultValue={sneaker.price}
                    onBlur={(e) => handlePriceChange(sneaker.id, e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Stock</label>
                  <input
                    type="number"
                    min="0"
                    defaultValue={sneaker.stock}
                    onBlur={(e) => handleStockChange(sneaker.id, e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px]">Subtotal valorizado:</span>
                <span className="font-bold text-white">
                  {formatCurrency(sneaker.price * sneaker.stock)}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
