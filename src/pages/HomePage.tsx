import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Store as StoreIcon 
} from 'lucide-react';
import type { Category, Store, Product, Banner } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';

interface HomePageProps {
  categories: Category[];
  stores: Store[];
  products: Product[];
  banners: Banner[];
  onNavigateProduct: (slug: string) => void;
  onNavigateStore: (slug: string) => void;
  onNavigateSearch: (params?: string) => void;
  onOpenChatWithStore: (storeId: string, storeName: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  stores,
  products,
  banners,
  onNavigateProduct,
  onNavigateStore,
  onNavigateSearch,
  onOpenChatWithStore
}) => {
  const { lang, t } = useLanguage();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Auto-scroll hero banner slider
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const mainCategories = categories.filter(c => c.level === 0);
  const featuredProducts = products.filter(p => p.isFeatured && p.status === 'approved');
  const flashDeals = products.filter(p => p.originalPrice && p.originalPrice > p.price);
  const activeStores = stores.filter(s => s.status === 'active');

  return (
    <div className="space-y-6 sm:space-y-10 pb-12">
      {/* 1. Hero Banner Slider */}
      {banners.length > 0 && (
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm bg-slate-900 mx-auto">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] w-full overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={banner.bannerId}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
                  <div className="p-6 sm:p-10 lg:p-14 max-w-xl text-white space-y-2 sm:space-y-3">
                    {banner.badge && (
                      <span className="inline-block px-2.5 py-1 bg-emerald-700 text-white rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        {banner.badge}
                      </span>
                    )}
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight drop-shadow-md">
                      {banner.title}
                    </h1>
                    {banner.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow-xs font-medium">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="pt-2">
                      <button
                        onClick={() => onNavigateSearch()}
                        className="px-4 py-2 sm:px-6 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-transform hover:scale-105 inline-flex items-center gap-2"
                      >
                        <span>Shop Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setActiveBannerIndex(prev => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveBannerIndex(prev => (prev + 1) % banners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveBannerIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === activeBannerIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Multi-tier Category Horizontal Carousel */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h2 className="font-extrabold text-base sm:text-lg text-slate-800">
              {t('nav.categories')}
            </h2>
          </div>
          <button
            onClick={() => onNavigateSearch()}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carousel */}
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-1">
          {mainCategories.map(cat => (
            <div
              key={cat.categoryId}
              onClick={() => onNavigateSearch(`category=${cat.slug}`)}
              className="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer shrink-0 w-24 sm:w-28 text-center group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-emerald-50 p-1 group-hover:scale-105 transition-transform">
                <img
                  src={cat.iconUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-emerald-700 line-clamp-1 leading-tight">
                {lang === 'bn' && cat.nameBn ? cat.nameBn : cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Official Stores */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-emerald-700" />
            <h2 className="font-extrabold text-base sm:text-lg text-slate-800">
              {t('section.featuredStores')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {activeStores.map(store => (
            <div
              key={store.storeId}
              onClick={() => onNavigateStore(store.storeSlug)}
              className="group bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <img
                  src={store.logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160'}
                  alt={store.storeName}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-emerald-700">
                      {store.storeName}
                    </h3>
                    <VerifiedBadge size="xs" />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                    <span>{store.rating || 4.9}</span>
                    <span className="text-slate-400 font-normal">({store.totalSales || 100}+ sold)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[130px]">{store.address || 'Dhaka, Bangladesh'}</span>
                <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">
                  Visit →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Flash Deals Section */}
      {flashDeals.length > 0 && (
        <section className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-4 sm:p-6 text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <div>
                <h2 className="font-extrabold text-base sm:text-xl text-white">
                  {t('section.flashDeals')}
                </h2>
                <p className="text-xs text-emerald-100">Direct factory & verified merchant discounts</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateSearch('discount=true')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold backdrop-blur-xs transition-colors"
            >
              See All Offers
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {flashDeals.slice(0, 4).map(prod => (
              <ProductCard
                key={prod.productId}
                product={prod}
                onNavigateProduct={onNavigateProduct}
                onOpenChatWithStore={onOpenChatWithStore}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Dynamic Product Grid (Mobile 2-col, Desktop 4 to 6 columns) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            <h2 className="font-extrabold text-base sm:text-xl text-slate-900">
              {t('section.allProducts')}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {products.length} items
          </span>
        </div>

        {/* 2-column mobile, 4-6 column desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
          {products.map(prod => (
            <ProductCard
              key={prod.productId}
              product={prod}
              onNavigateProduct={onNavigateProduct}
              onOpenChatWithStore={onOpenChatWithStore}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
