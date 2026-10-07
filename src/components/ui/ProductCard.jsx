import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { formatCurrency } from '../../services/whatsappService';
import { useCart } from '../../context/CartContext';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const [addedRecently, setAddedRecently] = useState(false);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Si tiene tallas complejas (ejemplo tenis), abrir detalle para elegir talla adecuadamente
    if (product.category === 'tenis' && product.sizes && product.sizes.length > 1) {
      window.location.href = `/producto/${product.slug}`;
      return;
    }

    addToCart(product, {
      size: product.sizes?.[0] || 'Unitalla',
      color: product.colors?.[0] || '',
      quantity: 1,
    });

    setAddedRecently(true);
    setTimeout(() => setAddedRecently(false), 1500);
  };

  const discountPercent = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  return (
    <div className="group relative flex flex-col bg-zinc-900/60 rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60">
      {/* Contenedor de Imagen (Aspect Ratio 3:4) */}
      <Link 
        to={`/producto/${product.slug}`} 
        className="relative aspect-3/4 w-full overflow-hidden bg-zinc-950 block"
      >
        <img
          src={imgError ? '/images/logo/logo.png' : product.main_image}
          alt={`KS Store - ${product.name} (${product.category === 'gorras' ? 'gorras' : 'sneakers'})`}
          loading="lazy"
          onError={() => setImgError(true)}
          className={`h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 ${
            imgError ? 'p-8 opacity-40 invert' : ''
          }`}
        />

        {/* Gradiente sutil inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />

        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.is_new && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-zinc-950 uppercase tracking-wider shadow-sm">
              Nuevo
            </span>
          )}
          {discountPercent && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white uppercase tracking-wider shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.featured && !product.is_new && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 backdrop-blur-sm">
              Destacado
            </span>
          )}
        </div>

        {/* Badge de Disponibilidad si está agotado */}
        {product.status === 'sold_out' && (
          <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-300 uppercase tracking-widest">
              Agotado
            </span>
          </div>
        )}

        {/* Acciones flotantes al hover en Desktop */}
        <div className="hidden sm:flex absolute inset-x-3 bottom-3 gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
          <button
            onClick={handleQuickAdd}
            disabled={product.status === 'sold_out'}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addedRecently ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Agregado
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                {product.category === 'tenis' ? 'Elegir Talla' : 'Al Carrito'}
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Información del Producto */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-zinc-400">
            {product.brand}
          </span>
          <span className="text-zinc-500">
            {product.category_name || (product.category === 'gorras' ? 'Gorra' : 'Tenis')}
          </span>
        </div>

        <Link to={`/producto/${product.slug}`} className="group-hover:text-rose-400 transition-colors">
          <h3 className="font-bold text-sm sm:text-base text-zinc-100 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Precios */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-extrabold text-white">
            {formatCurrency(product.price)}
          </span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-xs sm:text-sm text-zinc-400 line-through">
              {formatCurrency(product.compare_price)}
            </span>
          )}
        </div>

        {/* Estado en stock */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full ${
            product.status === 'sold_out' 
              ? 'bg-rose-500' 
              : product.stock <= 2 
              ? 'bg-amber-400' 
              : 'bg-emerald-400'
          }`} />
          <span className={product.status === 'sold_out' ? 'text-rose-400 font-medium' : 'text-zinc-400'}>
            {product.status === 'sold_out' 
              ? 'Agotado' 
              : product.stock <= 2 
              ? 'Pocas unidades' 
              : 'Disponible'}
          </span>
        </div>

        {/* Botón táctil visible en móvil */}
        <div className="mt-3.5 sm:hidden pt-2 border-t border-zinc-800/80">
          <button
            onClick={handleQuickAdd}
            disabled={product.status === 'sold_out'}
            className="w-full py-2 px-3 rounded-lg bg-zinc-800 active:bg-zinc-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {addedRecently ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Agregado
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-zinc-300" />
                {product.category === 'tenis' ? 'Ver Tallas' : 'Agregar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
