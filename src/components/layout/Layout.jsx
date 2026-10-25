import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MiniCartDrawer } from './MiniCartDrawer';
import { Toast } from '../ui/Toast';

export const Layout = () => {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname + location.search);

  // Guardar posición exacta de scroll mientras navega por el catálogo/inicio
  useEffect(() => {
    const currentKey = `ks_scroll_${location.pathname}${location.search}`;
    const isProductPage = location.pathname.startsWith('/producto/');

    if (!isProductPage) {
      const handleScroll = () => {
        try {
          sessionStorage.setItem(currentKey, String(window.scrollY));
        } catch {
          // ignore
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [location.pathname, location.search]);

  // Restaurar posición instantáneamente al salir de un producto, o ir arriba sin animación al entrar
  useEffect(() => {
    const currentFull = location.pathname + location.search;
    const prevFull = prevPathRef.current;
    const isEnteringProduct = location.pathname.startsWith('/producto/');
    const isLeavingProduct = prevFull.startsWith('/producto/') && !isEnteringProduct;

    if (isEnteringProduct) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } else if (isLeavingProduct) {
      try {
        const savedScroll = sessionStorage.getItem(`ks_scroll_${currentFull}`);
        if (savedScroll !== null) {
          const targetY = parseInt(savedScroll, 10) || 0;
          requestAnimationFrame(() => {
            window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
          });
        }
      } catch {
        // ignore
      }
    } else if (currentFull !== prevFull) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    prevPathRef.current = currentFull;
  }, [location.pathname, location.search]);

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
