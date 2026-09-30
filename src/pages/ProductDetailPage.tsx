import React, { useState } from 'react';
import { 
  ChevronRight, 
  ShoppingBag, 
  MessageSquare, 
  Share2, 
  Heart, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Star, 
  CheckCircle2, 
  Store as StoreIcon, 
  Check, 
  Zap,
  Play,
  ExternalLink
} from 'lucide-react';
import type { Product, Store } from '../types';
import { PriceTag } from '../components/common/PriceTag';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { VerifiedBadge, VerifiedStoreName } from '../components/common/VerifiedBadge';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';

interface ProductDetailPageProps {
  product: Product;
  store?: Store | null;
  onNavigateHome: () => void;
  onNavigateCategory: (categorySlug: string) => void;
  onNavigateStore: (storeSlug: string) => void;
  onOpenChatWithStore: (storeId: string, storeName: string) => void;
  onNavigateCheckout: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  store,
  onNavigateHome,
  onNavigateCategory,
  onNavigateStore,
  onOpenChatWithStore,
  onNavigateCheckout
}) => {
  const { addToCart } = useCart();
  const { lang, t } = useLanguage();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];

  const displayTitle = lang === 'bn' && product.titleBn ? product.titleBn : product.title;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onNavigateCheckout();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  return (
    <div className="pb-16 space-y-6">
      {/* Dynamic Breadcrumbs */}
      <nav className="flex items-center flex-wrap gap-1 text-xs text-slate-500 py-1">
        <button onClick={onNavigateHome} className="hover:text-emerald-700">Home</button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <button 
          onClick={() => onNavigateCategory(product.categoryPath?.[0] || '')}
          className="hover:text-emerald-700"
        >
          {product.mainCategory}
        </button>
        {product.subCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button 
              onClick={() => onNavigateCategory(product.categoryPath?.[1] || '')}
              className="hover:text-emerald-700"
            >
              {product.subCategory}
            </button>
          </>
        )}
        {product.childCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 font-semibold">{product.childCategory}</span>
          </>
        )}
      </nav>

      {/* Main Product Showcase Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Main Preview Container */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
              <img
                src={images[activeImageIndex]}
                alt={displayTitle}
                className="w-full h-full object-cover object-center"
              />
              {product.videoUrl && (
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-xs font-bold rounded-full flex items-center gap-1.5 backdrop-blur-xs transition-colors"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Video Preview</span>
                </a>
              )}
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      idx === activeImageIndex ? 'border-emerald-600 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center: Details & Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Sold by Store Badge */}
              <div className="flex items-center justify-between">
                <div 
                  onClick={() => store && onNavigateStore(store.storeSlug)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 cursor-pointer hover:bg-emerald-100 transition-colors"
                >
                  <StoreIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-xs font-bold">
                    <VerifiedStoreName
                      prefix="Sold by:"
                      name={product.storeName || store?.storeName || 'Verified Seller'}
                      badgeSize="xs"
                    />
                  </span>
                </div>

                <button
                  onClick={handleShare}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                  title="Share product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                {displayTitle}
              </h1>

              {/* Ratings and reviews */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 mr-1" />
                  <span>{product.rating || 4.9}</span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-medium">
                  {product.reviewCount || 34} Customer Reviews
                </span>
                <span className="text-slate-400">•</span>
                <span className={`font-bold ${product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Price Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <PriceTag 
                  price={product.price} 
                  originalPrice={product.originalPrice} 
                  size="xl" 
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Inclusive of all taxes. Cash on delivery available across Bangladesh.
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 font-bold rounded-l-xl"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 font-bold rounded-r-xl"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: Add to Cart, Buy Now, Chat with Seller */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1-tap Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border ${
                    addedNotice 
                      ? 'bg-emerald-800 text-white border-emerald-800' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  } disabled:opacity-50`}
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t('btn.addToCart')}</span>
                    </>
                  )}
                </button>

                {/* Buy Now button */}
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{t('btn.buyNow')}</span>
                </button>
              </div>

              {/* Chat & WhatsApp with Seller */}
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenChatWithStore(product.storeId, product.storeName || 'Seller')}
                  className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>{t('btn.chatSeller')}</span>
                </button>

                {store?.whatsapp && (
                  <button
                    onClick={() => {
                      const clean = store.whatsapp?.replace(/[^\d+]/g, '');
                      if (clean) {
                        const message = encodeURIComponent(`Hi, I am interested in "${product.title}" on Sodaipur: ${window.location.href}`);
                        window.open(`https://wa.me/${clean.replace('+', '')}?text=${message}`, '_blank');
                      }
                    }}
                    title={`WhatsApp: ${store.whatsapp}`}
                    aria-label="WhatsApp"
                    className="py-3 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/20"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>

              {/* Guarantees & delivery chips */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <Truck className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">24h Express</span>
                  <span className="text-[9px] text-slate-400">Inside Dhaka</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">100% Genuine</span>
                  <span className="text-[9px] text-slate-400">Brand Warranty</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <RotateCcw className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">7 Days Return</span>
                  <span className="text-[9px] text-slate-400">Hassle-Free</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs: Description, Specs, Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex border-b border-slate-100 gap-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'description' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'specifications' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Taxonomy & Details
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'reviews' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Reviews ({product.reviewCount || 34})
          </button>
        </div>

        {activeTab === 'description' && (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
            <p>{product.description}</p>
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span className="text-slate-500 font-medium">Main Category</span>
              <span className="font-bold text-slate-800">{product.mainCategory}</span>
            </div>
            {product.subCategory && (
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-medium">Sub-Category</span>
                <span className="font-bold text-slate-800">{product.subCategory}</span>
              </div>
            )}
            {product.childCategory && (
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-medium">Child-Category</span>
                <span className="font-bold text-slate-800">{product.childCategory}</span>
              </div>
            )}
            {product.microCategory && (
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-medium">Micro-Category</span>
                <span className="font-bold text-slate-800">{product.microCategory}</span>
              </div>
            )}
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span className="text-slate-500 font-medium">SEO Permalink</span>
              <span className="font-mono text-[11px] text-emerald-700">/products/{product.productSlug}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span className="text-slate-500 font-medium">Seller Code</span>
              <span className="font-mono text-[11px] text-slate-700">{product.storeId}</span>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/60 rounded-2xl flex items-center gap-4">
              <div className="text-center">
                <span className="text-3xl font-black text-amber-600 block">{product.rating || 4.9}</span>
                <div className="flex text-amber-500 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-600">
                <p className="font-bold text-slate-800">Verified Buyer Feedback</p>
                <p>100% genuine reviews from customers who purchased from Sodaipur.</p>
              </div>
            </div>

            {/* Sample customer review entries */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Kamrul Hasan (Mirpur, Dhaka)</span>
                  <span className="text-[10px] text-slate-400">2 days ago</span>
                </div>
                <div className="flex text-amber-400 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600">
                  Awesome quality! The fabric is 100% original and the seller delivered within 24 hours. Highly recommended.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
