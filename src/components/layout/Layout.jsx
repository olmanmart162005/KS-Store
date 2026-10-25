import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MiniCartDrawer } from './MiniCartDrawer';
import { Toast } from '../ui/Toast';

// Memoria ligera en RAM para no bloquear el scroll del navegador
const scrollMemory = new Map();

export const Layout = () => {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Guardar posición de scroll en memoria sin bloquear el hilo principal
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/producto/')) return;

    const handleScroll = () => {
      scrollMemory.set(currentPath, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Cambiar posición únicamente cuando cambia la ruta (pathname)
  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    if (currentPath === prevPath) return;

    const isEnteringProduct = currentPath.startsWith('/producto/');
    const isLeavingProduct = prevPath.startsWith('/producto/') && !isEnteringProduct;

    if (isEnteringProduct) {
      window.scrollTo(0, 0);
    } else if (isLeavingProduct && scrollMemory.has(currentPath)) {
      const savedY = scrollMemory.get(currentPath) || 0;
      requestAnimationFrame(() => {
        window.scrollTo(0, savedY);
      });
    } else {
      window.scrollTo(0, 0);
    }

    prevPathRef.current = currentPath;
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />
      <MiniCartDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  );
};
