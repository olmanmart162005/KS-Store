import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { initialProducts, initialCategories, initialSettings } from '../data/initialProducts';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const ProductsContext = createContext(null);

const STORAGE_PRODUCTS_KEY = 'ks_store_custom_products';
const STORAGE_SETTINGS_KEY = 'ks_store_custom_settings';
const STORAGE_CATEGORIES_KEY = 'ks_store_custom_categories';
const STORAGE_ORDERS_KEY = 'ks_store_orders_history';
const STORAGE_DELETED_SKUS_KEY = 'ks_store_deleted_skus';

const CATEGORY_UUID_MAP = {
  gorras: '11111111-1111-1111-1111-111111111111',
  tenis: '22222222-2222-2222-2222-222222222222',
  'moda-urbana': '33333333-3333-3333-3333-333333333333',
};

const isUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const arraysEqual = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (String(a[i]).trim() !== String(b[i]).trim()) return false;
  }
  return true;
};

/**
 * Comprime y optimiza una imagen en el navegador antes de subirla a Supabase Storage
 * para eliminar el lag de subida y renderizado sin perder nitidez visual.
 */
const optimizeImageFile = (file, maxDimension = 1280, quality = 0.85) => {
  return new Promise((resolve) => {
    if (
      typeof window === 'undefined' ||
      !file ||
      !file.type.startsWith('image/') ||
      file.type === 'image/gif' ||
      file.size < 180 * 1024
    ) {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension && file.size < 350 * 1024) {
        resolve(file);
        return;
      }

      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const outputMime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
      const outputExt = outputMime === 'image/webp' ? 'webp' : 'jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const optimizedFile = new File([blob], `${baseName}.${outputExt}`, {
            type: outputMime,
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      return stored ? JSON.parse(stored) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ORDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);

  // Referencias estables para evitar bucles de re-ejecución y tormentas de Realtime
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const lastLocalMutationRef = useRef(0);
  const realtimeTimerRef = useRef(null);

  /**
   * Formatea un registro crudo de Supabase al modelo unificado del catálogo
   * (Referencia 100% estable para evitar re-renders innecesarios)
   */
  const formatDbProduct = useCallback((p, dbCats) => {
    const catsList = Array.isArray(dbCats) && dbCats.length > 0 ? dbCats : categoriesRef.current;
    const matchedCat =
      p.categories ||
      catsList.find((c) => c.id === p.category_id) ||
      (p.sku?.startsWith('KS-T')
        ? { slug: 'tenis', name: 'Tenis' }
        : { slug: 'gorras', name: 'Gorras' });

    const catSlug = matchedCat?.slug || 'gorras';
    const catName =
      matchedCat?.name ||
      (catSlug === 'tenis' ? 'Tenis' : catSlug === 'moda-urbana' ? 'Moda Urbana' : 'Gorras');

    const sortedImages = Array.isArray(p.product_images)
      ? [...p.product_images]
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map((img) => img.image_url)
          .filter(Boolean)
      : [];

    const gallery =
      sortedImages.length > 0
        ? Array.from(new Set([p.main_image, ...sortedImages].filter(Boolean)))
        : [p.main_image].filter(Boolean);

    const dbSizes = Array.isArray(p.product_sizes)
      ? p.product_sizes.map((s) => s.size).filter(Boolean)
      : [];

    const dbColors = Array.isArray(p.product_colors)
      ? p.product_colors.map((c) => c.color_name).filter(Boolean)
      : [];

    const seedFallback = initialProducts.find((ip) => ip.sku === p.sku || ip.slug === p.slug);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand || 'KS Exclusive',
      model: p.model || p.attributes?.model || seedFallback?.model || '',
      attributes: p.attributes || seedFallback?.attributes || {},
      category: catSlug,
      category_id: p.category_id || CATEGORY_UUID_MAP[catSlug] || CATEGORY_UUID_MAP.gorras,
      category_name: catName,
      sku: p.sku || '',
      price: Number(p.price) || 0,
      compare_price:
        p.compare_price !== null && p.compare_price !== undefined && Number(p.compare_price) > 0
          ? Number(p.compare_price)
          : null,
      stock: Number(p.stock ?? 0),
      status: p.status || (Number(p.stock ?? 0) === 0 ? 'sold_out' : 'available'),
      featured: Boolean(p.featured),
      is_new: Boolean(p.is_new),
      is_sale: Boolean(p.is_sale),
      description: p.description || '',
      main_image: p.main_image,
      gallery: gallery.length > 0 ? gallery : seedFallback?.gallery || [p.main_image],
      sizes:
        dbSizes.length > 0
          ? dbSizes
          : seedFallback?.sizes ||
            (catSlug === 'tenis' ? ['38', '39', '40', '41', '42', '43'] : ['Ajustable / Unitalla']),
      colors: dbColors.length > 0 ? dbColors : seedFallback?.colors || ['Negro'],
      created_at: p.created_at || null,
      updated_at: p.updated_at || p.created_at || null,
    };
  }, []);

  /**
   * Consulta principal desde Supabase en paralelo (Fuente de verdad permanente, sin zombies ni lag)
   */
  const fetchSupabaseData = useCallback(async (silent = false) => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setSyncError(null);

    try {
      // Ejecutar las 4 consultas en paralelo para máxima velocidad
      const [catsRes, productsRes, settingsRes, ordersRes] = await Promise.all([
        supabase.from('categories').select('*').order('order_index', { ascending: true }),
        supabase
          .from('products')
          .select(`
            *,
            categories (id, name, slug),
            product_images (image_url, order_index),
            product_sizes (size, stock),
            product_colors (color_name)
          `)
          .order('created_at', { ascending: true }),
        supabase.from('store_settings').select('*').limit(1).maybeSingle(),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);

      let activeCats = categoriesRef.current || initialCategories;
      if (!catsRes.error && Array.isArray(catsRes.data) && catsRes.data.length > 0) {
        activeCats = catsRes.data;
        categoriesRef.current = catsRes.data;
        setCategories(catsRes.data);
        try {
          localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(catsRes.data));
        } catch {
          // ignore
        }
      }

      if (productsRes.error) {
        throw productsRes.error;
      }

      if (Array.isArray(productsRes.data)) {
        // La base de datos es la única fuente de verdad (no re-inyectar productos eliminados)
        let deletedSkus = new Set();
        try {
          const rawDeleted = localStorage.getItem(STORAGE_DELETED_SKUS_KEY);
          if (rawDeleted) {
            deletedSkus = new Set(JSON.parse(rawDeleted));
          }
        } catch {
          // ignore
        }

        const formatted = productsRes.data
          .map((p) => formatDbProduct(p, activeCats))
          .filter((p) => !deletedSkus.has(p.sku) && !deletedSkus.has(p.id));

        setProducts(formatted);
        try {
          localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(formatted));
        } catch {
          // ignore
        }
      }

      if (!settingsRes.error && settingsRes.data) {
        const dbSettings = settingsRes.data;
        const normalizedSettings = {
          ...dbSettings,
          whatsapp_number:
            !dbSettings.whatsapp_number || dbSettings.whatsapp_number === '89692971'
              ? import.meta.env.VITE_WHATSAPP_NUMBER || '88761389'
              : dbSettings.whatsapp_number,
          instagram_url:
            !dbSettings.instagram_url || dbSettings.instagram_url === 'https://instagram.com/ksstore'
              ? import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/ks.store_hn'
              : dbSettings.instagram_url,
          facebook_url: dbSettings.facebook_url || '',
        };
        setSettings(normalizedSettings);
        try {
          localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(normalizedSettings));
        } catch {
          // ignore
        }
      }

      if (!ordersRes.error && Array.isArray(ordersRes.data)) {
        const dbOrders = ordersRes.data;
        setOrders((prev) => {
          const dbCodes = new Set(dbOrders.map((o) => o.order_code));
          const localOnly = prev.filter((lo) => lo.order_code && !dbCodes.has(lo.order_code));
          const merged = [...dbOrders, ...localOnly].sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
          );
          try {
            localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      }
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err);
      setSyncError(err.message || 'Error al sincronizar con la base de datos.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [formatDbProduct]);

  // Carga inicial y suscripción en tiempo real a cambios externos en Supabase (con debounce anti-lag)
  useEffect(() => {
    fetchSupabaseData(false);

    if (!isSupabaseConfigured || !supabase) return;

    const scheduleSilentSync = (isProductEvent = false) => {
      // Si el cambio fue originado hace menos de 3 segundos por nuestra propia sesión, evitar recarga redundante
      if (isProductEvent && Date.now() - lastLocalMutationRef.current < 3000) {
        return;
      }
      if (realtimeTimerRef.current) {
        clearTimeout(realtimeTimerRef.current);
      }
      realtimeTimerRef.current = setTimeout(() => {
        fetchSupabaseData(true);
      }, 650);
    };

    const channel = supabase
      .channel('ks-store-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        scheduleSilentSync(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        scheduleSilentSync(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
        scheduleSilentSync(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        scheduleSilentSync(false);
      })
      .subscribe();

    return () => {
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchSupabaseData]);

  /**
   * Resuelve el UUID real de una categoría a partir de su slug o id
   */
  const resolveCategoryId = (categorySlugOrId) => {
    if (isUUID(categorySlugOrId)) return categorySlugOrId;
    const found = categories.find(
      (c) => c.slug === categorySlugOrId || c.id === categorySlugOrId
    );
    if (found && isUUID(found.id)) return found.id;
    return CATEGORY_UUID_MAP[categorySlugOrId] || CATEGORY_UUID_MAP.gorras;
  };

  /**
   * Genera el siguiente código SKU disponible automáticamente (ej. KS-T009 o KS-G044)
   */
  const generateNextSku = useCallback(
    (categorySlug = 'gorras') => {
      const prefix = categorySlug === 'tenis' ? 'KS-T' : 'KS-G';
      const existingNums = products
        .map((p) => {
          const sku = String(p.sku || '').toUpperCase();
          if (!sku.startsWith(prefix)) return 0;
          const numPart = parseInt(sku.slice(prefix.length).replace(/\D/g, ''), 10);
          return Number.isFinite(numPart) ? numPart : 0;
        })
        .filter((n) => n > 0 && n < 9000);

      const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
      const existingSet = new Set(products.map((p) => String(p.sku || '').toUpperCase()));

      let nextNum = maxNum + 1;
      let candidate = `${prefix}${String(nextNum).padStart(3, '0')}`;
      while (existingSet.has(candidate)) {
        nextNum++;
        candidate = `${prefix}${String(nextNum).padStart(3, '0')}`;
      }
      return candidate;
    },
    [products]
  );

  /**
   * Sincroniza tablas hijas (tallas, colores, galería) en PARALELO para eliminar el lag
   */
  const syncProductRelations = async (productId, { sizes, colors, gallery }) => {
    if (!isSupabaseConfigured || !supabase || !isUUID(productId)) return;

    const tasks = [];

    // 1. Tallas
    if (Array.isArray(sizes)) {
      tasks.push(
        (async () => {
          await supabase.from('product_sizes').delete().eq('product_id', productId);
          const cleanSizes = sizes.map((s) => String(s).trim()).filter(Boolean);
          if (cleanSizes.length > 0) {
            await supabase.from('product_sizes').insert(
              cleanSizes.map((size) => ({
                product_id: productId,
                size,
                stock: 5,
              }))
            );
          }
        })()
      );
    }

    // 2. Colores
    if (Array.isArray(colors)) {
      tasks.push(
        (async () => {
          await supabase.from('product_colors').delete().eq('product_id', productId);
          const cleanColors = colors.map((c) => String(c).trim()).filter(Boolean);
          if (cleanColors.length > 0) {
            await supabase.from('product_colors').insert(
              cleanColors.map((color_name) => ({
                product_id: productId,
                color_name,
              }))
            );
          }
        })()
      );
    }

    // 3. Galería de imágenes
    if (Array.isArray(gallery)) {
      tasks.push(
        (async () => {
          await supabase.from('product_images').delete().eq('product_id', productId);
          const cleanGallery = gallery.map((img) => String(img).trim()).filter(Boolean);
          if (cleanGallery.length > 0) {
            await supabase.from('product_images').insert(
              cleanGallery.map((image_url, idx) => ({
                product_id: productId,
                image_url,
                order_index: idx,
              }))
            );
          }
        })()
      );
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  };

  /**
   * Verifica que exista una sesión autenticada en Supabase antes de escribir
   */
  const ensureAuthenticatedForWrite = async () => {
    if (!isSupabaseConfigured || !supabase) return true;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error(
        'Tu sesión de administrador no está autenticada en Supabase. Cierra sesión e ingresa con tu correo y contraseña de Supabase (sauladmin@ksstore.org) para guardar cambios permanentes.'
      );
    }
    return true;
  };

  /**
   * CREAR PRODUCTO (Guarda primero en Supabase en paralelo y actualiza el estado al instante)
   */
  const addProduct = async (productData) => {
    const baseSlug = (productData.slug || productData.name || 'producto')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slugExistente = products.some((p) => p.slug === baseSlug);
    const finalSlug = slugExistente ? `${baseSlug}-${Math.floor(100 + Math.random() * 900)}` : baseSlug;

    const rawInputSku = productData.sku?.trim();
    const skuCollision = rawInputSku && products.some((p) => p.sku?.toLowerCase() === rawInputSku.toLowerCase());
    const finalSku =
      !rawInputSku || skuCollision
        ? generateNextSku(productData.category || 'gorras')
        : rawInputSku;

    const price = Math.max(0, Number(productData.price) || 0);
    const compare_price =
      productData.compare_price !== '' &&
      productData.compare_price !== null &&
      productData.compare_price !== undefined &&
      Number(productData.compare_price) > 0
        ? Number(productData.compare_price)
        : null;
    const stock = Math.max(0, Number(productData.stock ?? 1));
    const status = productData.status || (stock === 0 ? 'sold_out' : 'available');
    const category_id = resolveCategoryId(productData.category || 'gorras');

    const defaultSizes =
      productData.category === 'tenis' ? '38, 39, 40, 41, 42, 43' : 'Ajustable / Unitalla';

    const sizesArray = Array.isArray(productData.sizes)
      ? productData.sizes
      : String(productData.sizes || defaultSizes)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    const colorsArray = Array.isArray(productData.colors)
      ? productData.colors
      : String(productData.colors || 'Negro')
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);

    const galleryArray =
      Array.isArray(productData.gallery) && productData.gallery.length > 0
        ? Array.from(new Set([productData.main_image, ...productData.gallery].filter(Boolean)))
        : [productData.main_image].filter(Boolean);

    if (isSupabaseConfigured && supabase) {
      await ensureAuthenticatedForWrite();
      lastLocalMutationRef.current = Date.now();

      const baseInsertPayload = {
        name: productData.name.trim(),
        slug: finalSlug,
        description: productData.description?.trim() || '',
        category_id,
        brand: productData.brand?.trim() || 'KS Exclusive',
        sku: finalSku,
        price,
        compare_price,
        stock,
        status,
        featured: Boolean(productData.featured),
        is_new: Boolean(productData.is_new),
        is_sale: Boolean(productData.is_sale),
        main_image: productData.main_image.trim(),
      };

      const extendedInsertPayload = {
        ...baseInsertPayload,
        model: productData.model?.trim() || '',
        attributes: productData.attributes || {},
      };

      let { data: insertedRow, error: insertError } = await supabase
        .from('products')
        .insert(extendedInsertPayload)
        .select('*, categories(id, name, slug)')
        .single();

      // Si la BD aún no tiene las columnas model/attributes, reintentar con el payload base
      if (insertError && (insertError.code === '42703' || insertError.message?.includes('column'))) {
        const retry = await supabase
          .from('products')
          .insert(baseInsertPayload)
          .select('*, categories(id, name, slug)')
          .single();
        insertedRow = retry.data;
        insertError = retry.error;
      }

      // Si hubo colisión de SKU/slug en BD, autogenerar sufijo único y reintentar una vez
      if (insertError && insertError.code === '23505') {
        const fallbackSku = `${finalSku}-${Math.floor(10 + Math.random() * 89)}`;
        const fallbackSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 899)}`;
        const retryUnique = await supabase
          .from('products')
          .insert({
            ...baseInsertPayload,
            sku: fallbackSku,
            slug: fallbackSlug,
          })
          .select('*, categories(id, name, slug)')
          .single();
        insertedRow = retryUnique.data;
        insertError = retryUnique.error;
      }

      if (insertError) {
        throw new Error(insertError.message || 'No se pudo guardar el producto en la base de datos.');
      }

      if (!insertedRow) {
        throw new Error(
          'La base de datos rechazó la creación del producto (verifica tus permisos de administrador en Supabase).'
        );
      }

      // Sincronizar tallas, colores y galería en paralelo
      try {
        await syncProductRelations(insertedRow.id, {
          sizes: sizesArray,
          colors: colorsArray,
          gallery: galleryArray,
        });
      } catch (relErr) {
        console.warn('Aviso al sincronizar atributos secundarios:', relErr);
      }

      lastLocalMutationRef.current = Date.now();

      const confirmedProduct = {
        ...formatDbProduct(insertedRow, categories),
        model: productData.model?.trim() || insertedRow.model || '',
        attributes: productData.attributes || insertedRow.attributes || {},
        sizes: sizesArray,
        colors: colorsArray,
        gallery: galleryArray,
      };

      setProducts((prev) => {
        const updated = [confirmedProduct, ...prev.filter((p) => p.id !== confirmedProduct.id)];
        try {
          localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      return confirmedProduct;
    }

    // Fallback sin Supabase
    const localProduct = {
      id: `prod-${Date.now()}`,
      name: productData.name.trim(),
      slug: finalSlug,
      brand: productData.brand?.trim() || 'KS Exclusive',
      model: productData.model || '',
      attributes: productData.attributes || {},
      category: productData.category || 'gorras',
      category_id,
      category_name:
        productData.category === 'tenis'
          ? 'Tenis'
          : productData.category === 'moda-urbana'
          ? 'Moda Urbana'
          : 'Gorras',
      sku: finalSku,
      price,
      compare_price,
      stock,
      status,
      featured: Boolean(productData.featured),
      is_new: Boolean(productData.is_new),
      is_sale: Boolean(productData.is_sale),
      description: productData.description?.trim() || '',
      main_image: productData.main_image.trim(),
      gallery: galleryArray,
      sizes: sizesArray,
      colors: colorsArray,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProducts((prev) => [localProduct, ...prev]);
    return localProduct;
  };

  /**
   * ACTUALIZAR PRODUCTO EXISTENTE (Ultra rápido: solo sincroniza tablas hijas si cambiaron)
   */
  const updateProduct = async (id, updatedFields) => {
    const existingProduct = products.find((p) => p.id === id);
    if (!existingProduct) {
      throw new Error('No se encontró el producto que intentas editar.');
    }

    // Construir objeto limpio únicamente con las columnas reales de la tabla `products`
    const dbUpdatePayload = {};

    if (updatedFields.name !== undefined) {
      dbUpdatePayload.name = updatedFields.name.trim();
    }
    if (updatedFields.slug !== undefined) {
      dbUpdatePayload.slug = updatedFields.slug.trim();
    }
    if (updatedFields.description !== undefined) {
      dbUpdatePayload.description = updatedFields.description;
    }
    if (updatedFields.brand !== undefined) {
      dbUpdatePayload.brand = updatedFields.brand.trim();
    }
    if (updatedFields.sku !== undefined) {
      dbUpdatePayload.sku = updatedFields.sku.trim();
    }
    if (updatedFields.price !== undefined) {
      const numPrice = Number(updatedFields.price);
      if (isNaN(numPrice) || numPrice < 0) {
        throw new Error('El precio debe ser un monto válido mayor o igual a 0.');
      }
      dbUpdatePayload.price = numPrice;
    }
    if (updatedFields.compare_price !== undefined) {
      dbUpdatePayload.compare_price =
        updatedFields.compare_price !== '' &&
        updatedFields.compare_price !== null &&
        Number(updatedFields.compare_price) > 0
          ? Number(updatedFields.compare_price)
          : null;
    }
    if (updatedFields.stock !== undefined) {
      const numStock = Math.max(0, Number(updatedFields.stock) || 0);
      dbUpdatePayload.stock = numStock;
    }
    if (updatedFields.status !== undefined) {
      dbUpdatePayload.status = updatedFields.status;
    }
    if (updatedFields.featured !== undefined) {
      dbUpdatePayload.featured = Boolean(updatedFields.featured);
    }
    if (updatedFields.is_new !== undefined) {
      dbUpdatePayload.is_new = Boolean(updatedFields.is_new);
    }
    if (updatedFields.is_sale !== undefined) {
      dbUpdatePayload.is_sale = Boolean(updatedFields.is_sale);
    }
    if (updatedFields.main_image !== undefined) {
      dbUpdatePayload.main_image = updatedFields.main_image.trim();
    }
    if (updatedFields.category !== undefined || updatedFields.category_id !== undefined) {
      dbUpdatePayload.category_id = resolveCategoryId(
        updatedFields.category_id || updatedFields.category
      );
    }
    dbUpdatePayload.updated_at = new Date().toISOString();

    const extendedUpdatePayload = { ...dbUpdatePayload };
    if (updatedFields.model !== undefined) {
      extendedUpdatePayload.model = updatedFields.model.trim();
    }
    if (updatedFields.attributes !== undefined) {
      extendedUpdatePayload.attributes = updatedFields.attributes;
    }

    const sizesArray =
      updatedFields.sizes !== undefined
        ? Array.isArray(updatedFields.sizes)
          ? updatedFields.sizes
          : String(updatedFields.sizes)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
        : existingProduct.sizes;

    const colorsArray =
      updatedFields.colors !== undefined
        ? Array.isArray(updatedFields.colors)
          ? updatedFields.colors
          : String(updatedFields.colors)
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean)
        : existingProduct.colors;

    const galleryArray =
      updatedFields.gallery !== undefined
        ? Array.isArray(updatedFields.gallery)
          ? updatedFields.gallery.filter(Boolean)
          : [dbUpdatePayload.main_image || existingProduct.main_image].filter(Boolean)
        : dbUpdatePayload.main_image && dbUpdatePayload.main_image !== existingProduct.main_image
        ? Array.from(
            new Set([
              dbUpdatePayload.main_image,
              ...(existingProduct.gallery || []).filter((img) => img !== existingProduct.main_image),
            ])
          )
        : existingProduct.gallery;

    if (isSupabaseConfigured && supabase) {
      await ensureAuthenticatedForWrite();
      lastLocalMutationRef.current = Date.now();

      let updatedRow = null;
      let updateError = null;

      // 1. Intentar actualizar por UUID si el id es UUID válido
      if (isUUID(id)) {
        const res = await supabase
          .from('products')
          .update(extendedUpdatePayload)
          .eq('id', id)
          .select('*, categories(id, name, slug)')
          .maybeSingle();

        updatedRow = res.data;
        updateError = res.error;

        if (updateError && (updateError.code === '42703' || updateError.message?.includes('column'))) {
          const retryBase = await supabase
            .from('products')
            .update(dbUpdatePayload)
            .eq('id', id)
            .select('*, categories(id, name, slug)')
            .maybeSingle();
          updatedRow = retryBase.data;
          updateError = retryBase.error;
        }
      }

      // 2. Si el id no era UUID o no se encontró por ID, buscar y actualizar por SKU o slug en Supabase
      if (!updateError && !updatedRow && existingProduct.sku) {
        const retrySku = await supabase
          .from('products')
          .update(dbUpdatePayload)
          .eq('sku', existingProduct.sku)
          .select('*, categories(id, name, slug)')
          .maybeSingle();
        updatedRow = retrySku.data;
        updateError = retrySku.error;
      }

      if (!updateError && !updatedRow && existingProduct.slug) {
        const retrySlug = await supabase
          .from('products')
          .update(dbUpdatePayload)
          .eq('slug', existingProduct.slug)
          .select('*, categories(id, name, slug)')
          .maybeSingle();
        updatedRow = retrySlug.data;
        updateError = retrySlug.error;
      }

      // 3. Si realmente aún no existía en la BD (ej. producto local nuevo), insertarlo en la BD
      if (!updateError && !updatedRow && !isUUID(id)) {
        const mergedForInsert = {
          ...existingProduct,
          ...updatedFields,
          ...dbUpdatePayload,
          sizes: sizesArray,
          colors: colorsArray,
          gallery: galleryArray,
        };
        const created = await addProduct(mergedForInsert);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        return created;
      }

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('El código SKU o nombre ya está en uso por otro producto.');
        }
        throw new Error(updateError.message || 'Error al guardar los cambios en Supabase.');
      }

      if (!updatedRow) {
        throw new Error(
          'No se pudieron guardar los cambios en la base de datos. Verifica tu sesión de administrador o las políticas RLS.'
        );
      }

      // Sincronizar en paralelo ÚNICAMENTE las tablas hijas que realmente cambiaron
      const sizesChanged =
        updatedFields.sizes !== undefined && !arraysEqual(sizesArray, existingProduct.sizes || []);
      const colorsChanged =
        updatedFields.colors !== undefined && !arraysEqual(colorsArray, existingProduct.colors || []);
      const galleryChanged =
        (updatedFields.gallery !== undefined || updatedFields.main_image !== undefined) &&
        !arraysEqual(galleryArray, existingProduct.gallery || []);

      if (sizesChanged || colorsChanged || galleryChanged) {
        try {
          await syncProductRelations(updatedRow.id, {
            sizes: sizesChanged ? sizesArray : undefined,
            colors: colorsChanged ? colorsArray : undefined,
            gallery: galleryChanged ? galleryArray : undefined,
          });
        } catch (relErr) {
          console.warn('Aviso sincronizando relaciones del producto:', relErr);
        }
      }

      lastLocalMutationRef.current = Date.now();

      const confirmedProduct = {
        ...existingProduct,
        ...formatDbProduct(updatedRow, categories),
        model: updatedFields.model !== undefined ? updatedFields.model : existingProduct.model,
        attributes:
          updatedFields.attributes !== undefined
            ? updatedFields.attributes
            : existingProduct.attributes,
        sizes: sizesArray,
        colors: colorsArray,
        gallery: galleryArray,
        updated_at: updatedRow.updated_at || dbUpdatePayload.updated_at,
      };

      setProducts((prev) => {
        const updatedList = prev.map((p) =>
          p.id === id || p.id === updatedRow.id ? confirmedProduct : p
        );
        try {
          localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updatedList));
        } catch {
          // ignore
        }
        return updatedList;
      });

      return confirmedProduct;
    }

    // Modo sin Supabase
    const updatedLocal = {
      ...existingProduct,
      ...updatedFields,
      ...dbUpdatePayload,
      sizes: sizesArray,
      colors: colorsArray,
      gallery: galleryArray,
    };

    setProducts((prev) => prev.map((p) => (p.id === id ? updatedLocal : p)));
    return updatedLocal;
  };

  /**
   * ELIMINAR PRODUCTO PERMANENTEMENTE (Con actualización instantánea sin lag y soporte por ID / SKU)
   */
  const deleteProduct = async (id) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;

    const previousProducts = products;

    // 1. Actualización optimista inmediata para cero lag en la interfaz
    lastLocalMutationRef.current = Date.now();
    setProducts((prev) => {
      const filtered = prev.filter(
        (p) => p.id !== id && (!existing.sku || p.sku !== existing.sku)
      );
      try {
        localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
      } catch {
        // ignore
      }
      return filtered;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await ensureAuthenticatedForWrite();

        let deletedCount = 0;

        if (isUUID(id)) {
          const { data: deletedById, error: errById } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select('id');

          if (errById) throw errById;
          deletedCount += Array.isArray(deletedById) ? deletedById.length : 0;
        }

        // Si tenía un ID local o diferente UUID en caché, eliminar también por SKU o slug en Supabase
        if (deletedCount === 0 && existing.sku) {
          const { data: deletedBySku, error: errBySku } = await supabase
            .from('products')
            .delete()
            .eq('sku', existing.sku)
            .select('id');

          if (errBySku) throw errBySku;
          deletedCount += Array.isArray(deletedBySku) ? deletedBySku.length : 0;
        }

        if (deletedCount === 0 && existing.slug) {
          const { data: deletedBySlug, error: errBySlug } = await supabase
            .from('products')
            .delete()
            .eq('slug', existing.slug)
            .select('id');

          if (errBySlug) throw errBySlug;
          deletedCount += Array.isArray(deletedBySlug) ? deletedBySlug.length : 0;
        }

        lastLocalMutationRef.current = Date.now();

        // Registrar SKU/ID eliminado para que ningún fallback local lo vuelva a mostrar
        try {
          const rawDeleted = localStorage.getItem(STORAGE_DELETED_SKUS_KEY);
          const deletedSet = new Set(rawDeleted ? JSON.parse(rawDeleted) : []);
          if (existing.sku) deletedSet.add(existing.sku);
          if (existing.id) deletedSet.add(existing.id);
          localStorage.setItem(STORAGE_DELETED_SKUS_KEY, JSON.stringify([...deletedSet]));
        } catch {
          // ignore
        }
      } catch (err) {
        // Revertir si la base de datos falló
        setProducts(previousProducts);
        try {
          localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(previousProducts));
        } catch {
          // ignore
        }
        throw new Error(err.message || 'No se pudo eliminar el producto de la base de datos.');
      }
    }
  };

  /**
   * DUPLICAR PRODUCTO (Crea una copia real y permanente en la base de datos)
   */
  const duplicateProduct = async (id) => {
    const original = products.find((p) => p.id === id);
    if (!original) {
      throw new Error('No se encontró el producto a duplicar.');
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const copyPayload = {
      ...original,
      name: `${original.name} (Copia)`,
      slug: `${original.slug}-copia-${randomSuffix}`,
      sku: `${original.sku}-C${randomSuffix}`,
    };
    delete copyPayload.id;

    return await addProduct(copyPayload);
  };

  /**
   * ALTERNAR DESTACADO (Persiste en la base de datos)
   */
  const toggleFeatured = async (id) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    return await updateProduct(id, { featured: !target.featured });
  };

  /**
   * GESTIÓN DE CATEGORÍAS (Crear, Editar, Eliminar)
   */
  const addCategory = async (catData) => {
    const slug =
      catData.slug ||
      catData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/[^a-z0-9]+/g, '-');

    if (isSupabaseConfigured && supabase) {
      await ensureAuthenticatedForWrite();
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: catData.name.trim(),
          slug,
          description: catData.description?.trim() || '',
          icon: catData.icon || 'Sparkles',
          order_index: Number(catData.order_index) || categories.length + 1,
        })
        .select()
        .single();

      if (error) throw new Error(error.message || 'No se pudo crear la categoría.');
      setCategories((prev) => [...prev, data]);
      return data;
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      name: catData.name.trim(),
      slug,
      description: catData.description || '',
      icon: catData.icon || 'Sparkles',
      order_index: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = async (id, catFields) => {
    if (isSupabaseConfigured && supabase && isUUID(id)) {
      await ensureAuthenticatedForWrite();
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: catFields.name?.trim(),
          description: catFields.description?.trim(),
          icon: catFields.icon,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message || 'No se pudo actualizar la categoría.');
      setCategories((prev) => prev.map((c) => (c.id === id ? data : c)));
      return data;
    }

    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...catFields } : c)));
  };

  /**
   * ACTUALIZAR CONFIGURACIÓN DE TIENDA (Persiste en Supabase)
   */
  const updateSettings = async (newSettings) => {
    if (isSupabaseConfigured && supabase) {
      await ensureAuthenticatedForWrite();

      const payload = {
        id: settings.id && isUUID(settings.id) ? settings.id : '44444444-4444-4444-4444-444444444444',
        store_name: newSettings.store_name?.trim() || 'KS Store',
        tagline: newSettings.tagline?.trim() || 'Estilo que te representa.',
        whatsapp_number: newSettings.whatsapp_number?.trim() || '88761389',
        instagram_url: newSettings.instagram_url?.trim() || 'https://www.instagram.com/ks.store_hn',
        facebook_url: newSettings.facebook_url?.trim() || '',
        address: newSettings.address?.trim() || 'Honduras',
        schedule: newSettings.schedule?.trim() || 'Lunes a Sábado: 9:00 AM - 7:00 PM',
        hero_title: newSettings.hero_title?.trim() || 'ESTILO QUE TE REPRESENTA',
        hero_subtitle: newSettings.hero_subtitle?.trim() || '',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('store_settings')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'No se pudo guardar la configuración en la base de datos.');
      }

      setSettings(data);
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
      return data;
    }

    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    return updated;
  };

  /**
   * SUBIDA DE IMÁGENES A SUPABASE STORAGE (Con compresión automática para cero lag)
   */
  const uploadImage = async (file) => {
    if (!file) throw new Error('No se seleccionó ningún archivo de imagen.');

    // Validar tipo y tamaño (máx 10MB antes de comprimir)
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo seleccionado debe ser una imagen válida (JPG, PNG, WEBP).');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('La imagen supera el límite de 10 MB. Por favor elige una imagen más ligera.');
    }

    // Optimizar tamaño y peso en el cliente antes de subir
    const processedFile = await optimizeImageFile(file);

    if (isSupabaseConfigured && supabase) {
      await ensureAuthenticatedForWrite();

      const fileExt = (processedFile.name.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(fileExt) ? fileExt : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${safeExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, processedFile, {
          contentType: processedFile.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `No se pudo subir la imagen a Supabase Storage: ${uploadError.message}. Verifica tu sesión de administrador.`
        );
      }

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      if (!data?.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen subida.');
      }

      return data.publicUrl;
    }

    // Fallback solo si no hay Supabase configurado
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error al procesar el archivo de imagen.'));
      reader.readAsDataURL(processedFile);
    });
  };

  /**
   * CREAR Y REGISTRAR UN PEDIDO CON COPIA INMUTABLE DE PRECIOS E IMÁGENES (Sección 7, 9 y 11.E)
   * Verifica los productos y precios contra el catálogo actual antes de generar el reporte.
   * No descuenta inventario automáticamente.
   */
  const createOrder = async ({ cartItems = [], customer = {}, orderCode = '' }) => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('No se puede registrar un pedido con el carrito vacío.');
    }

    // Validar cada ítem contra el catálogo actual y congelar precio e imagen del momento
    let verifiedTotal = 0;
    const verifiedItems = cartItems.map((item) => {
      const catalogProduct = products.find(
        (p) => p.id === item.id || (item.sku && p.sku === item.sku) || (item.slug && p.slug === item.slug)
      );

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const rawPrice = catalogProduct ? Number(catalogProduct.price) : Number(item.price);
      const unitPrice = Number.isFinite(rawPrice) && rawPrice >= 0 ? Number(rawPrice.toFixed(2)) : 0;
      const lineSubtotal = Number((unitPrice * qty).toFixed(2));
      verifiedTotal = Number((verifiedTotal + lineSubtotal).toFixed(2));

      const frozenImage = catalogProduct?.main_image || item.main_image || item.image_url || '';

      return {
        product_id: catalogProduct?.id || item.id || null,
        name: catalogProduct?.name || item.name || 'Producto KS Store',
        sku: catalogProduct?.sku || item.sku || '',
        brand: catalogProduct?.brand || item.brand || '',
        category: catalogProduct?.category || item.category || '',
        size: item.size || 'Única',
        color: item.color || 'Estándar',
        quantity: qty,
        unit_price: unitPrice,
        price: unitPrice,
        subtotal: lineSubtotal,
        main_image: frozenImage,
        image_url: frozenImage,
      };
    });

    const nowIso = new Date().toISOString();
    const orderRecord = {
      order_code: orderCode,
      customer_name: customer?.name?.trim() || 'No especificado',
      customer_phone: customer?.phone?.trim() || 'No especificado',
      customer_notes: customer?.notes?.trim() || '',
      total_amount: verifiedTotal,
      items: verifiedItems,
      status: 'pending', // Pendiente de confirmación
      created_at: nowIso,
    };

    let savedDbOrder = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([
            {
              order_code: orderRecord.order_code,
              customer_name: orderRecord.customer_name,
              customer_phone: orderRecord.customer_phone,
              customer_notes: orderRecord.customer_notes,
              total_amount: orderRecord.total_amount,
              items: orderRecord.items,
              status: 'pending',
            },
          ])
          .select('*')
          .maybeSingle();

        if (!error && data) {
          savedDbOrder = data;

          // Si existe la tabla relacional order_items, insertar también el detalle normalizado
          if (isUUID(data.id)) {
            const relationalItems = verifiedItems.map((vi) => ({
              order_id: data.id,
              product_id: isUUID(vi.product_id) ? vi.product_id : null,
              product_name: vi.name,
              sku: vi.sku,
              size: vi.size,
              color: vi.color,
              quantity: vi.quantity,
              unit_price: vi.unit_price,
              subtotal: vi.subtotal,
              image_url: vi.main_image,
            }));
            await supabase.from('order_items').insert(relationalItems).then(() => {});
          }
        } else if (error) {
          // Si la política RLS actual no devuelve SELECT a anon, hacer insert simple sin select
          const { error: insertOnlyErr } = await supabase.from('orders').insert([
            {
              order_code: orderRecord.order_code,
              customer_name: orderRecord.customer_name,
              customer_phone: orderRecord.customer_phone,
              customer_notes: orderRecord.customer_notes,
              total_amount: orderRecord.total_amount,
              items: orderRecord.items,
              status: 'pending',
            },
          ]);
          if (insertOnlyErr) {
            console.warn('Aviso al registrar pedido en Supabase:', insertOnlyErr.message);
          }
        }
      } catch (dbErr) {
        console.warn('No se pudo sincronizar el pedido con Supabase:', dbErr);
      }
    }

    const finalOrder = savedDbOrder || { id: `local-${Date.now()}`, ...orderRecord };

    setOrders((prev) => {
      const filtered = prev.filter((o) => o.order_code !== finalOrder.order_code);
      const updated = [finalOrder, ...filtered];
      try {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    return {
      order: finalOrder,
      verifiedItems,
      verifiedTotal,
    };
  };

  /**
   * ACTUALIZAR ESTADO DE UN PEDIDO (Acción exclusiva del Administrador)
   */
  const updateOrderStatus = async (orderIdOrCode, newStatus) => {
    const validStatuses = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Estado de pedido no válido.');
    }

    const targetOrder = orders.find(
      (o) => o.id === orderIdOrCode || o.order_code === orderIdOrCode
    );
    if (!targetOrder) {
      throw new Error('No se encontró el pedido especificado.');
    }

    if (isSupabaseConfigured && supabase && isUUID(targetOrder.id)) {
      await ensureAuthenticatedForWrite();

      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', targetOrder.id)
        .select('*')
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'No se pudo actualizar el estado del pedido en Supabase.');
      }

      if (data) {
        setOrders((prev) => {
          const updated = prev.map((o) => (o.id === targetOrder.id ? data : o));
          try {
            localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
        return data;
      }
    }

    const updatedLocal = { ...targetOrder, status: newStatus };
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === targetOrder.id || o.order_code === targetOrder.order_code ? updatedLocal : o
      );
      try {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    return updatedLocal;
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        categories,
        settings,
        orders,
        loading,
        syncError,
        refreshCatalog: fetchSupabaseData,
        generateNextSku,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        toggleFeatured,
        addCategory,
        updateCategory,
        updateSettings,
        uploadImage,
        createOrder,
        updateOrderStatus,
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
