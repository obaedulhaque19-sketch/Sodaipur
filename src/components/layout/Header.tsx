import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingBag, 
  MessageSquare, 
  User, 
  ChevronDown, 
  Store, 
  ShieldCheck, 
  Package, 
  Globe, 
  LogOut, 
  Menu, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Category, Product } from '../../types';

interface HeaderProps {
  categories: Category[];
  products: Product[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  products,
  currentPath,
  onNavigate,
  onOpenAuth
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { lang, setLang, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter dynamic auto-suggestions based on search query
  const suggestions = searchQuery.trim().length > 1
    ? products
        .filter(p => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.titleBn && p.titleBn.includes(searchQuery)) ||
          p.mainCategory.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const mainCategories = categories.filter(c => c.level === 0);

  return (
    <header className="relative z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Top Banner / Utility Bar (Desktop only) */}
      <div className="hidden xl:block bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-semibold">⚡ Sodaipur Express</span>
            <span className="text-slate-400">Authentic Multi-Vendor Marketplace of Bangladesh</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => onNavigate('/orders')}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>{t('nav.orders')}</span>
            </button>

            {userProfile?.role === 'owner' ? (
              <button
                onClick={() => onNavigate('/seller/dashboard')}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Seller Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/seller/dashboard')}
                className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Become a Seller</span>
              </button>
            )}

            {userProfile?.role === 'admin' && (
              <button
                onClick={() => onNavigate('/admin')}
                className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>
            )}

            {/* Language switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[11px] font-bold text-white transition-colors cursor-pointer"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-3 h-14 sm:h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-800/20">
              S
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 block leading-tight">
                Sodaipur
              </span>
              <span className="text-[10px] font-bold text-emerald-700 tracking-wider block -mt-1 font-bangla">
                সোদাইপুর
              </span>
            </div>
          </div>

          {/* Desktop Categories Dropdown Trigger */}
          <div className="hidden xl:block relative">
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <Menu className="w-4 h-4 text-emerald-700" />
              <span>{t('nav.categories')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showCategoryMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Top Categories
                </div>
                {mainCategories.map(cat => (
                  <button
                    key={cat.categoryId}
                    onClick={() => {
                      setShowCategoryMenu(false);
                      onNavigate(`/search?category=${cat.slug}`);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                  >
                    <span>{lang === 'bn' && cat.nameBn ? cat.nameBn : cat.name}</span>
                    <span className="text-slate-400 text-[10px]">→</span>
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowCategoryMenu(false);
                      onNavigate('/search');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                  >
                    View All Categories & Taxonomy →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar with Dynamic Auto-Suggestions */}
          <div ref={searchRef} className="flex-1 min-w-0 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full text-xs sm:text-sm pl-8 sm:pl-10 pr-18 sm:pr-20 py-1.5 sm:py-2.5 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition-all font-medium text-slate-800 shadow-inner-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 sm:px-4 py-1 sm:py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-full transition-colors"
              >
                Search
              </button>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                <div className="p-2 border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggestions ({suggestions.length})
                </div>
                {suggestions.map(item => (
                  <div
                    key={item.productId}
                    onClick={() => {
                      setShowSuggestions(false);
                      onNavigate(`/products/${item.productSlug}`);
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                  >
                    <img 
                      src={item.images[0]} 
                      alt={item.title} 
                      className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[11px] text-emerald-700 font-bold">৳{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Icons (Chat, Cart, User - Shown on desktop, mobile has dedicated bottom nav and floating cart) */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {/* Direct Chat icon (Hidden on mobile phones where bottom navigation already has Chat) */}
            <button
              onClick={() => onNavigate('/chat')}
              title="Real-time Chat"
              className="hidden xl:flex p-2 rounded-full hover:bg-slate-100 text-slate-700 relative transition-colors cursor-pointer items-center justify-center"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Shopping Cart button with dynamic badge (Hidden on mobile phones, shown on desktop) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="hidden xl:flex p-2 rounded-full hover:bg-slate-100 text-slate-700 relative transition-colors cursor-pointer items-center justify-center"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-emerald-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Sign In Dropdown */}
            <div className="relative">
              {userProfile ? (
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                      {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block mr-1" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800 truncate">{userProfile.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{userProfile.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          userProfile.role === 'admin' 
                            ? 'bg-rose-100 text-rose-700' 
                            : userProfile.role === 'owner' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {userProfile.role}
                        </span>
                      </div>

                      <button
                        onClick={() => { setShowUserMenu(false); onNavigate('/profile'); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Account</span>
                      </button>

                      <button
                        onClick={() => { setShowUserMenu(false); onNavigate('/orders'); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>My Orders</span>
                      </button>

                      {userProfile.role === 'owner' && (
                        <button
                          onClick={() => { setShowUserMenu(false); onNavigate('/seller/dashboard'); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                        >
                          <Store className="w-4 h-4 text-blue-600" />
                          <span>Seller Dashboard</span>
                        </button>
                      )}

                      {userProfile.role === 'admin' && (
                        <button
                          onClick={() => { setShowUserMenu(false); onNavigate('/admin'); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-rose-600" />
                          <span>Super Admin Panel</span>
                        </button>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => { setShowUserMenu(false); logout(); }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
