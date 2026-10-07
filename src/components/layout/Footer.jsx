import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  MapPin, 
  Clock, 
  Shield, 
  Truck, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';
import { InstagramIcon } from '../ui/SocialIcons';
import { getWhatsAppNumber, getDisplayWhatsAppNumber } from '../../services/whatsappService';

export const Footer = () => {
  const whatsappNum = getWhatsAppNumber();
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/ks.store_hn';
  const address = import.meta.env.VITE_STORE_ADDRESS || 'Honduras';

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 text-sm">
      {/* Cinta de Garantías Urbanas */}
      <div className="border-b border-zinc-800/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Calidad 100% Exclusiva</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Diseños auténticos, pedrería fina y bordados 3D.</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Envíos a Nivel Nacional</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Entregas seguras y rápidas en toda Honduras.</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Atención Personalizada</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Respuesta inmediata en WhatsApp para tu pedido.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal del Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Columna 1: Marca & Identidad */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md">
                <img
                  src="/images/logo/logo.png"
                  alt="KS Store"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-xl text-white font-heading tracking-tight block">
                  KS STORE
                </span>
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-bold">
                  Streetwear & Caps
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tu destino definitivo para gorras de diseñador, pedrería exclusiva, sneakers y las piezas más cotizadas de la moda urbana. Estilo que te representa.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <a
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-pink-400 hover:border-pink-500/50 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Columna 2: Navegación */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 font-heading">
              Navegación
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <Link to="/catalogo" className="hover:text-white transition-colors">Catálogo Completo</Link>
              </li>
              <li>
                <Link to="/gorras" className="hover:text-white transition-colors">Colección de Gorras</Link>
              </li>
              <li>
                <Link to="/tenis" className="hover:text-white transition-colors">Sneakers & Tenis</Link>
              </li>
              <li>
                <Link to="/carrito" className="hover:text-white transition-colors">Carrito de Pedido</Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Categorías */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 font-heading">
              Categorías
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/gorras" className="hover:text-white transition-colors">Gorras Rico o Muerto</Link>
              </li>
              <li>
                <Link to="/gorras" className="hover:text-white transition-colors">Gorras New Era 59FIFTY / 9FORTY</Link>
              </li>
              <li>
                <Link to="/gorras" className="hover:text-white transition-colors">Gorras con Pedrería & Rhinestones</Link>
              </li>
              <li>
                <Link to="/tenis" className="hover:text-white transition-colors">Nike Air Max & Dunks</Link>
              </li>
              <li>
                <Link to="/tenis" className="hover:text-white transition-colors">Air Jordan Retro Series</Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto Directo */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 font-heading">
              Atención al Cliente
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-zinc-300">WhatsApp Oficial:</span>
                  <a
                    href={`https://wa.me/${whatsappNum}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:underline flex items-center gap-1 font-mono font-bold"
                  >
                    {getDisplayWhatsAppNumber()}
                    <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-zinc-300">Ubicación:</span>
                  <span>{address} • Envíos a nivel nacional</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-zinc-300">Horario de Atención:</span>
                  <span>Lunes a Sábado: 9:00 AM - 7:00 PM</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Separador inferior & Copyright */}
        <div className="mt-12 pt-6 border-t border-zinc-800/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} KS Store. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="text-zinc-400 hover:text-zinc-300 transition-colors">
              Panel Administrativo
            </Link>
            <span className="text-zinc-700">•</span>
            <span>Honduras 🇭🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
