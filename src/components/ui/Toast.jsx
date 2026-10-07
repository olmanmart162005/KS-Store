import React from 'react';
import { useCart } from '../../context/CartContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toastMessage, setToastMessage } = useCart();

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium backdrop-blur-md transition-all ${
        type === 'error'
          ? 'bg-rose-950/90 text-rose-200 border-rose-800'
          : type === 'info'
          ? 'bg-zinc-900/95 text-zinc-200 border-zinc-700'
          : 'bg-zinc-900/95 text-white border-zinc-700 shadow-zinc-950/50'
      }`}>
        {type === 'error' ? (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        ) : type === 'info' ? (
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        )}
        <span>{message}</span>
        <button
          onClick={() => setToastMessage(null)}
          className="ml-2 text-zinc-400 hover:text-white transition-colors p-1"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
