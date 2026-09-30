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
  Loader2
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
}

export const SellerDashboardPage: React.FC<SellerDashboardProps> = ({
  categories,
  stores,
  products,
  initialTab = 'overview',
  onNavigateProduct
}) => {
  const { currentUser, userProfile, updateProfileData } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'new_product' | 'orders' | 'chat' | 'settings'>(initialTab);

  // Store profile of current logged-in owner
  const myStore = stores.find(s => s.storeId === userProfile?.storeId || s.ownerUid === userProfile?.uid);

  // Store Onboarding Form State
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeWhatsapp, setStoreWhatsapp] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [storeBannerFile, setStoreBannerFile] = useState<File | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
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

  // Handle Store Onboarding Submission
  const handleOnboardStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !userProfile) return;
    setOnboardingLoading(true);

    try {
      let logoUrl = 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160';
      let bannerUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200';

      if (storeLogoFile) {
        logoUrl = await uploadToCloudinary(storeLogoFile);
      }
      if (storeBannerFile) {
        bannerUrl = await uploadToCloudinary(storeBannerFile);
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

      await updateProfileData({ role: 'owner', storeId: newStore.storeId });
      setActiveTab('overview');
    } catch (err) {
      console.error('Store registration failed:', err);
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

  // Handle Product Upload
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myStore) return;
    setProdUploading(true);

    try {
      let finalImages: string[] = [];

      if (prodImages.length > 0) {
        finalImages = await uploadMultipleToCloudinary(prodImages);
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

  // If user is not yet a store owner and has no store, show Onboarding Flow
  if (!myStore) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
              <StoreIcon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Open Your Store on Sodaipur</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Join 500+ verified merchants. Enjoy direct buyer chat, zero listing fee, and instant automated SEO permalink generation.
            </p>
          </div>

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
                <label className="block font-bold text-slate-700 mb-1">Logo Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setStoreLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-[11px] text-slate-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setStoreBannerFile(e.target.files?.[0] || null)}
                  className="w-full text-[11px] text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={onboardingLoading}
              className="w-full mt-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {onboardingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Slug & Provisioning Store...</span>
                </>
              ) : (
                <>
                  <StoreIcon className="w-4 h-4" />
                  <span>Complete Store Registration</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard for verified Store Owner
  return (
    <div className="pb-16 space-y-6">
      {/* Top Banner & Store Header */}
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
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">
                {myStore.status}
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
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
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
    </div>
  );
};
