import React from 'react';

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PriceTag: React.FC<PriceTagProps> = ({ price, originalPrice, size = 'md' }) => {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  const sizeClasses = {
    sm: { price: 'text-sm font-bold', original: 'text-xs', badge: 'text-[10px] px-1 py-0.5' },
    md: { price: 'text-base font-bold', original: 'text-xs', badge: 'text-xs px-1.5 py-0.5' },
    lg: { price: 'text-xl font-extrabold', original: 'text-sm', badge: 'text-xs px-2 py-0.5' },
    xl: { price: 'text-2xl lg:text-3xl font-black', original: 'text-base', badge: 'text-sm px-2.5 py-1' },
  }[size];

  return (
    <div className="flex items-baseline flex-wrap gap-1.5">
      <span className={`text-emerald-700 tracking-tight ${sizeClasses.price}`}>
        ৳{price.toLocaleString()}
      </span>
      {hasDiscount && (
        <>
          <span className={`text-slate-400 line-through ${sizeClasses.original}`}>
            ৳{originalPrice.toLocaleString()}
          </span>
          <span className={`bg-rose-50 text-rose-600 font-semibold rounded-md border border-rose-200 ${sizeClasses.badge}`}>
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
};
