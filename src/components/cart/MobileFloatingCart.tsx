import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const MobileFloatingCart: React.FC = () => {
  const { cartItems, setIsCartOpen } = useCart();
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      title="Shopping Cart / শপিং ব্যাগ"
      aria-label="Shopping Cart"
      className="xl:hidden fixed bottom-[68px] sm:bottom-[88px] right-3 sm:right-6 z-50 w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90 shadow-md sm:shadow-2xl hover:bg-white hover:border-emerald-600 flex items-center justify-center cursor-pointer active:scale-95 transition-all select-none group"
    >
      <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 group-hover:text-emerald-700 transition-colors" />
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] sm:min-w-[22px] sm:h-[22px] px-1 bg-emerald-700 text-white text-[10px] sm:text-xs font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          {itemCount}
        </span>
      )}
    </button>
  );
};
