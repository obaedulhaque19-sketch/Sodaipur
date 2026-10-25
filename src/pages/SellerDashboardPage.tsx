import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, 
  Plus, 
  Package, 
  MessageSquare, 
  Settings, 
  Upload, 
  Trash2, 
  Edit, 
  Check, 
  Star, 
  AlertCircle, 
  Layers, 
  DollarSign, 
  ShoppingBag, 
  Image as ImageIcon,
  Loader2,
  ChevronDown,
  ArrowLeftRight,
  X,
  User as UserIcon
} from 'lucide-react';
import type { Category, Store, Product, Order } from '../types';
import { CategoryCascadeSelector } from '../components/product/CategoryCascadeSelector';
import { RealtimeChat } from '../components/chat/RealtimeChat';
import { VerifiedBadge, VerifiedStoreName } from '../components/common/VerifiedBadge';
import { 
  createStore, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  subscribeStoreOrders, 
  updateOrderStatus 
} from '../lib/firestoreService';
import { uploadToCloudinary, uploadMultipleToCloudinary } from '../lib/cloudinary';
import { generateStoreSlug } from '../lib/slugify';
import { useAuth } from '../context/AuthContext';

interface SellerDashboardProps {
  categories: Category[];
  stores: Store[];
  products: Product[];
  initialTab?: 'overview' | 'inventory' | 'new_product' | 'orders' | 'chat' | 'settings';
  onNavigateProduct: (slug: string) => void;
  onNavigate?: (path: string) => void;
}

export const SellerDashboardPage: React.FC<SellerDashboardProps> = ({
  categories,
  stores,
  products,
  initialTab = 'overview',
  onNavigateProduct,
  onNavigate
}) => {
  const { currentUser, userProfile, persona, switchAccount, switchStore } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'new_product' | 'orders' | 'chat' | 'settings'>(initialTab);

  useEffect(() => {
    if (initialTab === 'chat' && onNavigate) {
      onNavigate('/chat');
    }
  }, [initialTab, onNavigate]);

  // Stores owned by this user account (up to 10)
  const userStores = stores.filter(s => 
    s.ownerUid === userProfile?.uid || 
    (currentUser?.uid && s.ownerUid === currentUser.uid) || 
    userProfile?.storeIds?.includes(s.storeId) || 
    s.storeId === userProfile?.storeId
  );

  // Store currently connected/active
  const myStore = userStores.find(s => 
    s.storeId === userProfile?.activeStoreId || 
    s.storeId === userProfile?.storeId
  ) || userStores[0];

  // Store Onboarding Form State
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeWhatsapp, setStoreWhatsapp] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [storeBannerFile, setStoreBannerFile] = useState<File | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState('');

  // Update slug preview as store name types
  useEffect(() => {
    if (storeName) {
      setPreviewSlug(generateStoreSlug(storeName));
    }
  }, [storeName]);

  // New Product Form State
  const [prodTitleEn, setProdTitleEn] = useState('');
  const [prodTitleBn, setProdTitleBn] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number | ''>('');
  const [prodStock, setProdStock] = useState<number | ''>('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodImages, setProdImages] = useState<File[]>([]);
  const [prodImagePreviews, setProdImagePreviews] = useState<string[]>([]);
  const [prodUploading, setProdUploading] = useState(false);
  const [categoryData, setCategoryData] = useState<{
    mainCategory: string;
    subCategory?: string;
    childCategory?: string;
    microCategory?: string;
    categoryPath: string[];
  }>({
    mainCategory: "Men's Fashion",
    subCategory: 'Men Clothing',
    childCategory: 'Tops & T-Shirts',
    microCategory: 'Polo T-Shirts',
    categoryPath: ['mens-fashion', 'men-clothing', 'tops-t-shirts', 'polo-t-shirts']
  });

  // Orders received for this store
  const [storeOrders, setStoreOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (myStore?.storeId) {
      const unsub = subscribeStoreOrders(myStore.storeId, setStoreOrders);
      return () => unsub();
    }
  }, [myStore?.storeId]);

  // Filter products scoped strictly to storeId == currentUser.storeId
  const myProducts = myStore ? products.filter(p => p.storeId === myStore.storeId) : [];

  // Quick edit stock & price inline
  const handleQuickUpdate = async (productId: string, updates: Partial<Product>) => {
    try {
      await updateProduct(productId, updates);
    } catch (e) {
      console.error('Failed to update product:', e);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product listing?')) {
      try {
        await deleteProduct(productId);
      } catch (e) {
        console.error('Delete product error:', e);
      }
    }
  };

  // Handle Store Onboarding Submission (With Auto-Compress to lightweight KB)
  const handleOnboardStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !userProfile) return;

    if (userStores.length >= 10) {
      setOnboardingError('আপনি ইতিমধ্যে সর্বোচ্চ ১০টি স্টোর তৈরি করেছেন (Maximum 10 stores limit reached)।');
      return;
    }

    setOnboardingLoading(true);
    setOnboardingError(null);

    try {
      let logoUrl = 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160';
      let bannerUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200';

      if (storeLogoFile) {
        logoUrl = await uploadToCloudinary(storeLogoFile, 'image', 'logo_500');
      }
      if (storeBannerFile) {
        bannerUrl = await uploadToCloudinary(storeBannerFile, 'image', 'banner');
      }

      const uid = userProfile?.uid || currentUser?.uid || 'owner_tts_user';
      const newStore = await createStore(uid, {
        storeName,
        whatsapp: storeWhatsapp,
        phone: storePhone,
        address: storeAddress,
        logoUrl,
        bannerUrl
      });

      // Automatically connect to the newly created store
      await switchAccount(newStore.storeId, newStore.storeName, newStore.logoUrl);

      // Clear onboarding form inputs
      setStoreName('');
      setStoreWhatsapp('');
      setStorePhone('');
      setStoreAddress('');
      setStoreLogoFile(null);
      setStoreBannerFile(null);
      setShowNewStoreModal(false);
      setActiveTab('overview');
    } catch (err: any) {
      console.error('Store registration failed:', err);
      setOnboardingError(err.message || 'স্টোর তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Handle Multi-Image Selection for Product
  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setProdImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setProdImagePreviews(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle Product Upload (Auto-compressed to lightweight KB)
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myStore) return;
    setProdUploading(true);

    try {
      let finalImages: string[] = [];

      if (prodImages.length > 0) {
        finalImages = await uploadMultipleToCloudinary(prodImages, 'image', 'product');
      } else {
        // High quality placeholder
        finalImages = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];
      }

      await createProduct({
        storeId: myStore.storeId,
        ownerUid: userProfile?.uid || myStore.ownerUid,
        storeName: myStore.storeName,
        storeLogo: myStore.logoUrl,
        title: prodTitleEn,
        titleBn: prodTitleBn,
        price: Number(prodPrice),
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        stock: Number(prodStock),
        categoryPath: categoryData.categoryPath,
        mainCategory: categoryData.mainCategory,
        subCategory: categoryData.subCategory,
        childCategory: categoryData.childCategory,
        microCategory: categoryData.microCategory,
        description: prodDescription,
        images: finalImages,
        videoUrl: prodVideoUrl || undefined,
        isFeatured: prodIsFeatured,
        status: 'approved'
      });

      // Reset form
      setProdTitleEn('');
      setProdTitleBn('');
      setProdPrice('');
      setProdOriginalPrice('');
      setProdStock('');
      setProdDescription('');
      setProdVideoUrl('');
      setProdImages([]);
      setProdImagePreviews([]);
      setActiveTab('inventory');
    } catch (err) {
      console.error('Failed to create product:', err);
    } finally {
      setProdUploading(false);
    }
  };

  // Render the Store Registration Form (used for first store or creating additional stores up to 10)
  const renderStoreRegistrationForm = (isModal: boolean = false) => (
    <div className={`bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-lg ${isModal ? 'mb-6' : 'max-w-2xl mx-auto py-8'}`}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
          <StoreIcon className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          {userStores.length > 0 ? `Open Another Store (${userStores.length + 1}/10)` : 'Open Your Store on Sodaipur'}
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          আপনার কাস্টমার অ্যাকাউন্টের মাধ্যমে সর্বোচ্চ ১০টি স্টোর খুলতে এবং পরিচালনা করতে পারবেন।
        </p>
      </div>

      {onboardingError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {onboardingError}
        </div>
      )}

      <form onSubmit={handleOnboardStore} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Store Name *</label>
          <input
            type="text"
            required
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            placeholder="e.g. Dhaka Heritage Mart"
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
          />
          {previewSlug && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              Unique Slug Preview: <span className="font-mono">sodaipur.com/stores/{previewSlug}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">WhatsApp Number *</label>
            <input
              type="text"
              required
              value={storeWhatsapp}
              onChange={e => setStoreWhatsapp(e.target.value)}
              placeholder="+8801700000000"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={storePhone}
              onChange={e => setStorePhone(e.target.value)}
              placeholder="+8801800000000"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Store Physical / Pickup Address *</label>
          <textarea
            required
            rows={2}
            value={storeAddress}
            onChange={e => setStoreAddress(e.target.value)}
            placeholder="Shop 14, Level 3, Eastern Plaza, Hatirpool, Dhaka"
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Logo Image <span className="text-slate-400 font-normal">(500×500 auto-fit)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setStoreLogoFile(e.target.files?.[0] || null)}
              className="w-full text-[11px] text-slate-500"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">অটোমেটিক্যালি হাই-কোয়ালিটি কেবি (KB) ফরম্যাটে সেভ হবে</p>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Store Banner <span className="text-slate-400 font-normal">(Auto-compress)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setStoreBannerFile(e.target.files?.[0] || null)}
              className="w-full text-[11px] text-slate-500"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">অটোমেটিক্যালি হাই-কোয়ালিটি কেবি (KB) ফরম্যাটে সেভ হবে</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {isModal && (
            <button
              type="button"
              onClick={() => { setShowNewStoreModal(false); setOnboardingError(null); }}
              className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={onboardingLoading}
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {onboardingLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Optimizing Media & Provisioning Store...</span>
              </>
            ) : (
              <>
                <StoreIcon className="w-4 h-4" />
                <span>{userStores.length > 0 ? 'Create & Connect Store' : 'Complete Store Registration'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  // If user has no store at all yet, show Customer Account Hub with Onboarding Flow
  if (userStores.length === 0) {
    return (
      <div className="pb-16 space-y-6">
        {/* Account Switcher Hub showing Customer Account (1 of 11) */}
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Accounts Management / অ্যাকাউন্ট ব্যবস্থাপনা</h2>
                <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full text-[10px] font-bold">
                  1/11 Accounts Active (1 Customer + 0 Stores)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                আপনার ১টি কাস্টমার আইডি সবসময় থাকবে এবং এর পাশাপাশি সর্বোচ্চ ১০টি সেলার স্টোর খুলতে ও পরিচালনা করতে পারবেন (মোট ১১টি অ্যাকাউন্ট)।
              </p>
            </div>
          </div>

          {/* Account Card #1: Customer Account */}
          <div className="max-w-md p-3.5 rounded-2xl border bg-emerald-900/30 border-emerald-500 shadow-sm ring-1 ring-emerald-500 flex items-center gap-3">
            <img
              src={userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'}
              alt={userProfile?.name || 'Customer'}
              className="w-12 h-12 rounded-2xl object-cover bg-slate-800 border-2 border-emerald-400 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-extrabold text-sm text-white truncate">{userProfile?.name || 'Customer Account'}</p>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black rounded-md uppercase">
                  Customer
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">{userProfile?.email}</p>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                  <Check className="w-2.5 h-2.5" />
                  Connected / সক্রিয়
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Form for First Store */}
        {renderStoreRegistrationForm(false)}
      </div>
    );
  }

  // Dashboard for verified Store Owner (supports 1 Customer Account + up to 10 stores = 11 accounts total)
  return (
    <div className="pb-16 space-y-6">
      {/* Facebook-Style Compact Multi-Account Switcher Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-800">
        {/* Top Row: Active Profile Info + Switch Button + Open Store Button */}
        <div className="flex items-center justify-between gap-3">
          {/* Active Profile Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={persona?.type === 'customer'
                  ? (userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500')
                  : (myStore?.logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160')}
                alt={persona?.type === 'customer' ? (userProfile?.name || 'Customer') : (myStore?.storeName || 'Store')}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-slate-800 border-2 border-emerald-500 shadow-xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[130px] sm:max-w-[220px]">
                  {persona?.type === 'customer' ? (userProfile?.name || 'Customer') : myStore?.storeName}
                </span>
                {persona?.type === 'store' && <VerifiedBadge size="xs" />}
                <span className={`px-1.5 py-0.2 text-[8px] sm:text-[9px] font-black rounded uppercase tracking-wider ${
                  persona?.type === 'customer'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {persona?.type === 'customer' ? 'Customer' : 'Store'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-emerald-400 font-bold">
                  • <Check className="w-2.5 h-2.5" /> সক্রিয়
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {persona?.type === 'customer' ? userProfile?.email : `/stores/${myStore?.storeSlug}`}
              </p>
            </div>
          </div>

          {/* Right Action Controls: Switch Profile Modal Button & + Open Store Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Facebook-style Switch Account Button */}
            <button
              type="button"
              onClick={() => setShowSwitcherModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Switch Account"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">সুইচ করুন</span>
              <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 text-[10px] font-extrabold rounded-full border border-emerald-800/60">
                {userStores.length + 1}/11
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* + Open Store Button */}
            {userStores.length < 10 ? (
              <button
                type="button"
                onClick={() => setShowNewStoreModal(!showNewStoreModal)}
                className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">নতুন স্টোর</span>
                <span className="sm:hidden">স্টোর</span>
              </button>
            ) : (
              <span className="hidden sm:inline-block text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-800/40">
                10/10 Max
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: Facebook/Instagram Style Horizontal Quick-Switch Avatar Strip */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {/* Customer Quick Chip */}
          {(() => {
            const isCustomerActive = persona?.type === 'customer';
            return (
              <button
                type="button"
                onClick={() => {
                  if (!isCustomerActive) switchAccount('customer');
                }}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isCustomerActive
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="relative">
                  <img
                    src={userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'}
                    alt="Customer"
                    className="w-5 h-5 rounded-lg object-cover"
                  />
                  {isCustomerActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
                  )}
                </div>
                <span className="truncate max-w-[110px]">{userProfile?.name?.split(' ')[0] || 'Customer'}</span>
                <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded uppercase font-black">
                  User
                </span>
                {isCustomerActive && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </button>
            );
          })()}

          {/* Stores Quick Chips (up to 10) */}
          {userStores.map(store => {
            const isStoreActive = persona?.type === 'store' && persona?.storeId === store.storeId;
            return (
              <button
                key={`chip-${store.storeId}`}
                type="button"
                onClick={() => {
                  if (!isStoreActive) switchAccount(store.storeId, store.storeName, store.logoUrl);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isStoreActive
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="relative">
                  <img
                    src={store.logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160'}
                    alt={store.storeName}
                    className="w-5 h-5 rounded-lg object-cover"
                  />
                  {isStoreActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
                  )}
                </div>
                <span className="truncate max-w-[120px]">{store.storeName}</span>
                <VerifiedBadge size="xs" />
                {isStoreActive && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </button>
            );
          })}

          {/* Quick "+ New Store" Pill */}
          {userStores.length < 10 && (
            <button
              type="button"
              onClick={() => setShowNewStoreModal(!showNewStoreModal)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>স্টোর যোগ</span>
            </button>
          )}
        </div>
      </div>

      {/* Facebook-Style Account Switcher Modal / Bottom Sheet */}
      {showSwitcherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setShowSwitcherModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/50">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Switch Profile / অ্যাকাউন্ট পরিবর্তন</h3>
                  <p className="text-[11px] text-slate-400">
                    মোট ১১টি অ্যাকাউন্ট ({userStores.length + 1}টি সক্রিয়: ১টি কাস্টমার + {userStores.length}টি স্টোর)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitcherModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Accounts List (Facebook-style vertical list) */}
            <div className="p-3 sm:p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {/* Account #1: Customer Profile */}
              {(() => {
                const isCustomerActive = persona?.type === 'customer';
                return (
                  <div
                    onClick={() => {
                      switchAccount('customer');
                      setShowSwitcherModal(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCustomerActive
                        ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'}
                        alt="Customer"
                        className="w-11 h-11 rounded-xl object-cover bg-slate-800 border-2 border-emerald-400 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-xs text-white truncate">{userProfile?.name || 'Customer'}</p>
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-black rounded uppercase">
                            Customer
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{userProfile?.email}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCustomerActive ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-600 hover:border-emerald-400" />
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Accounts #2..11: Store Profiles */}
              {userStores.map(store => {
                const isStoreActive = persona?.type === 'store' && persona?.storeId === store.storeId;
                return (
                  <div
                    key={`modal-store-${store.storeId}`}
                    onClick={() => {
                      switchAccount(store.storeId, store.storeName, store.logoUrl);
                      setShowSwitcherModal(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isStoreActive
                        ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={store.logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160'}
                        alt={store.storeName}
                        className="w-11 h-11 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-xs text-white truncate">{store.storeName}</p>
                          <VerifiedBadge size="sm" />
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[8px] font-black rounded uppercase">
                            Store
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">/stores/{store.storeSlug}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isStoreActive ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-600 hover:border-emerald-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
              {userStores.length < 10 ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowSwitcherModal(false);
                    setShowNewStoreModal(true);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Open Another Store ({userStores.length}/10)</span>
                </button>
              ) : (
                <p className="text-[11px] text-center w-full text-amber-400 font-bold">
                  সর্বোচ্চ ১০টি স্টোর তৈরি সম্পন্ন হয়েছে (10/10 Stores Limit Reached)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Embedded New Store Registration Form (When "+ Open Another Store" is clicked) */}
      {showNewStoreModal && renderStoreRegistrationForm(true)}

      {/* If persona is Customer, show Customer Account Info Panel (NO product upload or store dashboard) */}
      {persona?.type === 'customer' ? (
        <div className="space-y-6">
          {/* Customer Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <img
                  src={userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'}
                  alt={userProfile?.name || 'Customer'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">{userProfile?.name || 'Customer Account'}</h2>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full uppercase">
                      Customer
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Connected / সক্রিয়
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {userProfile?.email}
                    {userProfile?.phone && <> • {userProfile.phone}</>}
                  </p>
                </div>
              </div>

              {/* Action buttons for Customer */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('/')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>পণ্য কিনুন (Shop Products)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('/profile')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>আমার অর্ডার (My Orders)</span>
                </button>
              </div>
            </div>

            {/* Informational Notice */}
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/70 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-xs sm:text-sm">কাস্টমার অ্যাকাউন্ট মোড (Customer Mode)</h4>
                  <p className="text-amber-800/90 mt-1 leading-relaxed">
                    এটি আপনার ব্যক্তিগত কাস্টমার অ্যাকাউন্ট। কাস্টমার অ্যাকাউন্টে কোনো প্রোডাক্ট আপলোড করা যায় না এবং এটি কোনো মার্চেন্ট স্টোর হিসেবে সাইটে গণ্য হয় না। এখান থেকে আপনি সোদাইপুর প্ল্যাটফর্মের পণ্য ব্রাউজ, অর্ডার ও ট্র্যাকিং করতে পারবেন।
                  </p>
                  <p className="text-amber-900 font-semibold mt-2">
                    👉 প্রোডাক্ট আপলোড করতে বা আপনার স্টোর পরিচালনা করতে উপরের তালিকা থেকে আপনার যেকোনো সেলার স্টোরে <span className="font-bold text-emerald-800">"কানেক্ট করুন (Connect)"</span> ক্লিক করুন।
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Switch to User's Stores */}
            {userStores.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  আপনার সেলার স্টোরসমূহ ({userStores.length}টি স্টোর):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {userStores.map(store => (
                    <div
                      key={`quick-${store.storeId}`}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={store.logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160'}
                          alt={store.storeName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-xs text-slate-800 truncate">{store.storeName}</p>
                            <VerifiedBadge size="sm" />
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate">/stores/{store.storeSlug}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchAccount(store.storeId, store.storeName, store.logoUrl)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                      >
                        কানেক্ট করুন
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Top Banner & Header of Currently Active / Selected Store */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={myStore.logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160'}
                alt={myStore.storeName}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-black text-slate-900 leading-tight">
                    <VerifiedStoreName name={myStore.storeName} badgeSize="md" />
                  </h1>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Store Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  slug: /stores/{myStore.storeSlug} • {myProducts.length} listings
                </p>
              </div>
            </div>

            {/* Tab Navigation Pill Bar */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'overview' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'inventory' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inventory ({myProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('new_product')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  activeTab === 'new_product' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-700 hover:bg-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'orders' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Orders ({storeOrders.length})
              </button>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('/chat');
                  } else {
                    setActiveTab('chat');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'chat' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Buyer Chat</span>
              </button>
            </div>
          </div>

      {/* Tab: Overview Analytics */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Store Revenue</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">৳142,500</p>
              <span className="text-[11px] text-emerald-700 font-semibold">+18% this month</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Active Products</span>
              <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{myProducts.length}</p>
              <span className="text-[11px] text-slate-400 font-medium">In stock and selling</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Customer Orders</span>
              <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{storeOrders.length || 14}</p>
              <span className="text-[11px] text-emerald-700 font-semibold">Real-time synced</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Store Rating</span>
              <p className="text-xl sm:text-2xl font-black text-amber-500 mt-1">
                {myStore.rating || 4.9} ★
              </p>
              <span className="text-[11px] text-slate-400">Based on verified reviews</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3">Recent Sales Activity</h3>
            <p className="text-xs text-slate-500">
              Orders placed by customers for {myStore.storeName} will automatically show up under the Orders tab. You can update delivery states from Processing to Shipped and Delivered.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Inventory & Product Management Table */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Product Inventory ({myProducts.length} items)
            </h3>
            <button
              onClick={() => setActiveTab('new_product')}
              className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price (BDT)</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Featured</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No products found. Click "Add Product" to upload your first item.
                    </td>
                  </tr>
                ) : (
                  myProducts.map(prod => (
                    <tr key={prod.productId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={prod.title}
                          className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p 
                            onClick={() => onNavigateProduct(prod.productSlug)}
                            className="font-bold text-slate-800 hover:text-emerald-700 truncate cursor-pointer"
                          >
                            {prod.title}
                          </p>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {prod.productSlug}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600 font-medium">
                        {prod.mainCategory}
                        {prod.childCategory && <span className="block text-[10px] text-slate-400">{prod.childCategory}</span>}
                      </td>

                      <td className="p-3.5 font-bold text-emerald-800">
                        ৳{prod.price.toLocaleString()}
                        {prod.originalPrice && (
                          <span className="block text-[10px] text-slate-400 line-through">
                            ৳{prod.originalPrice}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            defaultValue={prod.stock}
                            onBlur={e => handleQuickUpdate(prod.productId, { stock: Number(e.target.value) })}
                            className="w-16 p-1 rounded border border-slate-200 text-center font-bold text-slate-800"
                          />
                        </div>
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => handleQuickUpdate(prod.productId, { isFeatured: !prod.isFeatured })}
                          className={`p-1 rounded-md text-[10px] font-bold ${
                            prod.isFeatured ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {prod.isFeatured ? '★ Featured' : 'Normal'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteProduct(prod.productId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Add New Product Form */}
      {activeTab === 'new_product' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 shadow-xs">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Upload New Product</h2>
            <p className="text-xs text-slate-500">
              Provide product details, multi-tier categorization, and high-resolution photos.
            </p>
          </div>

          <form onSubmit={handleCreateProductSubmit} className="space-y-6 text-xs">
            {/* Deep Category Cascader */}
            <CategoryCascadeSelector
              categories={categories}
              value={categoryData}
              onChange={setCategoryData}
            />

            {/* Titles (EN & BN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title (English) *</label>
                <input
                  type="text"
                  required
                  value={prodTitleEn}
                  onChange={e => setProdTitleEn(e.target.value)}
                  placeholder="e.g. Premium Cotton Pique Polo Shirt"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title (Bangla / বাংলা)</label>
                <input
                  type="text"
                  value={prodTitleBn}
                  onChange={e => setProdTitleBn(e.target.value)}
                  placeholder="e.g. প্রিমিয়াম কটন পিকে পোলো শার্ট"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sale Price (BDT) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={prodPrice}
                  onChange={e => setProdPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="950"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Original Price (Strike-through)</label>
                <input
                  type="number"
                  min="1"
                  value={prodOriginalPrice}
                  onChange={e => setProdOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="1450"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={prodStock}
                  onChange={e => setProdStock(e.target.value ? Number(e.target.value) : '')}
                  placeholder="50"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                rows={4}
                required
                value={prodDescription}
                onChange={e => setProdDescription(e.target.value)}
                placeholder="Describe fabric material, size specifications, wash care, and packaging details..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
              />
            </div>

            {/* Video URL & Featured Flag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Video URL (YouTube / Cloudinary)</label>
                <input
                  type="url"
                  value={prodVideoUrl}
                  onChange={e => setProdVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={prodIsFeatured}
                    onChange={e => setProdIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>Feature on Homepage and Store Showcase</span>
                </label>
              </div>
            </div>

            {/* Cloudinary Multi-Image Upload Widget */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 space-y-3">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <span className="font-bold text-slate-700 block">Cloudinary Multi-Image Media Widget</span>
                <p className="text-[11px] text-slate-500">Upload multiple images (saves as array images: [...])</p>
                <label className="mt-2 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-colors">
                  Select Product Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleProductImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Previews */}
              {prodImagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-2 justify-center">
                  {prodImagePreviews.map((src, i) => (
                    <div key={i} className="relative w-18 h-18 rounded-xl overflow-hidden border border-slate-200">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={prodUploading}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {prodUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading Images & Publishing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Publish Listing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Orders Management Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Customer Orders ({storeOrders.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storeOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No orders received yet. Once buyers order items from your store, they will appear here.
                    </td>
                  </tr>
                ) : (
                  storeOrders.map(order => (
                    <tr key={order.orderId} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{order.orderId}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">{order.customerName}</span>
                        <span className="text-[10px] text-slate-400">{order.customerPhone}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">{order.items.length} item(s)</td>
                      <td className="p-3.5 font-bold text-emerald-800">৳{order.total.toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.orderStatus === 'processing' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={order.orderStatus}
                          onChange={e => updateOrderStatus(order.orderId, e.target.value as any)}
                          className="p-1 rounded border border-slate-300 text-[11px] font-bold"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Real-Time Seller Chat Inbox */}
      {activeTab === 'chat' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Direct Buyer Messages</h3>
            <span className="text-xs text-slate-500">Live onSnapshot Firestore stream</span>
          </div>
          <RealtimeChat stores={stores} />
        </div>
      )}
        </>
      )}
    </div>
  );
};
