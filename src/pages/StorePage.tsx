import React, { useState } from 'react';
import { 
  Star, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import type { Store, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { VerifiedBadge, VerifiedStoreName } from '../components/common/VerifiedBadge';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';

interface StorePageProps {
  store: Store;
  products: Product[];
  onNavigateProduct: (slug: string) => void;
  onOpenChatWithStore: (storeId: string, storeName: string) => void;
}

export const StorePage: React.FC<StorePageProps> = ({
  store,
  products,
  onNavigateProduct,
  onOpenChatWithStore
}) => {
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const storeProducts = products.filter(p => p.storeId === store.storeId && p.status === 'approved');

  const handleWhatsApp = () => {
    if (store.whatsapp) {
      const clean = store.whatsapp.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${clean}?text=Hello%20${encodeURIComponent(store.storeName)},%20I%20saw%20your%20store%20on%20Sodaipur.`, '_blank');
    }
  };

  return (
    <div className="pb-16 space-y-6">
      {/* Store Header Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Banner */}
        <div className="h-44 sm:h-64 w-full bg-slate-900 relative">
          <img
            src={store.bannerUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200'}
            alt={store.storeName}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>

        {/* Store Info Bar */}
        <div className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6 relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-5 flex-1 min-w-0 w-full lg:w-auto">
            {/* Logo: shifted slightly higher (+2%) on tablet as requested */}
            <div className="-mt-12 sm:-mt-16 lg:-mt-16 w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white p-1.5 shadow-xl border-2 sm:border-4 border-white overflow-hidden shrink-0 z-10">
              <img
                src={store.logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160'}
                alt={store.storeName}
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>

            {/* Store Name (Line 1) & Address (Line 2) with full width, never squeezed by buttons on tablet */}
            <div className="pt-2 sm:pt-1 flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight whitespace-nowrap">
                <VerifiedStoreName name={store.storeName} badgeSize="auto" />
              </h1>
              {/* Clickable Address (Line 2) */}
              <div 
                onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                title="সম্পূর্ণ ঠিকানা দেখতে ক্লিক করুন"
                className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 mt-1 cursor-pointer select-none transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 transition-colors" />
                <span className={isAddressExpanded ? 'break-words text-slate-800 font-medium' : 'truncate'}>
                  {store.address || 'Dhaka, Bangladesh'}
                </span>
                {!isAddressExpanded && store.address && store.address.length > 25 && (
                  <span className="text-[10px] text-emerald-700 font-bold shrink-0 ml-1 sm:hidden">
                    (ট্যাপ করুন)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons (Chat, WhatsApp, Call) positioned cleanly below the text on tablet, aligned to the right side */}
          <div className="flex items-center justify-start sm:justify-end gap-1.5 sm:gap-2.5 w-full pt-1 sm:pt-1 lg:pt-0 shrink-0">
            <button
              onClick={() => onOpenChatWithStore(store.storeId, store.storeName)}
              className="shrink-0 sm:flex-initial py-2 px-3 sm:py-2.5 sm:px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs shadow-emerald-700/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Chat<span className="hidden sm:inline"> in Sodaipur</span></span>
            </button>

            {store.whatsapp && (
              <button
                onClick={handleWhatsApp}
                title={`WhatsApp: ${store.whatsapp}`}
                aria-label="WhatsApp"
                className="shrink-0 py-2 px-2.5 sm:py-2.5 sm:px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              </button>
            )}

            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                title={`Call ${store.phone}`}
                className="shrink-0 sm:flex-initial py-2 px-2.5 sm:py-2.5 sm:px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{store.phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100 text-center py-3 bg-slate-50 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Rating</span>
            <div className="flex items-center justify-center gap-1 font-bold text-slate-800 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span>{store.rating || 4.9} / 5.0</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Sales</span>
            <span className="font-bold text-slate-800 block mt-0.5">{store.totalSales || 100}+ items</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Listed Items</span>
            <span className="font-bold text-slate-800 block mt-0.5">{storeProducts.length} items</span>
          </div>
        </div>
      </div>

      {/* Store Products */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag className="w-4 h-4 text-emerald-700 shrink-0" />
            <h2 className="font-extrabold text-sm sm:text-lg text-slate-900 leading-snug">
              <VerifiedStoreName prefix="All Products from" name={store.storeName} badgeSize="auto" />
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium pl-6 sm:pl-0 shrink-0">
            {storeProducts.length} items available
          </span>
        </div>

        {storeProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <ShoppingBag className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-600">No active products listed in this store yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
            {storeProducts.map(prod => (
              <ProductCard
                key={prod.productId}
                product={prod}
                onNavigateProduct={onNavigateProduct}
                onOpenChatWithStore={onOpenChatWithStore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
