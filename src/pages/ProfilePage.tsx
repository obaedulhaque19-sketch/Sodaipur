import React from 'react';
import { User, Store, ShieldCheck, ShoppingBag, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProfilePageProps {
  onNavigateOrders: () => void;
  onNavigateSeller: () => void;
  onNavigateAdmin: () => void;
  onOpenAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigateOrders,
  onNavigateSeller,
  onNavigateAdmin,
  onOpenAuth
}) => {
  const { currentUser, userProfile, logout, switchDemoRole } = useAuth();

  if (!currentUser && !userProfile) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <User className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Account Access</h2>
        <p className="text-xs text-slate-500">Sign in to view your orders, store profile, and saved settings.</p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-xs"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center">
            {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">{userProfile?.name || 'Sodaipur User'}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                userProfile?.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                userProfile?.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                {userProfile?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{userProfile?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Role Navigation Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={onNavigateOrders}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs text-left group"
        >
          <ShoppingBag className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-xs text-slate-800">My Orders & Tracking</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Check order status, invoices & history</p>
        </button>

        <button
          onClick={onNavigateSeller}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs text-left group"
        >
          <Store className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-xs text-slate-800">Seller Center</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage products, inventory & orders</p>
        </button>

        <button
          onClick={onNavigateAdmin}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs text-left group"
        >
          <ShieldCheck className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-xs text-slate-800">Super Admin Panel</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Platform governance, moderation & taxonomy</p>
        </button>
      </div>

      {/* Switch Demo Persona Box for easy testing */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-800">Switch Test Persona</h3>
        <p className="text-xs text-slate-500">
          Switch role instantly to test Customer, Verified Merchant (TTS Fashion), or Super Admin features:
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => switchDemoRole('customer')}
            className={`p-3 rounded-xl border text-xs font-bold text-center ${
              userProfile?.role === 'customer' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-700'
            }`}
          >
            Buyer Persona
          </button>
          <button
            onClick={() => switchDemoRole('owner')}
            className={`p-3 rounded-xl border text-xs font-bold text-center ${
              userProfile?.role === 'owner' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700'
            }`}
          >
            Seller (TTS Fashion)
          </button>
          <button
            onClick={() => switchDemoRole('admin')}
            className={`p-3 rounded-xl border text-xs font-bold text-center ${
              userProfile?.role === 'admin' ? 'border-rose-600 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-700'
            }`}
          >
            Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};
