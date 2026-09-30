import React, { useState } from 'react';
import { ShoppingBag, Star, MessageSquare, Check } from 'lucide-react';
import type { Product } from '../../types';
import { PriceTag } from '../common/PriceTag';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

interface ProductCardProps {
  product: Product;
  onNavigateProduct: (slug: string) => void;
  onOpenChatWithStore?: (storeId: string, storeName: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onNavigateProduct,
  onOpenChatWithStore 
}) => {
  const { addToCart } = useCart();
  const { lang, t } = useLanguage();
  const [addedAnimation, setAddedAnimation] = useState(false);

  const displayTitle = lang === 'bn' && product.titleBn ? product.titleBn : product.title;
  const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenChatWithStore) {
      onOpenChatWithStore(product.storeId, product.storeName || 'Seller');
    }
  };

  return (
    <div 
      onClick={() => onNavigateProduct(product.productSlug)}
      className="group flex flex-col bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer relative"
    >
      {/* 1:1 Image Container */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
        <img 
          src={imageSrc} 
          alt={displayTitle}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Store Badge */}
        {product.storeName && (
          <div className="absolute top-2 left-2 max-w-[80%] bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-xs truncate">
            <span className="truncate">{product.storeName}</span>
            <VerifiedBadge size="xs" />
          </div>
        )}

        {/* Chat with Seller quick action on hover */}
        {onOpenChatWithStore && (
          <button
            onClick={handleChatClick}
            title="Chat with seller"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-slate-700 hover:text-emerald-700 flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
        <div>
          {/* Title (max 2 lines) */}
          <h3 className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
            {displayTitle}
          </h3>

          {/* Rating & Sold count */}
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
            <div className="flex items-center text-amber-500 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400 mr-0.5" />
              <span>{product.rating || 4.9}</span>
            </div>
            {product.reviewCount ? (
              <span className="text-slate-400">({product.reviewCount})</span>
            ) : null}
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between gap-1">
          <PriceTag 
            price={product.price} 
            originalPrice={product.originalPrice} 
            size="sm" 
          />

          {/* 1-tap Add to Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`shrink-0 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              addedAnimation 
                ? 'bg-emerald-700 text-white' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
            } ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('btn.addToCart')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
