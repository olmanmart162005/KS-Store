import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext(null);

const STORAGE_AUTH_KEY = 'ks_admin_auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSupabaseSession, setHasSupabaseSession] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser = {
            id: session.user.id,
            email: session.user.email,
            role: 'admin',
            isSupabaseSession: true,
          };
          setUser(authUser);
          setHasSupabaseSession(true);
          localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(authUser));
        } else {
          // Si no hay sesión real en Supabase, limpiamos cualquier sesión simulada obsoleta
          setUser(null);
          setHasSupabaseSession(false);
          localStorage.removeItem(STORAGE_AUTH_KEY);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser = {
            id: session.user.id,
            email: session.user.email,
            role: 'admin',
            isSupabaseSession: true,
          };
          setUser(authUser);
          setHasSupabaseSession(true);
          localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(authUser));
        } else {
          setUser(null);
          setHasSupabaseSession(false);
          localStorage.removeItem(STORAGE_AUTH_KEY);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Modo puramente local cuando no existe instancia de Supabase configurada
      try {
        const stored = localStorage.getItem(STORAGE_AUTH_KEY);
        if (stored) setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
      setLoading(false);
    }
  }, []);

  /**
   * Inicio de sesión para administradores (autenticación real con Supabase Auth)
   */
  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message?.includes('Email not confirmed')) {
          throw new Error(
            'Tu correo aún no está confirmado en Supabase. Ejecuta el script SQL de migración en Supabase SQL Editor para activarlo.'
          );
        }
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error(
            'Correo o contraseña incorrectos. Asegúrate de ingresar con tu cuenta administradora de Supabase (ej. sauladmin@ksstore.org).'
          );
        }
        throw new Error(error.message || 'No se pudo iniciar sesión en Supabase.');
      }

      const adminUser = {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
        isSupabaseSession: true,
      };

      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          role: 'admin',
        });
      } catch {
        // Ignorar si la política ya tiene el registro
      }

      setUser(adminUser);
      setHasSupabaseSession(true);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(adminUser));
      return adminUser;
    }

    // Fallback exclusivo cuando Supabase NO está configurado en el entorno
    if (
      (cleanEmail === 'admin@ksstore.com' || cleanEmail === 'sauladmin@ksstore.org') &&
      (password === 'ksstore2026' || password === 'admin123')
    ) {
      const demoUser = {
        id: 'ks-admin-local',
        email: cleanEmail,
        role: 'admin',
        isSupabaseSession: false,
      };
      setUser(demoUser);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(demoUser));
      return demoUser;
    } else {
      throw new Error('Credenciales incorrectas.');
    }
  };

  /**
   * Cierre de sesión seguro
   */
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error al cerrar sesión en Supabase:', e);
      }
    }
    setUser(null);
    setHasSupabaseSession(false);
    localStorage.removeItem(STORAGE_AUTH_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: Boolean(user),
        hasSupabaseSession,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
