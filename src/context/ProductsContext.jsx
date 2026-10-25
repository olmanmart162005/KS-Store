import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialProducts, initialCategories, initialSettings } from '../data/initialProducts';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const ProductsContext = createContext(null);

const STORAGE_PRODUCTS_KEY = 'ks_store_custom_products';
const STORAGE_SETTINGS_KEY = 'ks_store_custom_settings';
const STORAGE_CATEGORIES_KEY = 'ks_store_custom_categories';

const CATEGORY_UUID_MAP = {
  gorras: '11111111-1111-1111-1111-111111111111',
  tenis: '22222222-2222-2222-2222-222222222222',
  'moda-urbana': '33333333-3333-3333-3333-333333333333',
};

const isUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

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

  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);

  /**
   * Formatea un registro crudo de Supabase al modelo unificado del catálogo
   */
  const formatDbProduct = useCallback((p, dbCats = categories) => {
    const matchedCat =
      p.categories ||
      dbCats.find((c) => c.id === p.category_id) ||
      (p.sku?.startsWith('KS-T')
        ? { slug: 'tenis', name: 'Tenis' }
        : { slug: 'gorras', name: 'Gorras' });

    const catSlug = matchedCat?.slug || 'gorras';
    const catName = matchedCat?.name || (catSlug === 'tenis' ? 'Tenis' : catSlug === 'moda-urbana' ? 'Moda Urbana' : 'Gorras');

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
      compare_price: p.compare_price !== null && p.compare_price !== undefined && Number(p.compare_price) > 0
        ? Number(p.compare_price)
        : null,
      stock: Number(p.stock ?? 0),
      status: p.status || (Number(p.stock ?? 0) === 0 ? 'sold_out' : 'available'),
      featured: Boolean(p.featured),
      is_new: Boolean(p.is_new),
      is_sale: Boolean(p.is_sale),
      description: p.description || '',
      main_image: p.main_image,
      gallery: gallery.length > 0 ? gallery : (seedFallback?.gallery || [p.main_image]),
      sizes:
        dbSizes.length > 0
          ? dbSizes
          : seedFallback?.sizes ||
            (catSlug === 'tenis' ? ['38', '39', '40', '41', '42', '43'] : ['Ajustable / Unitalla']),
      colors:
        dbColors.length > 0
          ? dbColors
          : seedFallback?.colors || ['Negro'],
      created_at: p.created_at || null,
      updated_at: p.updated_at || p.created_at || null,
    };
  }, [categories]);

  /**
   * Consulta principal desde Supabase (Fuente de verdad permanente)
   */
  const fetchSupabaseData = useCallback(async (silent = false) => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setSyncError(null);

    try {
      // 1. Cargar categorías primero para mapear relaciones con precisión
      const { data: dbCats, error: cError } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      let activeCats = initialCategories;
      if (!cError && dbCats && dbCats.length > 0) {
        activeCats = dbCats;
        setCategories(dbCats);
        try {
          localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(dbCats));
        } catch {
          // ignore
        }
      }

      // 2. Cargar productos con todas sus tablas relacionadas
      const { data: dbProducts, error: pError } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name, slug),
          product_images (image_url, order_index),
          product_sizes (size, stock),
          product_colors (color_name)
        `)
        .order('created_at', { ascending: true });

      if (pError) {
        throw pError;
      }

      if (dbProducts && dbProducts.length > 0) {
        const formatted = dbProducts.map((p) => formatDbProduct(p, activeCats));

        // Verificar si faltan los 8 tenis iniciales en la BD (para que nunca desaparezcan del catálogo)
        const dbSkus = new Set(formatted.map((item) => item.sku));
        const dbSlugs = new Set(formatted.map((item) => item.slug));
        const missingInitialTenis = initialProducts.filter(
          (ip) => ip.category === 'tenis' && !dbSkus.has(ip.sku) && !dbSlugs.has(ip.slug)
        );

        const combined = [...formatted, ...missingInitialTenis];
        setProducts(combined);
        try {
          localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(combined));
        } catch {
          // ignore
        }
      }

      // 3. Cargar configuración general de tienda
      const { data: dbSettings, error: sError } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!sError && dbSettings) {
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
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err);
      setSyncError(err.message || 'Error al sincronizar con la base de datos.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [formatDbProduct]);

  // Carga inicial y suscripción en tiempo real a cambios en Supabase
  useEffect(() => {
    fetchSupabaseData();

    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('ks-store-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchSupabaseData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchSupabaseData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
        fetchSupabaseData(true);
      })
      .subscribe();

    return () => {
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
   * Sincroniza tablas hijas (tallas, colores, galería) de un producto en Supabase
   */
  const syncProductRelations = async (productId, { sizes, colors, gallery }) => {
    if (!isSupabaseConfigured || !supabase || !isUUID(productId)) return;

    // 1. Tallas
    if (Array.isArray(sizes)) {
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
    }

    // 2. Colores
    if (Array.isArray(colors)) {
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
    }

    // 3. Galería de imágenes
    if (Array.isArray(gallery)) {
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
    }
  };

  /**
   * Verifica que exista una sesión autenticada en Supabase antes de escribir
   */
  const ensureAuthenticatedForWrite = async () => {
    if (!isSupabaseConfigured || !supabase) return true;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error(
        'Tu sesión de administrador no está autenticada en Supabase. Cierra sesión e ingresa con tu correo y contraseña de Supabase (sauladmin@ksstore.org) para guardar cambios permanentes.'
      );
    }
    return true;
  };

  /**
   * CREAR PRODUCTO (Guarda primero en Supabase y actualiza el estado con el registro confirmado)
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

    const finalSku =
      productData.sku?.trim() ||
      `KS-${productData.category === 'tenis' ? 'T' : 'G'}${Math.floor(100 + Math.random() * 899)}`;

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

    const sizesArray = Array.isArray(productData.sizes)
      ? productData.sizes
      : String(productData.sizes || 'Ajustable / Unitalla')
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

      const dbInsertPayload = {
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

      const { data: insertedRow, error: insertError } = await supabase
        .from('products')
        .insert(dbInsertPayload)
        .select('*, categories(id, name, slug)')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error(
            `Ya existe un producto con el código SKU "${finalSku}" o nombre similar. Usa un SKU diferente.`
          );
        }
        throw new Error(insertError.message || 'No se pudo guardar el producto en la base de datos.');
      }

      if (!insertedRow) {
        throw new Error(
          'La base de datos rechazó la creación del producto (verifica tus permisos de administrador en Supabase).'
        );
      }

      // Sincronizar tallas, colores y galería
      try {
        await syncProductRelations(insertedRow.id, {
          sizes: sizesArray,
          colors: colorsArray,
          gallery: galleryArray,
        });
      } catch (relErr) {
        console.warn('Aviso al sincronizar atributos secundarios:', relErr);
      }

      const confirmedProduct = {
        ...formatDbProduct(insertedRow, categories),
        model: productData.model || '',
        attributes: productData.attributes || {},
        sizes: sizesArray,
        colors: colorsArray,
        gallery: galleryArray,
      };

      setProducts((prev) => {
        const updated = [confirmedProduct, ...prev];
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
   * ACTUALIZAR PRODUCTO EXISTENTE (Verifica en Supabase y nunca simula éxito si falla)
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

      // Si el producto era un ítem local (ej. `tenis-1` aún no migrado a la BD), lo insertamos primero en la BD
      if (!isUUID(id)) {
        const mergedForInsert = {
          ...existingProduct,
          ...updatedFields,
          ...dbUpdatePayload,
          sizes: sizesArray,
          colors: colorsArray,
          gallery: galleryArray,
        };
        const created = await addProduct(mergedForInsert);
        // Remover el id no-UUID anterior
        setProducts((prev) => prev.filter((p) => p.id !== id));
        return created;
      }

      // Actualizar registro por su UUID o por su SKU si el UUID cambió
      let query = supabase
        .from('products')
        .update(dbUpdatePayload)
        .eq('id', id)
        .select('*, categories(id, name, slug)')
        .maybeSingle();

      let { data: updatedRow, error: updateError } = await query;

      // Si no encontró por ID pero existe por SKU (por ejemplo tras una migración)
      if (!updateError && !updatedRow && existingProduct.sku) {
        const retry = await supabase
          .from('products')
          .update(dbUpdatePayload)
          .eq('sku', existingProduct.sku)
          .select('*, categories(id, name, slug)')
          .maybeSingle();
        updatedRow = retry.data;
        updateError = retry.error;
      }

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('El código SKU o slug ya está en uso por otro producto.');
        }
        throw new Error(updateError.message || 'Error al guardar los cambios en Supabase.');
      }

      if (!updatedRow) {
        throw new Error(
          'No se pudieron guardar los cambios en la base de datos. Verifica tu sesión de administrador o las políticas RLS.'
        );
      }

      // Si se modificaron tallas, colores o galería, sincronizarlos
      if (
        updatedFields.sizes !== undefined ||
        updatedFields.colors !== undefined ||
        updatedFields.gallery !== undefined ||
        updatedFields.main_image !== undefined
      ) {
        try {
          await syncProductRelations(updatedRow.id, {
            sizes: sizesArray,
            colors: colorsArray,
            gallery: galleryArray,
          });
        } catch (relErr) {
          console.warn('Aviso sincronizando relaciones del producto:', relErr);
        }
      }

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
        const updatedList = prev.map((p) => (p.id === id ? confirmedProduct : p));
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
   * ELIMINAR PRODUCTO PERMANENTEMENTE
   */
  const deleteProduct = async (id) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;

    if (isSupabaseConfigured && supabase && isUUID(id)) {
      await ensureAuthenticatedForWrite();

      const { data: deletedRows, error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) {
        throw new Error(error.message || 'No se pudo eliminar el producto de la base de datos.');
      }

      if (!deletedRows || deletedRows.length === 0) {
        throw new Error(
          'La base de datos no permitió eliminar el producto. Verifica tu sesión de administrador.'
        );
      }
    }

    setProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
      } catch {
        // ignore
      }
      return filtered;
    });
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
   * SUBIDA DE IMÁGENES A SUPABASE STORAGE
   */
  const uploadImage = async (file) => {
    if (!file) throw new Error('No se seleccionó ningún archivo de imagen.');

    // Validar tipo y tamaño (máx 8MB)
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo seleccionado debe ser una imagen válida (JPG, PNG, WEBP).');
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error('La imagen supera el límite de 8 MB. Por favor elige una imagen más ligera.');
    }

    if (isSupabaseConfigured && supabase) {
      await ensureAuthenticatedForWrite();

      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(fileExt) ? fileExt : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${safeExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
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
        syncError,
        refreshCatalog: fetchSupabaseData,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        toggleFeatured,
        addCategory,
        updateCategory,
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
