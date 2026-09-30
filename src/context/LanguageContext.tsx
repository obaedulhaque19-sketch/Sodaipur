import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, { en: string; bn: string }> = {
  // Navigation
  'nav.home': { en: 'Home', bn: 'হোম' },
  'nav.categories': { en: 'Categories', bn: 'ক্যাটাগরি' },
  'nav.chat': { en: 'Chat', bn: 'সেলার চ্যাট' },
  'nav.profile': { en: 'Profile', bn: 'প্রোফাইল' },
  'nav.cart': { en: 'Cart', bn: 'ব্যাগ' },
  'nav.orders': { en: 'Track Order', bn: 'অর্ডার ট্র্যাক' },
  'nav.sellerCenter': { en: 'Seller Center', bn: 'সেলার সেন্টার' },
  'nav.adminPanel': { en: 'Admin Panel', bn: 'এডমিন প্যানেল' },
  'nav.login': { en: 'Sign In / Register', bn: 'লগইন / রেজিস্টার' },
  'nav.searchPlaceholder': { en: 'Search 50,000+ authentic products in Sodaipur...', bn: 'সোদাইপুরে ৫০,০০০+ আসল পণ্য খুঁজুন...' },

  // General Buttons & Badges
  'btn.addToCart': { en: 'Add to Cart', bn: 'কার্টে যোগ করুন' },
  'btn.buyNow': { en: 'Buy Now', bn: 'এখনই কিনুন' },
  'btn.chatSeller': { en: 'Chat with Seller', bn: 'সেলার সাথে চ্যাট' },
  'btn.checkout': { en: 'Proceed to Checkout', bn: 'চেকআউট করুন' },
  'btn.viewStore': { en: 'Visit Store', bn: 'দোকান দেখুন' },
  'btn.apply': { en: 'Apply', bn: 'প্রয়োগ করুন' },

  // Sections
  'section.featuredStores': { en: 'Featured Official Stores', bn: 'অনুমোদিত জনপ্রিয় স্টোর' },
  'section.flashDeals': { en: 'Flash Deals & Today Offers', bn: 'আজকের সেরা ছাড়' },
  'section.allProducts': { en: 'Discover Authentic Products', bn: 'সোদাইপুরের সেরা পণ্যসমূহ' },
  'section.verifiedSeller': { en: 'Verified Seller', bn: 'ভেরিফায়েড সেলার' },
  'section.fastDelivery': { en: 'Fast Delivery in Bangladesh', bn: 'দ্রুত ডেলিভারি' },
  'section.cashOnDelivery': { en: 'Cash on Delivery Available', bn: 'ক্যাশ অন ডেলিভারি' },
  'section.genuineProduct': { en: '100% Authentic Products', bn: '১০০% আসল পণ্যের নিশ্চয়তা' },

  // Details
  'lbl.price': { en: 'Price', bn: 'মূল্য' },
  'lbl.inStock': { en: 'In Stock', bn: 'স্টকে আছে' },
  'lbl.outOfStock': { en: 'Out of Stock', bn: 'স্টক শেষ' },
  'lbl.soldBy': { en: 'Sold by', bn: 'বিক্রেতা' },
  'lbl.subtotal': { en: 'Subtotal', bn: 'মোট মূল্য' },
  'lbl.shipping': { en: 'Delivery Charge', bn: 'ডেলিভারি চার্জ' },
  'lbl.discount': { en: 'Discount', bn: 'ছাড়' },
  'lbl.total': { en: 'Total Amount', bn: 'সর্বমোট' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('sodaipur_lang') as Language;
    if (saved === 'en' || saved === 'bn') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('sodaipur_lang', newLang);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][lang] || translations[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
