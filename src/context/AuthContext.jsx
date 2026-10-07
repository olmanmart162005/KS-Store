import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext(null);

const STORAGE_AUTH_KEY = 'ks_admin_auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: 'admin',
          });
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser = {
            id: session.user.id,
            email: session.user.email,
            role: 'admin',
          };
          setUser(authUser);
          localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(authUser));
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_AUTH_KEY);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Inicio de sesión para administradores
   */
  const login = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Credenciales inválidas en Supabase');
      }

      const adminUser = {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
      };
      setUser(adminUser);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(adminUser));
      return adminUser;
    }

    // Modo Standalone / Demo: Acceso administrativo directo garantizado
    const cleanEmail = email.toLowerCase().trim();
    if (
      (cleanEmail === 'admin@ksstore.com' || cleanEmail === 'admin') &&
      (password === 'ksstore2026' || password === 'admin123' || password === 'admin')
    ) {
      const demoUser = {
        id: 'ks-admin-master',
        email: 'admin@ksstore.com',
        role: 'admin',
      };
      setUser(demoUser);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(demoUser));
      return demoUser;
    } else {
      throw new Error('Credenciales incorrectas. (Correo: admin@ksstore.com | Clave: ksstore2026)');
    }
  };

  /**
   * Cierre de sesión
   */
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
    }
    setUser(null);
    localStorage.removeItem(STORAGE_AUTH_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: Boolean(user),
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
