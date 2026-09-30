import React, { useState } from 'react';
import { Home, Grid, MessageSquare, User, Store, ShieldCheck, Package, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenAuth: () => void;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({
  currentPath,
  onNavigate,
  onOpenAuth
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isHome = currentPath === '/';
  const isCategories = currentPath === '/search' || currentPath.startsWith('/search');
  const isChat = currentPath === '/chat';
  const isProfile = currentPath === '/profile' || currentPath === '/seller/dashboard' || currentPath === '/admin' || currentPath === '/orders';

  return (
    <>
      {/* Mobile & Tablet Bottom Navigation Bar - Fixed and Persistent */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-lg border-t border-slate-200/90 py-1.5 sm:py-2 px-3 sm:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none">
        <div className="max-w-2xl mx-auto grid grid-cols-4 items-center gap-1 sm:gap-4">
          {/* Tab 1: Home */}
          <button
            onClick={() => {
              setShowUserMenu(false);
              onNavigate('/');
            }}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all active:scale-95 cursor-pointer ${
              isHome ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 stroke-[2.2]" />
            <span className="text-[10px] sm:text-xs tracking-tight">{t('nav.home')}</span>
          </button>

          {/* Tab 2: Categories */}
          <button
            onClick={() => {
              setShowUserMenu(false);
              onNavigate('/search');
            }}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all active:scale-95 cursor-pointer ${
              isCategories ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            <Grid className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 stroke-[2.2]" />
            <span className="text-[10px] sm:text-xs tracking-tight">{t('nav.categories')}</span>
          </button>

          {/* Tab 3: Chat */}
          <button
            onClick={() => {
              setShowUserMenu(false);
              onNavigate('/chat');
            }}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all active:scale-95 cursor-pointer relative ${
              isChat ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 stroke-[2.2]" />
            <span className="text-[10px] sm:text-xs tracking-tight">{t('nav.chat')}</span>
          </button>

          {/* Tab 4: User Profile / Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!currentUser && !userProfile) {
                  onOpenAuth();
                } else {
                  setShowUserMenu(!showUserMenu);
                }
              }}
              className={`w-full flex flex-col items-center justify-center py-1 sm:py-1.5 transition-all active:scale-95 cursor-pointer ${
                isProfile || showUserMenu ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              {userProfile ? (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs sm:text-sm flex items-center justify-center mb-0.5 sm:mb-1 border border-emerald-300 shadow-xs">
                  {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              ) : (
                <User className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 stroke-[2.2]" />
              )}
              <span className="text-[10px] sm:text-xs truncate max-w-[80px]">
                {userProfile ? (userProfile.name?.split(' ')[0] || 'Account') : t('nav.profile')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Upward Account Menu when user taps on Profile Tab */}
      {showUserMenu && userProfile && (
        <>
          {/* Backdrop */}
          <div
            className="xl:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-2xs"
            onClick={() => setShowUserMenu(false)}
          />

          {/* Popover Menu anchored above the bottom profile tab */}
          <div className="xl:hidden fixed bottom-[64px] sm:bottom-[72px] right-2 sm:right-6 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* User Profile Header */}
            <div className="px-4 py-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0">
                  {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{userProfile.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{userProfile.email}</p>
                </div>
              </div>
              <span className={`inline-block mt-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                userProfile.role === 'admin' 
                  ? 'bg-rose-100 text-rose-700' 
                  : userProfile.role === 'owner' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {userProfile.role}
              </span>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('/profile');
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium"
              >
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span>My Account</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('/orders');
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium"
              >
                <Package className="w-4 h-4 text-slate-400 shrink-0" />
                <span>My Orders</span>
              </button>

              {userProfile.role === 'owner' && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('/seller/dashboard');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Seller Dashboard</span>
                </button>
              )}

              {userProfile.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('/admin');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Super Admin Panel</span>
                </button>
              )}

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
