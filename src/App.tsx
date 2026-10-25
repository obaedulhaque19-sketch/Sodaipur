import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/layout/Header';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { MobileFloatingCart } from './components/cart/MobileFloatingCart';
import { AuthModal } from './components/modals/AuthModal';

// Pages
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { StorePage } from './pages/StorePage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { AdminPage } from './pages/AdminPage';
import { RealtimeChat } from './components/chat/RealtimeChat';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';

// Data services & types
import type { Category, Store, Product, Banner } from './types';
import { 
  subscribeCategories, 
  subscribeStores, 
  subscribeProducts, 
  subscribeBanners, 
  initializeSeedData,
  cleanOrphanedStoresAndProducts,
  subscribeUsersWatchCleanup
} from './lib/firestoreService';

function AppContent() {
  const { currentUser, userProfile } = useAuth();
  // Navigation State
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams(window.location.search));
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };

  // Tablet Scroll Container Ref to handle responsive view iframe scroll bugs
  const tabletScrollRef = React.useRef<HTMLDivElement>(null);

  // Direct chat store target
  const [chatTarget, setChatTarget] = useState<{ storeId: string; storeName: string } | null>(null);

  // Firestore Real-Time Collections
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Seeding, Subscriptions, and Real-time User Cascade Watcher
  useEffect(() => {
    // Run seed if database is blank, then run orphan garbage collector
    initializeSeedData()
      .then(() => cleanOrphanedStoresAndProducts())
      .catch(console.error);

    const unsubCat = subscribeCategories(setCategories);
    const unsubStore = subscribeStores(setStores);
    const unsubProd = subscribeProducts(prods => {
      setProducts(prods);
      setLoading(false);
    });
    const unsubBan = subscribeBanners(setBanners);
    const unsubUserWatch = subscribeUsersWatchCleanup();

    return () => {
      unsubCat();
      unsubStore();
      unsubProd();
      unsubBan();
      unsubUserWatch();
    };
  }, []);

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync scroll positions on path changes (e.g. back/forward navigation)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (tabletScrollRef.current) {
      tabletScrollRef.current.scrollTop = 0;
    }
  }, [currentPath]);

  const navigate = (path: string) => {
    const [pathname, search] = path.split('?');
    window.history.pushState({}, '', path);
    setCurrentPath(pathname);
    setSearchParams(new URLSearchParams(search || ''));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (tabletScrollRef.current) {
      tabletScrollRef.current.scrollTop = 0;
    }
  };

  const navigateToProduct = (productSlug: string, storeSlug?: string) => {
    let targetStoreSlug = storeSlug;
    if (!targetStoreSlug) {
      const prod = products.find(p => p.productSlug === productSlug || p.oldSlugs?.includes(productSlug));
      if (prod) {
        const store = stores.find(s => s.storeId === prod.storeId);
        if (store) targetStoreSlug = store.storeSlug;
      }
    }
    if (targetStoreSlug) {
      navigate(`/stores/${targetStoreSlug}/products/${productSlug}`);
    } else {
      navigate(`/products/${productSlug}`);
    }
  };

  const handleOpenChatWithStore = (storeId: string, storeName: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    // Prevent self-chat: check if target store belongs to the logged-in user
    const isOwnStore = (userProfile?.storeId && userProfile.storeId === storeId) ||
      stores.some(s => s.storeId === storeId && s.ownerUid === currentUser.uid);

    if (isOwnStore) {
      showToast("এটি আপনার নিজস্ব স্টোর। নিজের দোকানের সাথে চ্যাট করা সম্ভব নয়। (This is your own store. You cannot chat with yourself.)");
      return;
    }

    setChatTarget({ storeId, storeName });
    navigate('/chat');
  };

  // Automatically prompt auth modal if user navigates to auth-required routes
  useEffect(() => {
    if ((currentPath === '/chat' || currentPath === '/checkout') && !currentUser) {
      setIsAuthOpen(true);
    }
  }, [currentPath, currentUser]);

  // Dynamic SEO metadata synchronization
  useEffect(() => {
    // 1. Store Product route: /stores/:storeSlug/products/:productSlug
    const storeProductMatch = currentPath.match(/^\/stores\/([^/]+)\/products\/([^/]+)$/);
    if (storeProductMatch) {
      const [, storeSlug, prodSlug] = storeProductMatch;
      const product = products.find(p => p.productSlug === prodSlug || p.oldSlugs?.includes(prodSlug));
      if (product) {
        document.title = `${product.title} - Sodaipur | সোদাইপুর`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', product.description.slice(0, 160));
        return;
      }
    }

    // 2. Product route: /products/:slug
    if (currentPath.startsWith('/products/')) {
      const prodSlug = currentPath.replace('/products/', '');
      const product = products.find(p => p.productSlug === prodSlug || p.oldSlugs?.includes(prodSlug));
      if (product) {
        document.title = `${product.title} - Sodaipur | সোদাইপুর`;
        return;
      }
    }

    // 3. Store route: /stores/:slug
    if (currentPath.startsWith('/stores/')) {
      const storeSlug = currentPath.replace('/stores/', '');
      const store = stores.find(s => s.storeSlug === storeSlug || s.oldSlugs?.includes(storeSlug));
      if (store) {
        document.title = `${store.storeName} - Verified Seller on Sodaipur`;
        return;
      }
    }

    // 4. Default Home
    if (currentPath === '/' || currentPath === '') {
      document.title = "Sodaipur - Multi-Vendor E-Commerce Platform | সোদাইপুর";
    }
  }, [currentPath, products, stores]);

  // Resolve Route & Component
  const renderRoute = () => {
    // 1. Home Page: '/'
    if (currentPath === '/' || currentPath === '') {
      return (
        <HomePage
          categories={categories}
          stores={stores}
          products={products}
          banners={banners}
          onNavigateProduct={slug => navigateToProduct(slug)}
          onNavigateStore={slug => navigate(`/stores/${slug}`)}
          onNavigateSearch={params => navigate(params ? `/search?${params}` : '/search')}
          onOpenChatWithStore={handleOpenChatWithStore}
        />
      );
    }

    // 2. Search & Filters: '/search'
    if (currentPath === '/search') {
      return (
        <SearchPage
          categories={categories}
          stores={stores}
          products={products}
          searchParams={searchParams}
          onNavigateProduct={slug => navigateToProduct(slug)}
          onOpenChatWithStore={handleOpenChatWithStore}
        />
      );
    }

    // 3. Store Product Detail Page: '/stores/[storeSlug]/products/[productSlug]'
    const storeProductMatch = currentPath.match(/^\/stores\/([^/]+)\/products\/([^/]+)$/);
    if (storeProductMatch) {
      const [, rawStoreSlug, rawProductSlug] = storeProductMatch;
      const product = products.find(p => p.productSlug === rawProductSlug || p.oldSlugs?.includes(rawProductSlug));
      const store = stores.find(s => s.storeSlug === rawStoreSlug || s.oldSlugs?.includes(rawStoreSlug) || (product && s.storeId === product.storeId));

      if (!product) {
        return (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 my-8">
            <h2 className="text-lg font-bold text-slate-800">Product Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">The requested product does not exist or has been unlisted.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              Back to Home
            </button>
          </div>
        );
      }

      // Canonical 301 client-side synchronization for oldSlugs
      const canonicalStoreSlug = store?.storeSlug || rawStoreSlug;
      const canonicalProductSlug = product.productSlug;
      if (rawProductSlug !== canonicalProductSlug || rawStoreSlug !== canonicalStoreSlug) {
        window.history.replaceState({}, '', `/stores/${canonicalStoreSlug}/products/${canonicalProductSlug}`);
      }

      return (
        <ProductDetailPage
          product={product}
          store={store}
          onNavigateHome={() => navigate('/')}
          onNavigateCategory={catSlug => navigate(`/search?category=${catSlug}`)}
          onNavigateStore={storeSlug => navigate(`/stores/${storeSlug}`)}
          onOpenChatWithStore={handleOpenChatWithStore}
          onNavigateCheckout={() => navigate('/checkout')}
        />
      );
    }

    // 4. Product Detail Page (Legacy / Direct Permalink): '/products/[productSlug]'
    if (currentPath.startsWith('/products/')) {
      const rawProductSlug = currentPath.replace('/products/', '');
      const product = products.find(p => p.productSlug === rawProductSlug || p.oldSlugs?.includes(rawProductSlug));

      if (!product) {
        return (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 my-8">
            <h2 className="text-lg font-bold text-slate-800">Product Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">The requested product does not exist or has been unlisted.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              Back to Home
            </button>
          </div>
        );
      }

      const store = stores.find(s => s.storeId === product.storeId);
      const canonicalStoreSlug = store?.storeSlug;
      const canonicalProductSlug = product.productSlug;

      // Canonical permanent redirect to /stores/[storeSlug]/products/[productSlug]
      if (canonicalStoreSlug) {
        window.history.replaceState({}, '', `/stores/${canonicalStoreSlug}/products/${canonicalProductSlug}`);
      } else if (rawProductSlug !== canonicalProductSlug) {
        window.history.replaceState({}, '', `/products/${canonicalProductSlug}`);
      }

      return (
        <ProductDetailPage
          product={product}
          store={store}
          onNavigateHome={() => navigate('/')}
          onNavigateCategory={catSlug => navigate(`/search?category=${catSlug}`)}
          onNavigateStore={storeSlug => navigate(`/stores/${storeSlug}`)}
          onOpenChatWithStore={handleOpenChatWithStore}
          onNavigateCheckout={() => navigate('/checkout')}
        />
      );
    }

    // 5. Store Profile Page: '/stores/[storeSlug]'
    if (currentPath.startsWith('/stores/')) {
      const rawSlug = currentPath.replace('/stores/', '');
      const store = stores.find(s => s.storeSlug === rawSlug || s.oldSlugs?.includes(rawSlug));

      if (!store) {
        return (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 my-8">
            <h2 className="text-lg font-bold text-slate-800">Store Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">This vendor store is not currently active.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              Back to Home
            </button>
          </div>
        );
      }

      // Canonical permanent redirect if accessed via oldSlug
      if (rawSlug !== store.storeSlug) {
        window.history.replaceState({}, '', `/stores/${store.storeSlug}`);
      }

      return (
        <StorePage
          store={store}
          products={products}
          onNavigateProduct={pSlug => navigateToProduct(pSlug, store.storeSlug)}
          onOpenChatWithStore={handleOpenChatWithStore}
        />
      );
    }

    // 5. Seller Dashboard & Product Upload: '/seller/dashboard', '/seller/products/new'
    if (currentPath.startsWith('/seller')) {
      const isNew = currentPath.includes('new');
      return (
        <SellerDashboardPage
          categories={categories}
          stores={stores}
          products={products}
          initialTab={isNew ? 'new_product' : 'overview'}
          onNavigateProduct={pSlug => navigateToProduct(pSlug)}
          onNavigate={navigate}
        />
      );
    }

    // 6. Super Admin Panel: '/admin'
    if (currentPath === '/admin') {
      return (
        <AdminPage
          categories={categories}
          stores={stores}
          products={products}
          banners={banners}
          onNavigateProduct={pSlug => navigateToProduct(pSlug)}
        />
      );
    }

    // 7. Real-Time Chat: '/chat'
    if (currentPath === '/chat') {
      if (!currentUser) {
        return (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 my-8 max-w-lg mx-auto shadow-xs">
            <h2 className="text-lg font-bold text-slate-800">Sign In Required to Chat</h2>
            <p className="text-xs text-slate-500 mt-1">Please log in to message store merchants directly.</p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="mt-4 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Sign In / Create Account
            </button>
          </div>
        );
      }
      return (
        <div className="w-full max-w-5xl mx-auto py-1 sm:py-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Direct Merchant & Buyer Chat</h1>
              <p className="text-xs sm:text-sm text-slate-500">Live messaging, instant photo attachments & inquiry support</p>
            </div>
          </div>
          <RealtimeChat
            stores={stores}
            initialStoreId={chatTarget?.storeId}
            initialStoreName={chatTarget?.storeName}
          />
        </div>
      );
    }

    // 8. Checkout: '/checkout'
    if (currentPath === '/checkout') {
      if (!currentUser) {
        return (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 my-8">
            <h2 className="text-lg font-bold text-slate-800">Sign In Required for Checkout</h2>
            <p className="text-xs text-slate-500 mt-1">Please log in to complete your order checkout.</p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="mt-4 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
            >
              Sign In / Create Account
            </button>
          </div>
        );
      }
      return (
        <CheckoutPage
          onBackToShopping={() => navigate('/')}
          onOrderSuccess={() => navigate('/orders')}
        />
      );
    }

    // 9. Orders: '/orders'
    if (currentPath === '/orders') {
      return (
        <OrdersPage
          onNavigateHome={() => navigate('/')}
          onNavigateProduct={pSlug => navigate(`/products/${pSlug}`)}
        />
      );
    }

    // 10. Profile: '/profile'
    if (currentPath === '/profile') {
      return (
        <ProfilePage
          onNavigateOrders={() => navigate('/orders')}
          onNavigateChat={() => navigate('/chat')}
          onNavigateSeller={() => navigate('/seller/dashboard')}
          onNavigateAdmin={() => navigate('/admin')}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      );
    }

    // Fallback: 404
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 my-8">
        <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The link you followed may be broken or the page removed.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl"
        >
          Return Home
        </button>
      </div>
    );
  };

  return (
    <CartProvider onRequireAuth={() => setIsAuthOpen(true)}>
      <div className="h-full max-xl:overflow-hidden xl:min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900 font-sans">
        {/* Header with Search Suggestions */}
        <Header
          categories={categories}
          products={products}
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Main Content Scroll Wrapper (Scrollable only on Mobile & Tablet view to fix bottom navigation and floating cart disappearing on scroll) */}
        <div 
          ref={tabletScrollRef}
          className="flex-1 flex flex-col max-xl:overflow-y-auto"
        >
          {/* Main Content Area */}
          <main className={`flex-1 w-full mx-auto py-4 sm:py-6 ${
            currentPath === '/search'
              ? 'max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-10'
              : 'max-w-7xl px-3 sm:px-4 lg:px-6'
          }`}>
            {renderRoute()}
          </main>

          {/* Footer */}
          <Footer onNavigate={navigate} />
        </div>

        {/* Fixed Bottom App Navigation (Mobile Only) */}
        <BottomNavigation
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Floating Shopping Cart Button (Mobile Only, Bottom-Right) */}
        <MobileFloatingCart />

        {/* Shopping Cart Drawer */}
        <CartDrawer
          onNavigateCheckout={() => navigate('/checkout')}
          onNavigateProduct={pSlug => navigate(`/products/${pSlug}`)}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />

        {/* Floating Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold max-w-md w-[90%] sm:w-auto border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)} 
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </CartProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
