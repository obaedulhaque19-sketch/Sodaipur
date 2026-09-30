import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { PriceTag } from '../common/PriceTag';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface CartDrawerProps {
  onNavigateCheckout: () => void;
  onNavigateProduct: (slug: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  onNavigateCheckout,
  onNavigateProduct 
}) => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    shippingFee, 
    shippingZone, 
    setShippingZone,
    couponCode,
    discount,
    applyCoupon,
    removeCoupon,
    total 
  } = useCart();
  const { lang, t } = useLanguage();
  const [couponInput, setCouponInput] = React.useState('');
  const [couponMsg, setCouponMsg] = React.useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponMsg(res.message);
    if (res.success) setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-700" />
            <h2 className="font-bold text-slate-800 text-base sm:text-lg">
              {lang === 'bn' ? 'শপিং ব্যাগ' : 'Shopping Cart'} ({cartItems.length})
            </h2>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-16 h-16 stroke-1 mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">Your cart is currently empty</p>
              <p className="text-xs text-slate-400 mt-1">Explore authentic products from local verified stores</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.product.productId} className="pt-3 flex gap-3">
                <img 
                  src={item.product.images?.[0]} 
                  alt={item.product.title} 
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigateProduct(item.product.productSlug);
                  }}
                  className="w-18 h-18 rounded-lg object-cover bg-slate-50 shrink-0 cursor-pointer border border-slate-100"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 
                      onClick={() => {
                        setIsCartOpen(false);
                        onNavigateProduct(item.product.productSlug);
                      }}
                      className="text-xs font-semibold text-slate-800 line-clamp-1 hover:text-emerald-700 cursor-pointer"
                    >
                      {item.product.title}
                    </h4>
                    {item.product.storeName && (
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                        <span>{item.product.storeName}</span>
                        <VerifiedBadge size="xs" />
                      </span>
                    )}
                    <div className="mt-1">
                      <PriceTag price={item.product.price} originalPrice={item.product.originalPrice} size="sm" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-slate-200 rounded-md">
                      <button
                        onClick={() => updateQuantity(item.product.productId, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded-l-md"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-700 min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.productId, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded-r-md"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.productId)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            {/* Delivery Zone Selector */}
            <div className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-medium">Delivery:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShippingZone('inside_dhaka')}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    shippingZone === 'inside_dhaka'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Inside Dhaka (৳60)
                </button>
                <button
                  onClick={() => setShippingZone('outside_dhaka')}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    shippingZone === 'outside_dhaka'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Outside (৳120)
                </button>
              </div>
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  placeholder="Coupon: SODAIPUR10"
                  className="w-full text-xs pl-8 pr-2 py-2 rounded-lg border border-slate-200 bg-white uppercase focus:outline-emerald-600 font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                Apply
              </button>
            </form>

            {couponMsg && (
              <p className={`text-[11px] font-medium ${discount > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {couponMsg}
              </p>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>{t('lbl.subtotal')}</span>
                <span className="font-semibold text-slate-800">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('lbl.shipping')}</span>
                <span>৳{shippingFee}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    Coupon ({couponCode})
                    <button onClick={removeCoupon} className="text-rose-500 hover:underline text-[10px]">
                      (remove)
                    </button>
                  </span>
                  <span>-৳{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>{t('lbl.total')}</span>
                <span className="text-emerald-700 text-base">৳{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                onNavigateCheckout();
              }}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>{t('btn.checkout')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
