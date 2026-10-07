import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setEmail('admin@ksstore.com');
    setPassword('ksstore2026');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Luces sutiles de fondo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10 space-y-6 relative z-10 shadow-2xl">
        
        {/* Logo y Encabezado */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto p-2 shadow-lg">
            <img src="/images/logo/logo.png" alt="KS Store" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-heading">
              Panel Administrativo
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Acceso exclusivo para gestión de catálogo de KS Store
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ksstore.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Ingresar al Panel</span>
              </>
            )}
          </button>
        </form>

        {/* Acceso Rápido para Desarrollo / Administrador */}
        <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-300">Credenciales por defecto:</span>
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-white hover:underline font-bold"
            >
              Autocompletar
            </button>
          </div>
          <p className="font-mono text-zinc-400">admin@ksstore.com / ksstore2026</p>
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
            ← Volver a la Tienda
          </Link>
        </div>

      </div>
    </div>
  );
};
