import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { getUserCartFromFirestore, saveUserCartToFirestore } from '../lib/firestoreService';

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

export const CartProvider: React.FC<{ children: React.ReactNode; onRequireAuth?: () => void }> = ({ children, onRequireAuth }) => {
  const { currentUser, loading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sodaipur_cart_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingZone, setShippingZone] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Sync cart with Firestore when user logs in or auth resolves
  useEffect(() => {
    if (loading) return; // Wait until auth state resolves

    if (currentUser?.uid) {
      const userCacheKey = `sodaipur_cart_${currentUser.uid}`;
      // 1. Immediately read user-specific localStorage cache if available for instant UI rendering
      try {
        const localCached = localStorage.getItem(userCacheKey);
        if (localCached) {
          const parsed = JSON.parse(localCached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCartItems(parsed);
          }
        }
      } catch {}

      // 2. Fetch authoritative user's saved cart from Firestore
      getUserCartFromFirestore(currentUser.uid).then(remoteCart => {
        if (Array.isArray(remoteCart)) {
          setCartItems(remoteCart);
          try {
            localStorage.setItem(userCacheKey, JSON.stringify(remoteCart));
          } catch {}
        }
      });
    } else {
      // User is logged out
      setCartItems([]);
      setCouponCode('');
      setDiscount(0);
    }
  }, [currentUser?.uid, loading]);

  const addToCart = (product: Product, quantity: number = 1, selectedColor?: string, selectedSize?: string) => {
    // Require authentication before adding to cart
    if (!currentUser) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.productId === product.productId);
      let updated: CartItem[];
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
      } else {
        const newItem: CartItem = { product, quantity };
        if (selectedColor) newItem.selectedColor = selectedColor;
        if (selectedSize) newItem.selectedSize = selectedSize;
        updated = [...prev, newItem];
      }

      // Explicitly persist only on user action - never passively wiped
      if (currentUser?.uid) {
        saveUserCartToFirestore(currentUser.uid, updated);
        try {
          localStorage.setItem(`sodaipur_cart_${currentUser.uid}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.product.productId !== productId);
      if (currentUser?.uid) {
        saveUserCartToFirestore(currentUser.uid, updated);
        try {
          localStorage.setItem(`sodaipur_cart_${currentUser.uid}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => {
      const updated = prev.map(item => 
        item.product.productId === productId ? { ...item, quantity } : item
      );
      if (currentUser?.uid) {
        saveUserCartToFirestore(currentUser.uid, updated);
        try {
          localStorage.setItem(`sodaipur_cart_${currentUser.uid}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCouponCode('');
    setDiscount(0);
    if (currentUser?.uid) {
      saveUserCartToFirestore(currentUser.uid, []);
      try {
        localStorage.removeItem(`sodaipur_cart_${currentUser.uid}`);
      } catch {}
    }
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
