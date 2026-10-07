import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { AuthProvider } from './context/AuthContext';

// Layouts
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

// Páginas Públicas
import { Home } from './pages/public/Home';
import { Catalog } from './pages/public/Catalog';
import { ProductDetail } from './pages/public/ProductDetail';
import { Cart } from './pages/public/Cart';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';

// Páginas Administrativas
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { ProductsAdmin } from './pages/admin/ProductsAdmin';
import { GorrasAdmin } from './pages/admin/GorrasAdmin';
import { TenisAdmin } from './pages/admin/TenisAdmin';
import { SettingsAdmin } from './pages/admin/SettingsAdmin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <Routes>
              {/* Rutas Públicas de la Tienda */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="catalogo" element={<Catalog />} />
                <Route path="gorras" element={<Catalog initialCategory="gorras" />} />
                <Route path="tenis" element={<Catalog initialCategory="tenis" />} />
                <Route path="producto/:slug" element={<ProductDetail />} />
                <Route path="carrito" element={<Cart />} />
                <Route path="nosotros" element={<About />} />
                <Route path="contacto" element={<Contact />} />
              </Route>

              {/* Autenticación de Administrador */}
              <Route path="/admin/login" element={<Login />} />

              {/* Panel Administrativo Protegido */}
              <Route path="/admin" element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="productos" element={<ProductsAdmin />} />
                  <Route path="gorras" element={<GorrasAdmin />} />
                  <Route path="tenis" element={<TenisAdmin />} />
                  <Route path="configuracion" element={<SettingsAdmin />} />
                </Route>
              </Route>

              {/* Ruta comodín / Redirección */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
