import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  X, 
  ChevronRight, 
  ChevronDown, 
  SlidersHorizontal, 
  RotateCcw, 
  ArrowUpDown,
  Check
} from 'lucide-react';
import type { Category, Store, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';

interface SearchPageProps {
  categories: Category[];
  stores: Store[];
  products: Product[];
  searchParams: URLSearchParams;
  onNavigateProduct: (slug: string) => void;
  onOpenChatWithStore: (storeId: string, storeName: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  categories,
  stores,
  products,
  searchParams,
  onNavigateProduct,
  onOpenChatWithStore
}) => {
  const { lang, t } = useLanguage();
  const queryParam = searchParams.get('q') || '';
  const initialCategoryParam = searchParams.get('category') || '';
  const initialDiscountParam = searchParams.get('discount') === 'true';

  // State for facets
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(initialCategoryParam);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyDiscount, setOnlyDiscount] = useState<boolean>(initialDiscountParam);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest' | 'best_selling'>('best_selling');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Category Tree structure
  const rootCategories = categories.filter(c => c.level === 0);

  // Filter products based on all facets
  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      // 1. Text Query
      if (queryParam) {
        const q = queryParam.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesBn = item.titleBn && item.titleBn.includes(queryParam);
        const matchesCategory = item.mainCategory.toLowerCase().includes(q) || (item.categoryPath && item.categoryPath.some(cp => cp.toLowerCase().includes(q)));
        if (!matchesTitle && !matchesBn && !matchesCategory) return false;
      }

      // 2. Category
      if (selectedCategorySlug) {
        const matchesCat = item.categoryPath && item.categoryPath.includes(selectedCategorySlug);
        if (!matchesCat) return false;
      }

      // 3. Store
      if (selectedStoreId && item.storeId !== selectedStoreId) {
        return false;
      }

      // 4. Price range
      if (item.price < minPrice || item.price > maxPrice) {
        return false;
      }

      // 5. Stock availability
      if (onlyInStock && item.stock <= 0) {
        return false;
      }

      // 6. Discount only
      if (onlyDiscount && (!item.originalPrice || item.originalPrice <= item.price)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      // best selling default
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });
  }, [products, queryParam, selectedCategorySlug, selectedStoreId, minPrice, maxPrice, onlyInStock, onlyDiscount, sortBy]);

  const resetFilters = () => {
    setSelectedCategorySlug('');
    setSelectedStoreId('');
    setMinPrice(0);
    setMaxPrice(10000);
    setOnlyInStock(false);
    setOnlyDiscount(false);
    setSortBy('best_selling');
  };

  const FilterSidebarContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-sm text-slate-800">Filter Products</h3>
        </div>
        <button
          onClick={resetFilters}
          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Deep Category Tree Picker */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Category Hierarchy
        </h4>
        <div className="space-y-1 text-xs">
          <button
            onClick={() => setSelectedCategorySlug('')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between ${
              selectedCategorySlug === '' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>All Categories</span>
            {selectedCategorySlug === '' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
          </button>

          {rootCategories.map(root => {
            const subs = categories.filter(c => c.parentId === root.categoryId);
            const isSelected = selectedCategorySlug === root.slug;
            return (
              <div key={root.categoryId} className="space-y-1">
                <button
                  onClick={() => setSelectedCategorySlug(root.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{lang === 'bn' && root.nameBn ? root.nameBn : root.name}</span>
                  <span className="text-[10px] text-slate-400">({subs.length})</span>
                </button>

                {/* Sub category tree links */}
                {subs.length > 0 && (
                  <div className="pl-3 border-l border-slate-200 ml-2 space-y-0.5">
                    {subs.map(sub => {
                      const isSubSelected = selectedCategorySlug === sub.slug;
                      return (
                        <button
                          key={sub.categoryId}
                          onClick={() => setSelectedCategorySlug(sub.slug)}
                          className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            isSubSelected ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          • {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Price Range (BDT)
          </h4>
          <span className="text-xs font-bold text-emerald-700">
            ৳{minPrice} - ৳{maxPrice}
          </span>
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>৳0</span>
            <span>৳5,000</span>
            <span>৳10,000+</span>
          </div>
        </div>
      </div>

      {/* Store / Vendor Selector */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Official Store
        </h4>
        <select
          value={selectedStoreId}
          onChange={e => setSelectedStoreId(e.target.value)}
          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-emerald-600 font-medium text-slate-700"
        >
          <option value="">All Verified Stores</option>
          {stores.map(s => (
            <option key={s.storeId} value={s.storeId}>
              {s.storeName} ({s.status})
            </option>
          ))}
        </select>
      </div>

      {/* Toggles: In Stock & Discounts */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={e => setOnlyInStock(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600"
          />
          <span>In Stock Only</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={onlyDiscount}
            onChange={e => setOnlyDiscount(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600"
          />
          <span>Discounted Deals Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="pb-12 space-y-4">
      {/* Top Header & Sort Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-extrabold text-base sm:text-lg text-slate-900">
            {queryParam ? `Search: "${queryParam}"` : 'Browse Marketplace Products'}
          </h1>
          <p className="text-xs text-slate-500">
            Found {filteredProducts.length} items matching your filters
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>Filters</span>
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <span className="text-slate-500 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:outline-emerald-600"
            >
              <option value="best_selling">Best Selling</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-6 items-start">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 xl:w-72 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs shrink-0 sticky top-4">
          {FilterSidebarContent}
        </aside>

        {/* Mobile Sliding Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div 
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs" 
            />
            <div className="relative w-full max-w-xs bg-white h-full p-5 overflow-y-auto z-10 animate-in slide-in-from-left duration-200">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
              {FilterSidebarContent}
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="mt-6 w-full py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                Apply Filters ({filteredProducts.length} items)
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Filter className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-300" />
              <h3 className="font-bold text-base text-slate-700">No products match your criteria</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try widening your price range, choosing another category, or clearing the search keywords.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2.5 sm:gap-3.5">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  onNavigateProduct={onNavigateProduct}
                  onOpenChatWithStore={onOpenChatWithStore}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
