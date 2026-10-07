import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  MessageSquare, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck,
  User,
  Phone,
  FileText,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { formatCurrency, generateOrderCode, sendOrderToWhatsApp, sendOrderToWhatsAppWithMedia, getDisplayWhatsAppNumber } from '../../services/whatsappService';

export const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();

  // Estados de datos del cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Estados de flujo de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [sentOrderCode, setSentOrderCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Validación y apertura del modal resumen (Sección 44.12)
  const handleInitiateOrder = () => {
    if (cart.length === 0) {
      setErrorMessage('El carrito está vacío.');
      return;
    }

    // Verificar que todos los ítems tengan cantidad válida
    const invalidItem = cart.find((i) => i.quantity < 1);
    if (invalidItem) {
      setErrorMessage(`El producto "${invalidItem.name}" tiene una cantidad no permitida.`);
      return;
    }

    setErrorMessage('');
    setShowConfirmModal(true);
  };

  // Confirmación y envío final por WhatsApp con fotos
  const handleConfirmAndSend = async () => {
    const code = generateOrderCode();
    setSentOrderCode(code);

    const customerData = {
      name: customerName,
      phone: customerPhone,
      notes: customerNotes,
    };

    // 1. Enviar pedido a WhatsApp con fotos (o con enlace si no soporta adjuntos)
    const result = await sendOrderToWhatsAppWithMedia(cart, customerData, code);

    // Si el usuario canceló el modal de compartir nativo, no continuamos
    if (result && result.aborted) return;

    // 2. Limpiar carrito de manera segura
    clearCart();

    // 3. Activar pantalla de éxito y confeti festivo
    setShowConfirmModal(false);
    setOrderSent(true);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#10b981'],
      });
    } catch {
      // Ignorar si canvas-confetti no está disponible
    }
  };

  // Pantalla de Pedido Enviado Exitosamente (Sección 44.16)
  if (orderSent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Código de Pedido: {sentOrderCode}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              ¡PEDIDO ENVIADO!
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Tu pedido fue preparado correctamente para enviarlo a <strong>KS Store</strong> por WhatsApp. Nuestro equipo responderá a la brevedad para coordinar la entrega y confirmación final.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 text-left space-y-2">
            <p className="font-semibold text-zinc-300">¿Qué sigue ahora?</p>
            <p>1. Si no se abrió la ventana de WhatsApp automáticamente, verifica los bloqueadores de ventanas emergentes.</p>
            <p>2. Conserva tu número de pedido <strong>{sentOrderCode}</strong> para cualquier seguimiento.</p>
          </div>

          <div className="pt-2">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Catálogo</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de Carrito Vacío (Sección 44.7)
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="p-10 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-5">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              TU CARRITO ESTÁ VACÍO
            </h1>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              Aún no has agregado productos a tu lista de compra. Explora nuestras gorras de diseñador y sneakers.
            </p>
          </div>
          <div className="pt-4">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl shadow-white/5"
            >
              <span>Explorar Catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Encabezado */}
      <div className="border-b border-zinc-800 pb-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            TU CARRITO
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tienes {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en tu lista de compra
          </p>
        </div>

        <Link
          to="/catalogo"
          className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Continuar Comprando</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid del Carrito */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Columna Izquierda: Lista de Productos (Sección 44.4) */}
        <div className="lg:col-span-7 space-y-4">
          {cart.map((item) => (
            <div
              key={item.key}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex gap-4 sm:gap-6 items-center hover:border-zinc-700 transition-colors"
            >
              {/* Imagen del Producto */}
              <Link to={`/producto/${item.slug}`} className="w-20 sm:w-24 aspect-3/4 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 block">
                <img
                  src={item.main_image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Información y Controles */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">
                      {item.brand} • {item.sku}
                    </span>
                    <Link to={`/producto/${item.slug}`} className="hover:text-rose-400 transition-colors">
                      <h3 className="font-extrabold text-sm sm:text-base text-white line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.key)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Variantes (Talla y Color) */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-2">
                  {item.size && item.size !== 'Unitalla' && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 font-medium">
                      Talla: {item.size}
                    </span>
                  )}
                  {item.color && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 font-medium">
                      Color: {item.color}
                    </span>
                  )}
                  <span className="text-zinc-500 font-mono">
                    Unitario: {formatCurrency(item.price)}
                  </span>
                </div>

                {/* Cantidad y Subtotal */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden bg-zinc-950">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-3 py-1 text-zinc-400 hover:text-white disabled:opacity-30 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-extrabold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="px-3 py-1 text-zinc-400 hover:text-white disabled:opacity-30 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">Subtotal</span>
                    <span className="text-base font-extrabold text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ))}

          <div className="pt-2 flex justify-between items-center text-xs text-zinc-400">
            <Link
              to="/catalogo"
              className="hover:text-white underline font-medium"
            >
              + Agregar más productos al pedido
            </Link>
            <button
              onClick={clearCart}
              className="text-zinc-500 hover:text-rose-400 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Cliente & Resumen (Sección 44.11) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Información del Cliente (Opcional pero recomendado) */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading">
              Tus Datos de Contacto
            </h3>
            <p className="text-xs text-zinc-400">
              Facilita tus datos para anexarlos automáticamente al mensaje de WhatsApp.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 9876-5432"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Comentarios o Dirección (Opcional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    placeholder="Ej: Enviar a San Pedro Sula / Entrega por la tarde"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumen del Pedido */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading">
              Resumen del Pedido
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Productos seleccionados</span>
                <span className="font-semibold text-zinc-200">{cart.length}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total de unidades</span>
                <span className="font-semibold text-zinc-200">{totalItems}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Envío</span>
                <span className="text-emerald-400 font-semibold">Coordinado por WhatsApp</span>
              </div>
            </div>

            <hr className="border-zinc-800" />

            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Subtotal</span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Botón Principal (Sección 44.9) */}
            <button
              onClick={handleInitiateOrder}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-emerald-950/60 hover:scale-[1.01] active:scale-[0.99]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar Pedido por WhatsApp</span>
            </button>

            <div className="pt-2 text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Atención directa al <strong>{getDisplayWhatsAppNumber()}</strong></span>
            </div>
          </div>

        </div>

      </div>

      {/* Botón Sticky en Móvil (Sección 44.19) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 p-4 z-30 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">Total ({totalItems} unids):</span>
          <span className="text-lg font-black text-white">{formatCurrency(subtotal)}</span>
        </div>
        <button
          onClick={handleInitiateOrder}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 active:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Enviar Pedido por WhatsApp</span>
        </button>
      </div>

      {/* Modal de Confirmación Previo al Envío (Sección 44.12) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-800">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-white font-heading">
                CONFIRMA TU PEDIDO
              </h2>
              <p className="text-xs text-zinc-400">
                Revisa los detalles antes de abrir WhatsApp para enviar el mensaje a KS Store.
              </p>
            </div>

            {/* Desglose rápido */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Modelos diferentes:</span>
                <span className="font-bold text-white">{cart.length}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Unidades totales:</span>
                <span className="font-bold text-white">{totalItems}</span>
              </div>
              {customerName && (
                <div className="flex justify-between text-zinc-400">
                  <span>Cliente:</span>
                  <span className="font-bold text-white">{customerName}</span>
                </div>
              )}
              {customerPhone && (
                <div className="flex justify-between text-zinc-400">
                  <span>Teléfono:</span>
                  <span className="font-bold text-white">{customerPhone}</span>
                </div>
              )}
              <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
                <span className="font-bold text-zinc-300 uppercase">Total a Consultar:</span>
                <span className="text-lg font-black text-white">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
              ¿Deseas generar el mensaje y abrir WhatsApp ahora mismo con el número oficial de KS Store ({getDisplayWhatsAppNumber()})?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Volver al Carrito
              </button>
              <button
                onClick={handleConfirmAndSend}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-950"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
