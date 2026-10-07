import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Crown, Truck, Flame, ArrowRight } from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
      
      {/* Hero Nosotros */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-300">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>Cultura Urbana & Streetwear</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-heading">
          Sobre KS Store
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
          Nacimos con una visión clara: traer la máxima expresión de la moda urbana, gorras de diseñador con pedrería y sneakers de colección a las calles de Honduras.
        </p>
      </div>

      {/* Valores / Pilares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-heading">Exclusividad Real</h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            No vendemos réplicas genéricas ni productos masivos sin alma. Cada gorra cuenta con bordados tridimensionales, pedrería engarzada y materiales de alto gramaje.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-heading">Fotografía 100% Auténtica</h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Lo que ves en nuestro catálogo es exactamente lo que recibes en tus manos. Todas las imágenes de nuestras gorras son tomadas directamente en nuestro showroom.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-rose-400">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-heading">Cobertura Nacional</h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Coordinamos entregas directas y envíos confiables a toda Honduras. Tu paquete viaja asegurado y empaquetado para preservar la forma de tu gorra y calzado.
          </p>
        </div>
      </div>

      {/* Banner CTA */}
      <div className="p-10 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          ¿Listo para elevar tu estilo?
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Descubre los modelos más recientes disponibles en nuestro catálogo digital.
        </p>
        <div className="pt-2">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-zinc-950 font-extrabold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg"
          >
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
};
