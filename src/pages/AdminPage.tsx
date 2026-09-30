import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Store as StoreIcon, 
  Package, 
  DollarSign, 
  Check, 
  X, 
  Trash2, 
  Star, 
  Plus, 
  Layers, 
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import type { Category, Store, Product, Banner } from '../types';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { 
  updateStoreStatus, 
  updateProduct, 
  deleteProduct, 
  addCategory, 
  deleteCategory, 
  addBanner, 
  deleteBanner 
} from '../lib/firestoreService';
import { slugify } from '../lib/slugify';
import { useAuth } from '../context/AuthContext';

interface AdminPageProps {
  categories: Category[];
  stores: Store[];
  products: Product[];
  banners: Banner[];
  onNavigateProduct: (slug: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  categories,
  stores,
  products,
  banners,
  onNavigateProduct
}) => {
  const { userProfile } = useAuth();
  const [adminTab, setAdminTab] = useState<'analytics' | 'stores' | 'products' | 'taxonomy' | 'banners'>('analytics');

  // Category creation form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string>('');
  const [newCatLevel, setNewCatLevel] = useState<number>(0);
  const [newCatIcon, setNewCatIcon] = useState('');

  // Banner creation form state
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerBadge, setNewBannerBadge] = useState('');

  // Protect Admin route
  const isAdmin = userProfile?.role === 'admin' || userProfile?.email === 'admin@sodaipur.com';

  const handleToggleStoreStatus = async (storeId: string, currentStatus: 'active' | 'suspended') => {
    const next = currentStatus === 'active' ? 'suspended' : 'active';
    await updateStoreStatus(storeId, next);
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: 'approved' | 'pending') => {
    const next = currentStatus === 'approved' ? 'pending' : 'approved';
    await updateProduct(productId, { status: next });
  };

  const handleToggleProductFeatured = async (productId: string, currentFeatured: boolean) => {
    await updateProduct(productId, { isFeatured: !currentFeatured });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Delete this product permanently from platform?')) {
      await deleteProduct(productId);
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await addCategory({
      name: newCatName.trim(),
      nameBn: newCatNameBn.trim() || undefined,
      slug: slugify(newCatName),
      parentId: newCatParentId || null,
      level: Number(newCatLevel),
      iconUrl: newCatIcon || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'
    });

    setNewCatName('');
    setNewCatNameBn('');
    setNewCatIcon('');
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Delete this category taxonomy node?')) {
      await deleteCategory(categoryId);
    }
  };

  const handleAddBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle.trim() || !newBannerImage.trim()) return;

    await addBanner({
      title: newBannerTitle,
      subtitle: newBannerSubtitle,
      imageUrl: newBannerImage,
      badge: newBannerBadge || undefined,
      linkUrl: '/search',
      isActive: true,
      order: banners.length + 1
    });

    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerImage('');
    setNewBannerBadge('');
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-slate-900">Restricted Admin Portal</h2>
        <p className="text-xs text-slate-500">
          This area is strictly restricted to role: "admin". You can use the Demo Persona login inside the Sign In modal to switch to Super Admin mode.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-16 space-y-6">
      {/* Admin Top Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black">Super Admin Panel (সোদাইপুর)</h1>
            <p className="text-xs text-slate-400">Platform Governance, Moderation & Taxonomy Engine</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-1.5 bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setAdminTab('analytics')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setAdminTab('stores')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminTab === 'stores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Stores ({stores.length})
          </button>
          <button
            onClick={() => setAdminTab('products')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setAdminTab('taxonomy')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminTab === 'taxonomy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Taxonomy ({categories.length})
          </button>
          <button
            onClick={() => setAdminTab('banners')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminTab === 'banners' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Banners ({banners.length})
          </button>
        </div>
      </div>

      {/* Tab: Analytics */}
      {adminTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Total Platform Users</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-800">4,820</p>
              <span className="text-[10px] text-emerald-700 font-bold">Verified accounts</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Verified Sellers</span>
                <StoreIcon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-800">{stores.length}</p>
              <span className="text-[10px] text-blue-600 font-bold">Active stores</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Active Listed Products</span>
                <Package className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-800">{products.length}</p>
              <span className="text-[10px] text-slate-400 font-bold">Multi-vendor catalog</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Total Platform GMV</span>
                <DollarSign className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-black text-emerald-700">৳2,450,000</p>
              <span className="text-[10px] text-emerald-700 font-bold">Total revenue across stores</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Store Moderation */}
      {adminTab === 'stores' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Merchant Store Moderation</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Store</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Rating & Sales</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stores.map(store => (
                  <tr key={store.storeId} className="hover:bg-slate-50">
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={store.logoUrl}
                        alt={store.storeName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{store.storeName}</span>
                          {store.status === 'active' && <VerifiedBadge size="xs" />}
                        </div>
                        <span className="text-[10px] text-slate-400">{store.address}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-emerald-800 font-semibold">{store.storeSlug}</td>
                    <td className="p-3.5 text-slate-600">{store.phone || store.whatsapp}</td>
                    <td className="p-3.5 font-bold text-amber-500">{store.rating} ★</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        store.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {store.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleStoreStatus(store.storeId, store.status)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs ${
                          store.status === 'active' 
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {store.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Product Moderation */}
      {adminTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Global Product Catalog Moderation</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Store</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Approval</th>
                  <th className="p-3.5">Homepage Feature</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.productId} className="hover:bg-slate-50">
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={p.images?.[0]}
                        alt={p.title}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div className="max-w-xs truncate">
                        <span 
                          onClick={() => onNavigateProduct(p.productSlug)}
                          className="font-bold text-slate-800 hover:text-emerald-700 cursor-pointer block truncate"
                        >
                          {p.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.productSlug}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-medium text-slate-700">
                      <div className="flex items-center gap-1">
                        <span>{p.storeName}</span>
                        <VerifiedBadge size="xs" />
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-800">৳{p.price}</td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleProductStatus(p.productId, p.status)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </button>
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleProductFeatured(p.productId, p.isFeatured)}
                        className={`p-1 rounded text-xs font-bold ${
                          p.isFeatured ? 'text-amber-600 bg-amber-50' : 'text-slate-400'
                        }`}
                      >
                        {p.isFeatured ? '★ Featured' : '☆ Standard'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.productId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Global Taxonomy Manager */}
      {adminTab === 'taxonomy' && (
        <div className="space-y-6">
          {/* Add Category Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Create New Taxonomy Node</span>
            </h3>

            <form onSubmit={handleAddCategorySubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Name (English) *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Leather Goods"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Name (Bangla)</label>
                <input
                  type="text"
                  value={newCatNameBn}
                  onChange={e => setNewCatNameBn(e.target.value)}
                  placeholder="e.g. চামড়াজাত পণ্য"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Taxonomy Level</label>
                <select
                  value={newCatLevel}
                  onChange={e => setNewCatLevel(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value={0}>Level 0 (Main Root)</option>
                  <option value={1}>Level 1 (Sub-Category)</option>
                  <option value={2}>Level 2 (Child-Category)</option>
                  <option value={3}>Level 3 (Micro-Category)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Category</label>
                <select
                  value={newCatParentId}
                  onChange={e => setNewCatParentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="">None (Top Level Root)</option>
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.name} (L{c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>

          {/* Existing Categories Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Registered Taxonomy Tree ({categories.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Level</th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Bangla</th>
                    <th className="p-3.5">Slug</th>
                    <th className="p-3.5">Parent ID</th>
                    <th className="p-3.5 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map(cat => (
                    <tr key={cat.categoryId} className="hover:bg-slate-50">
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                          Level {cat.level}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{cat.name}</td>
                      <td className="p-3.5 text-slate-600 font-bangla">{cat.nameBn || '-'}</td>
                      <td className="p-3.5 font-mono text-emerald-800">{cat.slug}</td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-400">{cat.parentId || 'ROOT'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteCategory(cat.categoryId)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Banners Manager */}
      {adminTab === 'banners' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>Add Promotional Hero Banner</span>
            </h3>

            <form onSubmit={handleAddBannerSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={newBannerTitle}
                  onChange={e => setNewBannerTitle(e.target.value)}
                  placeholder="e.g. Flash Summer Sale"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={newBannerSubtitle}
                  onChange={e => setNewBannerSubtitle(e.target.value)}
                  placeholder="e.g. Up to 40% Off"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL (Cloudinary) *</label>
                <input
                  type="url"
                  required
                  value={newBannerImage}
                  onChange={e => setNewBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
                >
                  Publish Banner
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map(ban => (
              <div key={ban.bannerId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative">
                <img src={ban.imageUrl} alt={ban.title} className="w-full h-36 object-cover" />
                <div className="p-3">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">{ban.badge || 'Banner'}</span>
                  <h4 className="font-bold text-slate-800 text-xs mt-0.5">{ban.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{ban.subtitle}</p>
                </div>
                <button
                  onClick={() => deleteBanner(ban.bannerId)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white hover:bg-rose-600 rounded-full transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
