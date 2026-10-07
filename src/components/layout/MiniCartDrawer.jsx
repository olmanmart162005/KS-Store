import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';

export const MiniCartDrawer = () => {
  const { cart, isDrawerOpen, setIsDrawerOpen, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Fondo oscuro con desenfoque */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 text-white flex flex-col shadow-2xl">
          {/* Header del Drawer */}
          <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700/60">
                <ShoppingBag className="w-4 h-4 text-zinc-300" />
              </div>
              <h2 className="font-bold text-lg tracking-tight">Tu Carrito</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-semibold">
                {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Productos */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-base text-zinc-200">Tu carrito está vacío</p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    Explora nuestras gorras de diseñador y sneakers para agregar tus favoritos.
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                >
                  Ver Catálogo
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.key}
                  className="flex gap-3.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  {/* Miniatura */}
                  <div className="w-18 h-24 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                    <img
                      src={item.main_image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-xs sm:text-sm text-zinc-100 line-clamp-1">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.key)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                          title="Eliminar ítem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-zinc-400 mt-1 space-y-0.5">
                        {item.size && item.size !== 'Unitalla' && (
                          <p>Talla: <span className="text-zinc-300 font-medium">{item.size}</span></p>
                        )}
                        {item.color && (
                          <p>Color: <span className="text-zinc-300 font-medium">{item.color}</span></p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
                      {/* Control de cantidad */}
                      <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden bg-zinc-950">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-0.5 text-zinc-400 hover:text-white disabled:opacity-40 text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="px-2 py-0.5 text-zinc-400 hover:text-white text-xs"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-xs sm:text-sm text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer del Drawer */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/90 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 font-medium">Subtotal</span>
                <span className="text-lg font-extrabold text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                El pedido se coordinará y confirmará directamente por WhatsApp.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/carrito"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-3 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-center font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Ver Carrito
                </Link>
                <Link
                  to="/carrito"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-3 px-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-center font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                >
                  <span>Pedir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
