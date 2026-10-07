import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  Sparkles,
  ChevronRight,
  Share2
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency, sendProductQueryToWhatsApp } from '../../services/whatsappService';
import { ProductCard } from '../../components/ui/ProductCard';

export const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart, showToast } = useCart();

  // Buscar producto por slug o por id
  const product = products.find((p) => p.slug === slug || p.id === slug);

  // Estados de configuración de producto
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.main_image);
      // Preseleccionar si solo tiene una talla (ej. gorras)
      if (product.sizes?.length === 1) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize('');
      }
      // Preseleccionar color si existe
      if (product.colors?.length > 0) {
        setSelectedColor(product.colors[0]);
      }
      setQuantity(1);
      setValidationError('');
      window.scrollTo(0, 0);
    }
  }, [product, slug]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Producto no encontrado</h2>
        <p className="text-sm text-zinc-400 mb-6">El producto que buscas ya no está disponible o el enlace es incorrecto.</p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  // Validación previa a agregar al carrito
  const handleAddToCart = () => {
    // Si el producto tiene múltiples tallas y no ha seleccionado
    if (product.sizes?.length > 1 && !selectedSize) {
      setValidationError('Por favor selecciona una talla antes de agregar al carrito.');
      return;
    }

    setValidationError('');
    addToCart(product, {
      size: selectedSize || product.sizes?.[0] || 'Unitalla',
      color: selectedColor || product.colors?.[0] || '',
      quantity,
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  // Consulta directa por WhatsApp
  const handleWhatsAppQuery = () => {
    if (product.sizes?.length > 1 && !selectedSize) {
      setValidationError('Selecciona tu talla preferida para incluirla en la consulta de WhatsApp.');
      return;
    }
    setValidationError('');
    sendProductQueryToWhatsApp(product, selectedSize, selectedColor);
  };

  const discountPercent = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  // Productos relacionados
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <Link to={`/${product.category}`} className="hover:text-white transition-colors capitalize">
          {product.category_name || product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-zinc-200 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Grid Principal del Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Columna Izquierda: Galería de Imágenes */}
        <div className="lg:col-span-7 space-y-4">
          {/* Imagen Principal */}
          <div className="relative aspect-3/4 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
            <img
              src={selectedImage || product.main_image}
              alt={`KS Store - ${product.name} (${product.category === 'gorras' ? 'gorras' : 'sneakers'})`}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />

            {/* Badges Flotantes */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.is_new && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white text-zinc-950 uppercase tracking-wider shadow-lg">
                  Nuevo Lanzamiento
                </span>
              )}
              {discountPercent && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white uppercase tracking-wider shadow-lg">
                  Ahorras {discountPercent}%
                </span>
              )}
            </div>

            {product.status === 'sold_out' && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
                <span className="px-6 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-sm font-bold text-zinc-300 tracking-widest uppercase">
                  Agotado
                </span>
              </div>
            )}
          </div>

          {/* Miniaturas de Galería */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {product.gallery.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 aspect-3/4 rounded-xl overflow-hidden bg-zinc-900 border-2 transition-all shrink-0 ${
                    selectedImage === img
                      ? 'border-white scale-105 shadow-md'
                      : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`KS Store - ${product.name} vista ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Especificaciones y Compra */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Cabecera del Producto */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="font-extrabold uppercase tracking-widest text-zinc-300">
                {product.brand}
              </span>
              <span className="font-mono text-zinc-500">
                SKU: {product.sku}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading leading-tight">
              {product.name}
            </h1>

            {/* Precios */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {formatCurrency(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-base text-zinc-500 line-through">
                  {formatCurrency(product.compare_price)}
                </span>
              )}
            </div>

            {/* Disponibilidad */}
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                product.status === 'sold_out' ? 'bg-rose-500' : 'bg-emerald-400'
              }`} />
              <span className={product.status === 'sold_out' ? 'text-rose-400 font-semibold' : 'text-zinc-300'}>
                {product.status === 'sold_out' ? 'Producto agotado' : `En stock (${product.stock} disponibles)`}
              </span>
            </div>
          </div>

          <hr className="border-zinc-800" />

          {/* Selector de Tallas (Sección 44.2) */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Talla {product.category === 'tenis' ? '(EUR)' : ''}
                </span>
                {selectedSize && (
                  <span className="text-xs text-zinc-400">
                    Seleccionada: <strong className="text-white">{selectedSize}</strong>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      setSelectedSize(sz);
                      setValidationError('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all ${
                      selectedSize === sz
                        ? 'bg-white text-zinc-950 ring-2 ring-white shadow-md'
                        : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Color */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Color / Edición
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {selectedColor}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedColor === c
                        ? 'bg-zinc-800 text-white border border-white'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Cantidad */}
          <div>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
              Cantidad
            </span>
            <div className="inline-flex items-center border border-zinc-700 rounded-xl bg-zinc-900 overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-3.5 py-2 text-zinc-400 hover:text-white disabled:opacity-40 font-bold"
              >
                -
              </button>
              <span className="px-4 text-sm font-extrabold text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                disabled={quantity >= (product.stock || 99)}
                className="px-3.5 py-2 text-zinc-400 hover:text-white disabled:opacity-40 font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Alerta de Validación */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="space-y-3 pt-2">
            {/* AGREGAR AL CARRITO (Sección 44.1) */}
            <button
              onClick={handleAddToCart}
              disabled={product.status === 'sold_out'}
              className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Agregado al Carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Agregar al Carrito</span>
                </>
              )}
            </button>

            {/* CONSULTAR POR WHATSAPP (Sección 10 y 11) */}
            <button
              onClick={handleWhatsAppQuery}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-950 hover:scale-[1.01] active:scale-[0.99]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Consultar por WhatsApp</span>
            </button>
          </div>

          {/* Descripción */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Descripción del Producto
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Garantías KS Store */}
          <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Autenticidad 100% garantizada</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Envíos a toda Honduras</span>
            </div>
          </div>

        </div>

      </div>

      {/* Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-12 border-t border-zinc-800">
          <h2 className="text-2xl font-bold text-white font-heading mb-8">
            También te podría interesar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
