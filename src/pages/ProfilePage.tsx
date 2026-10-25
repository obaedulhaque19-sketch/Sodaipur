import React, { useState } from 'react';
import { User, Store, ShieldCheck, ShoppingBag, LogOut, CheckCircle2, MessageSquare, Camera, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary } from '../lib/cloudinary';
import type { UserRole } from '../types';

interface ProfilePageProps {
  onNavigateOrders: () => void;
  onNavigateChat: () => void;
  onNavigateSeller: () => void;
  onNavigateAdmin: () => void;
  onOpenAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigateOrders,
  onNavigateChat,
  onNavigateSeller,
  onNavigateAdmin,
  onOpenAuth
}) => {
  const { currentUser, userProfile, persona, logout, switchDemoRole, updateProfileData } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'image', 'avatar_500');
      await updateProfileData({ avatarUrl: url });
    } catch (err) {
      console.error('Failed to update avatar:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

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
      {/* Profile Header (Reflects Connected Store or Customer Account) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-xs">
              {avatarUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
              ) : persona?.avatarUrl ? (
                <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" />
              ) : (
                persona?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            {persona?.type === 'customer' && (
              <label className="absolute -bottom-1 -right-1 p-1 bg-white hover:bg-slate-50 rounded-full border border-slate-300 shadow-xs cursor-pointer text-slate-600 transition-colors" title="Change Customer Profile Picture (500x500)">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900">{persona?.name || 'Sodaipur User'}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                persona?.type === 'store' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                <Check className="w-2.5 h-2.5" />
                {persona?.roleLabel}
              </span>
              {userProfile?.role === 'admin' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{persona?.email}</p>
            {userProfile?.storeIds && userProfile.storeIds.length > 0 && (
              <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                Total Accounts: 1 Customer + {userProfile.storeIds.length} Stores ({userProfile.storeIds.length + 1} of 11)
              </p>
            )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={onNavigateOrders}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs text-left group cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-xs text-slate-800">My Orders</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Check order status & tracking</p>
        </button>

        <button
          onClick={onNavigateChat}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs text-left group cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-xs text-slate-800">Direct Messages</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Live chat with sellers & buyers</p>
        </button>

        <button
          onClick={onNavigateSeller}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs text-left group cursor-pointer"
        >
          <Store className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-xs text-slate-800">Seller Center</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage products & inventory</p>
        </button>

        <button
          onClick={onNavigateAdmin}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs text-left group cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-xs text-slate-800">Super Admin</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Platform governance & moderation</p>
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
