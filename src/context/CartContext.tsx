import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  shippingFee: number;
  shippingZone: 'inside_dhaka' | 'outside_dhaka';
  setShippingZone: (zone: 'inside_dhaka' | 'outside_dhaka') => void;
  couponCode: string;
  discount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sodaipur_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingZone, setShippingZone] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    localStorage.setItem('sodaipur_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1, selectedColor?: string, selectedSize?: string) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.productId === product.productId);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [...prev, { product, quantity, selectedColor, selectedSize }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.product.productId === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    setCouponCode('');
    setDiscount(0);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const shippingFee = cartItems.length === 0 ? 0 : (shippingZone === 'inside_dhaka' ? 60 : 120);

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'SODAIPUR10') {
      const disc = Math.round(subtotal * 0.10);
      setDiscount(disc);
      setCouponCode(clean);
      return { success: true, message: 'Coupon SODAIPUR10 applied! 10% discount added.' };
    }
    if (clean === 'EID50' || clean === 'WELCOME50') {
      const disc = Math.min(50, subtotal);
      setDiscount(disc);
      setCouponCode(clean);
      return { success: true, message: 'Coupon applied! ৳50 discount added.' };
    }
    return { success: false, message: 'Invalid coupon code. Try SODAIPUR10 or EID50' };
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscount(0);
  };

  const total = Math.max(0, subtotal + shippingFee - discount);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      subtotal,
      shippingFee,
      shippingZone,
      setShippingZone,
      couponCode,
      discount,
      applyCoupon,
      removeCoupon,
      total,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
