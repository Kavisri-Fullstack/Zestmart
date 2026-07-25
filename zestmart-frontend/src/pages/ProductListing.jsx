import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { productApi } from '../api/product.api';
import { categoryApi } from '../api/category.api';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/ui/Pagination';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-ratingAverage', label: 'Top rated' },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(searchParams.entries());
    productApi
      .list(params)
      .then((res) => {
        setProducts(res.data.data || []);
        setMeta(res.data.meta || { page: 1, totalPages: 1 });
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const applyPriceFilter = () => {
    const next = new URLSearchParams(searchParams);
    if (minPrice) next.set('minPrice', minPrice); else next.delete('minPrice');
    if (maxPrice) next.set('maxPrice', maxPrice); else next.delete('maxPrice');
    next.set('page', '1');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  const activeCategory = searchParams.get('category');
  const q = searchParams.get('q');

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex animate-fade-up items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {q ? `Results for "${q}"` : 'All products'}
          </h1>
          {!loading && <p className="mt-1 text-sm text-ink/50">{meta.total ?? products.length} products</p>}
        </div>
        <button className="btn-outline lg:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filters sidebar */}
        <aside className={`${filtersOpen ? 'fixed inset-0 z-50 bg-paper p-5 overflow-y-auto' : 'hidden'} lg:relative lg:block lg:bg-transparent lg:p-0`}>
          {filtersOpen && (
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h2 className="font-display text-lg font-semibold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
            </div>
          )}

          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold">Sort by</p>
            <select
              className="input"
              value={searchParams.get('sort') || '-createdAt'}
              onChange={(e) => updateParam('sort', e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold">Category</p>
            <div className="space-y-2">
              <button
                onClick={() => updateParam('category', '')}
                className={`block text-sm ${!activeCategory ? 'font-semibold text-teal-700' : 'text-ink/60'}`}
              >
                All categories
              </button>
              {categories.filter((c) => !c.parentCategory).map((top) => {
                const children = categories.filter((c) => c.parentCategory === top._id);
                return (
                  <div key={top._id}>
                    <button
                      onClick={() => updateParam('category', top._id)}
                      className={`block text-sm font-semibold ${activeCategory === top._id ? 'text-teal-700' : 'text-ink/80'}`}
                    >
                      {top.name}
                    </button>
                    {children.length > 0 && (
                      <div className="ml-3 mt-1 space-y-1.5 border-l border-ink/10 pl-3">
                        {children.map((child) => (
                          <button
                            key={child._id}
                            onClick={() => updateParam('category', child._id)}
                            className={`block text-sm ${activeCategory === child._id ? 'font-semibold text-teal-700' : 'text-ink/55'}`}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold">Price range</p>
            <div className="flex items-center gap-2">
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="input" type="number" />
              <span className="text-ink/40">–</span>
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="input" type="number" />
            </div>
            <button onClick={applyPriceFilter} className="btn-outline mt-3 w-full">Apply</button>
          </div>

          <button onClick={clearFilters} className="text-sm font-semibold text-maroon-600">Clear all filters</button>

          {filtersOpen && (
            <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-6 w-full lg:hidden">
              Show results
            </button>
          )}
        </aside>

        <div>
          <ProductGrid products={products} loading={loading} />
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={(p) => updateParam('page', p)} />
        </div>
      </div>
    </div>
  );
}
