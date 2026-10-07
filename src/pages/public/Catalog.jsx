import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Check, 
  Crown, 
  Footprints,
  Sparkles
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { ProductCard } from '../../components/ui/ProductCard';

export const Catalog = ({ initialCategory = null }) => {
  const { products, categories } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // URL query parameter reading
  const queryParam = searchParams.get('q') || '';
  const categoryParam = initialCategory || searchParams.get('cat') || 'all';

  // Estados de filtros
  const [search, setSearch] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [priceRange, setPriceRange] = useState('all'); // 'all', 'under1000', '1000-2500', 'over2500'
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlySale, setOnlySale] = useState(false);
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-asc', 'price-desc', 'newest'
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sincronizar si cambia ruta directa (/gorras, /tenis) o URL params
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    } else if (searchParams.get('cat')) {
      setSelectedCategory(searchParams.get('cat'));
    }
    if (searchParams.get('q')) {
      setSearch(searchParams.get('q'));
    }
  }, [initialCategory, searchParams]);

  // Extraer marcas y tallas únicas disponibles
  const availableBrands = useMemo(() => {
    const brands = new Set();
    products.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products]);

  const availableSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach((p) => {
      if (p.sizes && Array.isArray(p.sizes)) {
        p.sizes.forEach((s) => {
          if (s && s !== 'Unitalla' && s !== 'Ajustable / Unitalla') {
            sizes.add(s);
          }
        });
      }
    });
    return Array.from(sizes).sort((a, b) => Number(a) - Number(b));
  }, [products]);

  // Lógica de filtrado y ordenamiento reactivo
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Filtro por Búsqueda (Nombre, Marca, SKU, Descripción)
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchesName = p.name?.toLowerCase().includes(q);
          const matchesBrand = p.brand?.toLowerCase().includes(q);
          const matchesSku = p.sku?.toLowerCase().includes(q);
          const matchesDesc = p.description?.toLowerCase().includes(q);
          const matchesCat = p.category_name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
          if (!matchesName && !matchesBrand && !matchesSku && !matchesDesc && !matchesCat) {
            return false;
          }
        }

        // Filtro por Categoría
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        // Filtro por Marca
        if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
          return false;
        }

        // Filtro por Talla
        if (selectedSize !== 'all') {
          if (!p.sizes || !p.sizes.includes(selectedSize)) {
            return false;
          }
        }

        // Filtro por Precio
        if (priceRange === 'under1000' && p.price >= 1000) return false;
        if (priceRange === '1000-2500' && (p.price < 1000 || p.price > 2500)) return false;
        if (priceRange === 'over2500' && p.price <= 2500) return false;

        // Filtro por Disponibilidad
        if (onlyAvailable && p.status === 'sold_out') return false;

        // Filtro por Ofertas
        if (onlySale && !p.is_sale) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
        // Featured default
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, search, selectedCategory, selectedBrand, selectedSize, priceRange, onlyAvailable, onlySale, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory(initialCategory || 'all');
    setSelectedBrand('all');
    setSelectedSize('all');
    setPriceRange('all');
    setOnlyAvailable(false);
    setOnlySale(false);
    setSortBy('featured');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    search ||
    (selectedCategory !== 'all' && selectedCategory !== initialCategory) ||
    selectedBrand !== 'all' ||
    selectedSize !== 'all' ||
    priceRange !== 'all' ||
    onlyAvailable ||
    onlySale
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Encabezado del Catálogo */}
      <div className="border-b border-zinc-800 pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>KS Store Boutique</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              {initialCategory === 'gorras' 
                ? 'Colección de Gorras' 
                : initialCategory === 'tenis' 
                ? 'Catálogo de Tenis & Sneakers' 
                : 'Catálogo de Productos'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'} exclusivos
            </p>
          </div>

          {/* Ordenar y Botón Filtros Móvil */}
          <div className="flex items-center gap-3">
            {/* Botón Filtros Móvil */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Selector de Ordenamiento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-white cursor-pointer"
            >
              <option value="featured">Destacados</option>
              <option value="newest">Más Nuevos</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>

        {/* Barra de Búsqueda Rápida */}
        <div className="mt-6 relative">
          <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, marca, estilo, SKU (Ej: Rico o Muerto, New Era, Jordan, KS-G001)..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Chips de Categoría Rápida */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setSelectedCategory('gorras')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedCategory === 'gorras'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Gorras (43)
          </button>
          <button
            onClick={() => setSelectedCategory('tenis')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedCategory === 'tenis'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-rose-400" />
            Tenis (8)
          </button>
        </div>
      </div>

      {/* Contenido Principal: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar de Filtros Desktop */}
        <aside className="hidden lg:block space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
                Filtros
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpiar
                </button>
              )}
            </div>

            {/* Filtro: Marcas */}
            <div>
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5">
                Marca
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                <button
                  onClick={() => setSelectedBrand('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedBrand === 'all'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todas las marcas
                </button>
                {availableBrands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedBrand === b
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro: Tallas (Sneakers) */}
            {availableSizes.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5">
                  Tallas Disponibles
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedSize('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      selectedSize === 'all'
                        ? 'bg-white text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  {availableSizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        selectedSize === sz
                          ? 'bg-white text-zinc-950 font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro: Rango de Precio */}
            <div>
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5">
                Rango de Precio
              </h4>
              <div className="space-y-1.5">
                {[
                  { id: 'all', label: 'Cualquier precio' },
                  { id: 'under1000', label: 'Menos de L. 1,000' },
                  { id: '1000-2500', label: 'L. 1,000 — L. 2,500' },
                  { id: 'over2500', label: 'Más de L. 2,500' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setPriceRange(tier.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      priceRange === tier.id
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes adicionales */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-rose-600 focus:ring-0"
                />
                <span>Solo productos en stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={onlySale}
                  onChange={(e) => setOnlySale(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-rose-600 focus:ring-0"
                />
                <span>Solo ofertas y descuentos</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Grid de Productos */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">No se encontraron productos</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
                No hay coincidencias para los filtros o el término de búsqueda actual.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Drawer de Filtros Móvil */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between text-white shadow-2xl">
              <div className="space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <span className="font-bold text-base">Filtros</span>
                  <button onClick={() => setMobileFiltersOpen(false)}>
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                {/* Marcas móvil */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Marca</h4>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                  >
                    <option value="all">Todas las marcas</option>
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Precios móvil */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Precio</h4>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                  >
                    <option value="all">Cualquier precio</option>
                    <option value="under1000">Menos de L. 1,000</option>
                    <option value="1000-2500">L. 1,000 — L. 2,500</option>
                    <option value="over2500">Más de L. 2,500</option>
                  </select>
                </div>

                {/* Stock y Ofertas */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-700"
                    />
                    <span>Solo en stock</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={onlySale}
                      onChange={(e) => setOnlySale(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-700"
                    />
                    <span>Solo ofertas</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 font-bold text-xs uppercase"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs uppercase"
                >
                  Ver ({filteredProducts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
