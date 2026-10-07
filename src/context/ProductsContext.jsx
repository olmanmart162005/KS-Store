import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialProducts, initialCategories, initialSettings } from '../data/initialProducts';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const ProductsContext = createContext(null);

const STORAGE_PRODUCTS_KEY = 'ks_store_custom_products';
const STORAGE_SETTINGS_KEY = 'ks_store_custom_settings';

export const ProductsProvider = ({ children }) => {
  // Inicialización de productos
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      return stored ? JSON.parse(stored) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  // Inicialización de categorías
  const [categories, setCategories] = useState(initialCategories);

  // Inicialización de configuración de tienda
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sincronización con Supabase si está configurado
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const fetchSupabaseData = async () => {
      setLoading(true);
      try {
        // Cargar productos
        const { data: dbProducts, error: pError } = await supabase
          .from('products')
          .select(`
            *,
            categories (name, slug),
            product_images (image_url),
            product_sizes (size),
            product_colors (color_name)
          `);

        if (!pError && dbProducts && dbProducts.length > 0) {
          const formatted = dbProducts.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            brand: p.brand,
            category: p.categories?.slug || 'gorras',
            category_name: p.categories?.name || 'Gorras',
            sku: p.sku,
            price: Number(p.price),
            compare_price: p.compare_price ? Number(p.compare_price) : null,
            stock: Number(p.stock),
            status: p.status,
            featured: Boolean(p.featured),
            is_new: Boolean(p.is_new),
            is_sale: Boolean(p.is_sale),
            description: p.description,
            main_image: p.main_image,
            gallery: p.product_images?.length > 0 
              ? p.product_images.map(img => img.image_url) 
              : [p.main_image],
            sizes: p.product_sizes?.length > 0 
              ? p.product_sizes.map(s => s.size) 
              : (p.categories?.slug === 'tenis' || p.sku?.startsWith('KS-T') 
                  ? ['38', '39', '40', '41', '42', '43'] 
                  : ['Unitalla']),
            colors: p.product_colors?.length > 0 
              ? p.product_colors.map(c => c.color_name) 
              : (initialProducts.find(ip => ip.sku === p.sku)?.colors || ['Negro'])
          }));
          setProducts(formatted);
        }

        // Cargar categorías
        const { data: dbCats, error: cError } = await supabase
          .from('categories')
          .select('*')
          .order('order_index');

        if (!cError && dbCats && dbCats.length > 0) {
          setCategories(dbCats);
        }

        // Cargar configuración
        const { data: dbSettings, error: sError } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .single();

        if (!sError && dbSettings) {
          setSettings({
            ...dbSettings,
            whatsapp_number: (!dbSettings.whatsapp_number || dbSettings.whatsapp_number === '89692971')
              ? (import.meta.env.VITE_WHATSAPP_NUMBER || '88761389')
              : dbSettings.whatsapp_number,
            instagram_url: (!dbSettings.instagram_url || dbSettings.instagram_url === 'https://instagram.com/ksstore')
              ? (import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/ks.store_hn')
              : dbSettings.instagram_url,
            facebook_url: ''
          });
        }
      } catch (err) {
        console.warn('Usando catálogo local (Supabase no accesible aún):', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupabaseData();
  }, []);

  // Persistir cambios locales para respaldo
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  /**
   * Agregar nuevo producto
   */
  const addProduct = async (productData) => {
    const slug = productData.slug || productData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const newProduct = {
      ...productData,
      id: productData.id || `prod-${Date.now()}`,
      slug,
      price: Number(productData.price) || 0,
      compare_price: productData.compare_price ? Number(productData.compare_price) : null,
      stock: Number(productData.stock) || 1,
      gallery: productData.gallery?.length > 0 ? productData.gallery : [productData.main_image],
      status: productData.status || 'available',
      featured: Boolean(productData.featured),
      is_new: Boolean(productData.is_new),
      is_sale: Boolean(productData.is_sale),
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Si Supabase está configurado, guardar también en base de datos
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').insert({
          name: newProduct.name,
          slug: newProduct.slug,
          description: newProduct.description,
          brand: newProduct.brand,
          sku: newProduct.sku,
          price: newProduct.price,
          compare_price: newProduct.compare_price,
          stock: newProduct.stock,
          status: newProduct.status,
          featured: newProduct.featured,
          is_new: newProduct.is_new,
          is_sale: newProduct.is_sale,
          main_image: newProduct.main_image,
        });
      } catch (err) {
        console.error('Error insertando en Supabase:', err);
      }
    }

    return newProduct;
  };

  /**
   * Actualizar producto existente
   */
  const updateProduct = async (id, updatedFields) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            ...updatedFields,
            price: updatedFields.price !== undefined ? Number(updatedFields.price) : p.price,
            compare_price: updatedFields.compare_price !== undefined ? (updatedFields.compare_price ? Number(updatedFields.compare_price) : null) : p.compare_price,
            stock: updatedFields.stock !== undefined ? Number(updatedFields.stock) : p.stock,
          };
        }
        return p;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').update(updatedFields).eq('id', id);
      } catch (err) {
        console.error('Error actualizando en Supabase:', err);
      }
    }
  };

  /**
   * Eliminar producto
   */
  const deleteProduct = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.error('Error eliminando en Supabase:', err);
      }
    }
  };

  /**
   * Duplicar producto
   */
  const duplicateProduct = async (id) => {
    const original = products.find((p) => p.id === id);
    if (!original) return;

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const duplicated = {
      ...original,
      id: `prod-${Date.now()}`,
      name: `${original.name} (Copia)`,
      slug: `${original.slug}-copia-${randomSuffix}`,
      sku: `${original.sku}-C${randomSuffix}`,
    };

    setProducts((prev) => [duplicated, ...prev]);
    return duplicated;
  };

  /**
   * Alternar estado destacado
   */
  const toggleFeatured = (id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
    );
  };

  /**
   * Actualizar configuración general
   */
  const updateSettings = async (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('store_settings').upsert({
          id: '44444444-4444-4444-4444-444444444444',
          ...newSettings,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error actualizando settings en Supabase:', err);
      }
    }
  };

  /**
   * Subida de imágenes (Supabase Storage con fallback DataURL)
   */
  const uploadImage = async (file) => {
    if (!file) return null;

    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          return data.publicUrl;
        }
      } catch (e) {
        console.warn('Fallback a almacenamiento local para imagen:', e);
      }
    }

    // Fallback: FileReader Base64 Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        categories,
        settings,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        toggleFeatured,
        updateSettings,
        uploadImage,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts debe ser usado dentro de un ProductsProvider');
  }
  return context;
};
