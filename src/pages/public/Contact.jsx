import React, { useState } from 'react';
import { 
  MessageSquare, 
  MapPin, 
  Clock, 
  Send, 
  ArrowUpRight 
} from 'lucide-react';
import { InstagramIcon } from '../../components/ui/SocialIcons';
import { getWhatsAppNumber, getDisplayWhatsAppNumber } from '../../services/whatsappService';

export const Contact = () => {
  const whatsappNum = getWhatsAppNumber();
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/ks.store_hn';
  const address = import.meta.env.VITE_STORE_ADDRESS || 'Honduras';

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('Consulta sobre disponibilidad');
  const [message, setMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    let text = `Hola KS Store, me comunico desde la web.\n\n`;
    if (name) text += `Nombre: ${name}\n`;
    text += `Motivo: ${topic}\n`;
    if (message) text += `Mensaje: ${message}\n`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${whatsappNum}?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      
      {/* Encabezado */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Atención Inmediata
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          Contáctanos
        </h1>
        <p className="text-sm text-zinc-400">
          ¿Tienes dudas sobre un modelo, tallas disponibles o envíos? Escríbenos directamente a nuestro canal oficial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Canales Oficiales */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card WhatsApp Principal */}
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">WhatsApp KS Store</h3>
                <p className="text-xs text-zinc-400">Canal principal de ventas y consultas</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950"
              >
                <span>Chatear al {getDisplayWhatsAppNumber()}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Tarjeta de Información */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Ubicación y Entregas</p>
                <p className="text-zinc-400 mt-0.5">{address} • Cobertura de envíos a todo el territorio nacional.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Horario de Respuestas</p>
                <p className="text-zinc-400 mt-0.5">Lunes a Sábado: 9:00 AM - 7:00 PM</p>
              </div>
            </div>

            <hr className="border-zinc-800" />

            <div className="pt-1">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-pink-500 text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-colors font-semibold"
              >
                <InstagramIcon className="w-4 h-4 text-pink-400" />
                <span>Instagram: @ks.store_hn</span>
              </a>
            </div>
          </div>

        </div>

        {/* Formulario Rápido de Consulta */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSendMessage} className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-white font-heading">
              Enviar Mensaje Directo
            </h3>
            <p className="text-xs text-zinc-400">
              Completa el formulario y te abrirá la conversación en WhatsApp con el mensaje estructurado.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Motivo de la Consulta
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-white transition-colors"
                >
                  <option value="Consulta sobre disponibilidad de Gorra">Disponibilidad de Gorra</option>
                  <option value="Consulta sobre tallas de Sneakers">Tallas de Tenis / Sneakers</option>
                  <option value="Cotización de Envío">Cotización y envíos a mi ciudad</option>
                  <option value="Pedido Especial o Mayoreo">Pedido especial o mayoreo</option>
                  <option value="Otro asunto">Otro asunto</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Mensaje
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe aquí los detalles de tu consulta..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Consulta por WhatsApp</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
