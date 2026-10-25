import React, { createContext, useContext, useState, useEffect } from 'react';
import { useProducts } from './ProductsContext';

const CartContext = createContext(null);

const STORAGE_KEY = 'ks_store_cart';

export const CartProvider = ({ children }) => {
  const { products } = useProducts();

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
  const [priceUpdateNotice, setPriceUpdateNotice] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Sincronizar los ítems del carrito con los precios, nombres e imágenes actuales del catálogo
  useEffect(() => {
    if (!products || products.length === 0 || cart.length === 0) return;

    let priceChanged = false;
    const changedItems = [];

    const syncedCart = cart.map((item) => {
      const liveProduct = products.find(
        (p) => p.id === item.productId || (p.sku && p.sku === item.sku) || (p.slug && p.slug === item.slug)
      );

      if (!liveProduct) return item;

      const livePrice = Number(liveProduct.price);
      if (livePrice !== Number(item.price)) {
        priceChanged = true;
        changedItems.push({
          name: liveProduct.name,
          oldPrice: item.price,
          newPrice: livePrice,
        });
      }

      return {
        ...item,
        productId: liveProduct.id,
        name: liveProduct.name,
        slug: liveProduct.slug,
        sku: liveProduct.sku,
        brand: liveProduct.brand,
        category: liveProduct.category,
        price: livePrice,
        compare_price: liveProduct.compare_price ? Number(liveProduct.compare_price) : null,
        main_image: liveProduct.main_image,
        maxStock: liveProduct.stock ?? 99,
      };
    });

    const hasDifferences = JSON.stringify(syncedCart) !== JSON.stringify(cart);
    if (hasDifferences) {
      setCart(syncedCart);
      if (priceChanged && changedItems.length > 0) {
        const msg = `El precio de "${changedItems[0].name}" se actualizó en el catálogo y tu resumen ha sido sincronizado.`;
        setPriceUpdateNotice(msg);
        showToast(msg, 'info');
      }
    }
  }, [products]);

  // Guardar cambios en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error al guardar el carrito en localStorage', e);
    }
  }, [cart]);

  /**
   * Agrega un producto al carrito utilizando los datos actuales confirmados
   */
  const addToCart = (product, { size = '', color = '', quantity = 1 } = {}) => {
    const qty = Math.max(1, Number(quantity) || 1);
    const chosenSize = size || product.sizes?.[0] || 'Unitalla';
    const chosenColor = color || product.colors?.[0] || '';
    const itemKey = `${product.id}__${chosenSize || 'default'}__${chosenColor || 'default'}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.key === itemKey);

      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingIndex];
        const maxStock = product.stock || 99;
        const newQty = Math.min(existingItem.quantity + qty, maxStock);

        updatedCart[existingIndex] = {
          ...existingItem,
          name: product.name,
          price: Number(product.price),
          main_image: product.main_image,
          quantity: newQty,
          maxStock,
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
          size: chosenSize,
          color: chosenColor,
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
    setPriceUpdateNotice(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

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
        priceUpdateNotice,
        setPriceUpdateNotice,
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
