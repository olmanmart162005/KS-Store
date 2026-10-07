import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Store, 
  MessageSquare, 
  MapPin, 
  Clock, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { InstagramIcon } from '../../components/ui/SocialIcons';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';

export const SettingsAdmin = () => {
  const { settings, updateSettings } = useProducts();
  const { showToast } = useCart();

  const [formData, setFormData] = useState({
    store_name: settings.store_name || 'KS Store',
    tagline: settings.tagline || 'Estilo que te representa.',
    whatsapp_number: settings.whatsapp_number || '88761389',
    instagram_url: settings.instagram_url || 'https://www.instagram.com/ks.store_hn',
    facebook_url: '',
    address: settings.address || 'Honduras',
    schedule: settings.schedule || 'Lunes a Sábado: 9:00 AM - 7:00 PM',
    hero_title: settings.hero_title || 'ESTILO URBANO EXCLUSIVO',
    hero_subtitle: settings.hero_subtitle || 'Colección exclusiva de gorras de diseñador, sneakers y moda urbana de alto impacto.',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateSettings(formData);
    setSaving(false);
    showToast('Configuraciones de tienda guardadas');
  };

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>Panel de Configuración</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          Ajustes Generales de la Tienda
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Modifica canales de contacto, redes sociales, textos del Hero y parámetros de la tienda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-6 shadow-xl">
        
        {/* Identidad */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-zinc-400" />
            Identidad de Marca
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                Nombre de la Tienda
              </label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                Lema / Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
              />
            </div>
          </div>
        </div>

        <hr className="border-zinc-800" />

        {/* Contacto & WhatsApp */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Canales de Pedido & WhatsApp
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                Número de WhatsApp (Honduras)
              </label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                required
                placeholder="88761389"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Formato hondureño de 8 dígitos. La app antepone automáticamente +504.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
                Dirección / Ubicación
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1 flex items-center gap-1.5">
              <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
              Enlace de Instagram Oficial
            </label>
            <input
              type="url"
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://www.instagram.com/ks.store_hn"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
            />
          </div>
        </div>

        <hr className="border-zinc-800" />

        {/* Textos del Hero */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            Contenido del Hero Principal
          </h2>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 uppercase block mb-1">
              Subtítulo / Descripción del Hero
            </label>
            <textarea
              rows={3}
              value={formData.hero_subtitle}
              onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white resize-none"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-white/5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Configuraciones'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
