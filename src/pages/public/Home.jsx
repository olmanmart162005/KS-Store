import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Crown, 
  Footprints, 
  Sparkles, 
  ShoppingBag, 
  Flame, 
  CheckCircle2,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { getWhatsAppNumber, getDisplayWhatsAppNumber } from '../../services/whatsappService';

export const Home = () => {
  const { products, settings } = useProducts();
  const whatsappNum = getWhatsAppNumber();

  // Filtrar destacados y nuevos
  const featuredCaps = products.filter((p) => p.category === 'gorras' && p.featured).slice(0, 6);
  const featuredSneakers = products.filter((p) => p.category === 'tenis').slice(0, 4);
  const trendingDrops = products.filter((p) => p.is_new).slice(0, 8);

  // Producto destacado para el showcase Hero (sincronizado dinámicamente)
  const heroProduct = products.find((p) => p.sku === 'KS-G001') || products.find((p) => p.featured) || products[0];

  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      
      {/* 1. HERO SECTION (Sección 6) */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:py-20 lg:py-28 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/60">
        {/* Luces y texturas ambientales de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-rose-600/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-zinc-700/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Texto Principal Hero */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-xs font-bold tracking-widest uppercase text-zinc-300 backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                <span>Nueva Colección Exclusiva 2026</span>
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-heading">
                KS STORE
                <span className="block text-2xl sm:text-4xl xl:text-5xl font-medium text-zinc-400 mt-2">
                  {settings.tagline || 'Estilo que te representa.'}
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {settings.hero_subtitle || 'KS Store es tu tienda en línea de gorras, sneakers y moda urbana en Honduras. La selección más cotizada en gorras de diseñador, pedrería fina y calzado urbano con envíos a todo el país.'}
              </p>

              {/* Botones CTA Principales */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/catalogo"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ver Catálogo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/gorras"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/90 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Ver Gorras</span>
                </Link>
              </div>

              {/* Estadísticas rápidas / Confianza */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-zinc-800/80 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white font-heading">43+</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Gorras Reales</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white font-heading">100%</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Original & Drip</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white font-heading">HN 🇭🇳</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Envíos Rápidos</div>
                </div>
              </div>
            </div>

            {/* Showcase Visual de Fotografías Reales */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md">
                
                {/* Marco de Fotografía Principal */}
                <div className="relative aspect-3/4 rounded-3xl overflow-hidden border-2 border-zinc-700/80 shadow-2xl shadow-black/80 bg-zinc-900 group">
                  <img
                    src={heroProduct?.main_image || "/images/products/gorras/IMG-20261006-WA0083.jpg"}
                    alt={heroProduct?.name ? `KS Store - ${heroProduct.name}` : "KS Store - Gorras y Sneakers en Honduras"}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                  {/* Card Flotante Informativa */}
                  <div className="absolute bottom-5 inset-x-5 p-4 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
                        {heroProduct?.is_new ? 'Nuevo Lanzamiento' : 'Edición Destacada'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 font-bold border border-rose-500/40">
                        {heroProduct?.brand || 'Pedrería Fina'}
                      </span>
                    </div>
                    <p className="font-extrabold text-white text-base mt-1 line-clamp-1">
                      {heroProduct?.name || 'Rico o Muerto Red Rhinestone'}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                      <span className="text-white font-extrabold text-sm">
                        L. {Number(heroProduct?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <Link
                        to={`/producto/${heroProduct?.slug || heroProduct?.id || 'gorra-rico-o-muerto-red-rhinestone'}`}
                        className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1"
                      >
                        Ver detalles <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Badge Flotante Superior */}
                <div className="absolute -top-4 -left-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-1">
                    <img src="/images/logo/logo.png" alt="KS Store - Logo Oficial" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">KS STORE</div>
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Catálogo Oficial
                    </div>
                  </div>
                </div>


              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. EXPLORA POR CATEGORÍA (Sección 7) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Colección Curada</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
            Explora por Categoría
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Encuentra exactamente la vibra urbana que estás buscando con las marcas más buscadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Tarjeta: GORRAS */}
          <div className="group relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-8 flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white font-heading">
                  Gorras
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Gorras de diseñador, New Era, pedrería fina, bordados 3D y piezas exclusivas con catálogo real.
                </p>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to="/gorras"
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <span>Ver Gorras</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Tarjeta: TENIS / SNEAKERS */}
          <div className="group relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-8 flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Footprints className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white font-heading">
                  Tenis & Sneakers
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Siluetas icónicas: Nike, Air Jordan, New Balance y modelos streetwear con tallas disponibles.
                </p>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to="/tenis"
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <span>Ver Tenis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Tarjeta: CATÁLOGO COMPLETO */}
          <div className="group relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-8 flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white font-heading">
                  Catálogo Completo
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Explora todos los lanzamientos con filtros por precio, disponibilidad, marca y tallas.
                </p>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to="/catalogo"
                className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <span>Ver Todo el Catálogo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. GORRAS DESTACADAS (Fotografías Reales) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Showroom KS Store</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Gorras Destacadas
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Fotografías reales directamente desde nuestra exhibición en tienda.
            </p>
          </div>

          <Link
            to="/gorras"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
          >
            <span>Ver las 43 Gorras</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid de Productos: 2 columnas en móvil, 3 en tablet, 4 en desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredCaps.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. SNEAKERS & TENIS SELECCIONADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-400 mb-1">
              <Footprints className="w-3.5 h-3.5" />
              <span>Streetwear Kicks</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Tenis & Sneakers
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Las mejores siluetas urbanas con selección de tallas para armar tu outfit.
            </p>
          </div>

          <Link
            to="/tenis"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
          >
            <span>Ver Todos los Tenis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredSneakers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. CÓMO FUNCIONA EL PEDIDO POR WHATSAPP (Sección 44) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Experiencia Simplificada de Compra
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Arma tu carrito y pide por WhatsApp en un clic
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Selecciona todos los productos que desees (gorras y tenis con tu talla exacta), agrégalos a tu carrito y genera un pedido único listo para ser confirmado por nuestro equipo.
            </p>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white mb-2">1</span>
                <p className="font-bold text-zinc-200">Elige tus productos</p>
                <p className="text-zinc-500 mt-0.5">Selecciona talla o color que prefieras.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white mb-2">2</span>
                <p className="font-bold text-zinc-200">Revisa tu carrito</p>
                <p className="text-zinc-500 mt-0.5">Controla cantidades y el resumen total.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold mb-2">3</span>
                <p className="font-bold text-emerald-300">Envía a WhatsApp</p>
                <p className="text-zinc-500 mt-0.5">Confirmamos disponibilidad y entrega inmediata.</p>
              </div>
            </div>

            <div className="pt-4">
              <a
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-900/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Consultar Dudas al WhatsApp ({getDisplayWhatsAppNumber()})</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
