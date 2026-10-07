import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'ks_store_cart';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error al leer el carrito desde localStorage', e);
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Guardar cambios en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error al guardar el carrito en localStorage', e);
    }
  }, [cart]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  /**
   * Agrega un producto al carrito
   */
  const addToCart = (product, { size = '', color = '', quantity = 1 } = {}) => {
    const qty = Math.max(1, Number(quantity) || 1);
    const itemKey = `${product.id}__${size || 'default'}__${color || 'default'}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.key === itemKey);

      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingIndex];
        const maxStock = product.stock || 99;
        const newQty = Math.min(existingItem.quantity + qty, maxStock);

        updatedCart[existingIndex] = {
          ...existingItem,
          quantity: newQty,
        };
        return updatedCart;
      } else {
        const newItem = {
          key: itemKey,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          brand: product.brand,
          category: product.category,
          price: Number(product.price),
          compare_price: product.compare_price ? Number(product.compare_price) : null,
          main_image: product.main_image,
          size: size || (product.sizes?.[0] || 'Unitalla'),
          color: color || (product.colors?.[0] || ''),
          quantity: qty,
          maxStock: product.stock || 99,
        };
        return [...prevCart, newItem];
      }
    });

    showToast(`"${product.name}" agregado al carrito`);
  };

  /**
   * Actualiza la cantidad de un ítem
   */
  const updateQuantity = (itemKey, newQuantity) => {
    if (newQuantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.key === itemKey) {
          const validQty = Math.min(newQuantity, item.maxStock || 99);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  /**
   * Elimina un ítem del carrito
   */
  const removeFromCart = (itemKey) => {
    setCart((prevCart) => {
      const itemToRemove = prevCart.find((i) => i.key === itemKey);
      if (itemToRemove) {
        showToast(`"${itemToRemove.name}" eliminado del carrito`, 'info');
      }
      return prevCart.filter((item) => item.key !== itemKey);
    });
  };

  /**
   * Vacía el carrito
   */
  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        isDrawerOpen,
        setIsDrawerOpen,
        toastMessage,
        setToastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
