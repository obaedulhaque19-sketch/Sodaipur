import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  addDoc,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { Category, Store, Product, ChatThread, ChatMessage, Order, Banner, UserProfile, CartItem } from '../types';
import { INITIAL_CATEGORIES, INITIAL_STORES, INITIAL_PRODUCTS, INITIAL_BANNERS } from './seedData';
import { generateStoreSlug, generateProductSlug } from './slugify';
import { deleteFromCloudinary, deleteMultipleFromCloudinary } from './cloudinary';

/**
 * Initialize seed data in Firestore if not present
 */
export async function initializeSeedData(): Promise<void> {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      console.log('Seeding initial categories, stores, products, and banners to Firestore...');
      
      // Seed Categories
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.categoryId), cat);
      }

      // Seed Stores
      for (const store of INITIAL_STORES) {
        await setDoc(doc(db, 'stores', store.storeId), store);
      }

      // Seed Products
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.productId), prod);
      }

      // Seed Banners
      for (const ban of INITIAL_BANNERS) {
        await setDoc(doc(db, 'banners', ban.bannerId), ban);
      }
    }
  } catch (error) {
    console.warn('Firestore auto-seed notice (will use fallback data):', error);
  }
}

// ---------------- CATEGORIES ---------------- //

export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Category);
    }
  } catch (e) {
    console.warn('Error fetching categories from Firestore, using initial data:', e);
  }
  return INITIAL_CATEGORIES;
}

export function subscribeCategories(callback: (cats: Category[]) => void) {
  try {
    return onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (!snapshot.empty) {
        callback(snapshot.docs.map(d => d.data() as Category));
      } else {
        callback(INITIAL_CATEGORIES);
      }
    }, (error) => {
      console.warn('Categories subscription notice:', error);
      callback(INITIAL_CATEGORIES);
    });
  } catch {
    callback(INITIAL_CATEGORIES);
    return () => {};
  }
}

export async function addCategory(cat: Omit<Category, 'categoryId'>): Promise<Category> {
  const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newCat: Category = { ...cat, categoryId, createdAt: new Date().toISOString() };
  await setDoc(doc(db, 'categories', categoryId), newCat);
  return newCat;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    const snap = await getDoc(doc(db, 'categories', categoryId));
    if (snap.exists()) {
      const data = snap.data() as Category;
      if (data.iconUrl) {
        deleteFromCloudinary(data.iconUrl).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('Notice in deleteCategory media cleanup:', e);
  }
  await deleteDoc(doc(db, 'categories', categoryId));
}

// ---------------- STORES ---------------- //

export async function getStores(): Promise<Store[]> {
  try {
    const snap = await getDocs(collection(db, 'stores'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Store);
    }
  } catch (e) {
    console.warn('Error fetching stores from Firestore, using initial data:', e);
  }
  return INITIAL_STORES;
}

export function subscribeStores(callback: (stores: Store[]) => void) {
  try {
    return onSnapshot(collection(db, 'stores'), (snapshot) => {
      if (!snapshot.empty) {
        callback(snapshot.docs.map(d => d.data() as Store));
      } else {
        callback(INITIAL_STORES);
      }
    }, (error) => {
      console.warn('Stores subscription notice:', error);
      callback(INITIAL_STORES);
    });
  } catch {
    callback(INITIAL_STORES);
    return () => {};
  }
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const result = await getStoreWithCanonicalCheck(slug);
  return result.store;
}

export async function getStoreWithCanonicalCheck(slug: string): Promise<{ store: Store | null; isRedirect: boolean; canonicalSlug: string }> {
  try {
    // 1. Direct current slug match
    const q1 = query(collection(db, 'stores'), where('storeSlug', '==', slug));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const store = snap1.docs[0].data() as Store;
      return { store, isRedirect: false, canonicalSlug: store.storeSlug };
    }

    // 2. Old slugs match (for 301 Permanent Redirect)
    const q2 = query(collection(db, 'stores'), where('oldSlugs', 'array-contains', slug));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const store = snap2.docs[0].data() as Store;
      return { store, isRedirect: true, canonicalSlug: store.storeSlug };
    }
  } catch (e) {
    console.warn('Error fetching store by slug:', e);
  }

  // Fallback initial stores
  const initial = INITIAL_STORES.find(s => s.storeSlug === slug || s.oldSlugs?.includes(slug));
  if (initial) {
    const isRedirect = initial.storeSlug !== slug;
    return { store: initial, isRedirect, canonicalSlug: initial.storeSlug };
  }

  return { store: null, isRedirect: false, canonicalSlug: slug };
}

export async function getStoreById(storeId: string): Promise<Store | null> {
  try {
    const snap = await getDoc(doc(db, 'stores', storeId));
    if (snap.exists()) {
      return snap.data() as Store;
    }
  } catch (e) {
    console.warn('Error fetching store by ID:', e);
  }
  return INITIAL_STORES.find(s => s.storeId === storeId) || null;
}

/**
 * Register a new Store with unique slug verification
 * E.g., 'TTS Fashion' -> 'tts-fashion', if duplicate -> 'tts-fashion-1'
 */
export async function createStore(
  ownerUid: string,
  storeData: {
    storeName: string;
    whatsapp: string;
    phone: string;
    logoUrl?: string;
    bannerUrl?: string;
    address: string;
  }
): Promise<Store> {
  const storeId = `store_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  // Unique Slug Verification
  let baseSlug = generateStoreSlug(storeData.storeName);
  let finalSlug = baseSlug;
  let counter = 1;

  try {
    const storesSnap = await getDocs(collection(db, 'stores'));
    const existingSlugs = new Set(storesSnap.docs.map(d => (d.data() as Store).storeSlug));
    
    // Also include initial stores
    INITIAL_STORES.forEach(s => existingSlugs.add(s.storeSlug));

    while (existingSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  } catch (err) {
    console.warn('Slug collision check notice:', err);
  }

  const newStore: Store = {
    storeId,
    ownerUid,
    storeName: storeData.storeName,
    storeSlug: finalSlug,
    logoUrl: storeData.logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160&auto=format&fit=crop&q=80',
    bannerUrl: storeData.bannerUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    whatsapp: storeData.whatsapp,
    phone: storeData.phone,
    address: storeData.address,
    status: 'active',
    rating: 5.0,
    totalSales: 0,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'stores', storeId), newStore);
  
  // Update user profile with role='owner' and multi-store mapping (up to 10 stores)
  try {
    const userDocRef = doc(db, 'users', ownerUid);
    const userSnap = await getDoc(userDocRef);
    const currentData = userSnap.exists() ? (userSnap.data() as UserProfile) : null;
    
    const existingStoreIds: string[] = Array.isArray(currentData?.storeIds)
      ? [...currentData!.storeIds]
      : (currentData?.storeId ? [currentData.storeId] : []);
    
    if (!existingStoreIds.includes(storeId)) {
      existingStoreIds.push(storeId);
    }

    const storeIndex = Math.min(existingStoreIds.length, 10);
    const storeNumberKey = `storeId_${storeIndex}`;

    const updatePayload: Record<string, any> = {
      role: currentData?.role === 'admin' ? 'admin' : 'owner',
      storeId, // Current connected store
      activeStoreId: storeId,
      storeIds: existingStoreIds,
      [storeNumberKey]: storeId
    };

    await updateDoc(userDocRef, updatePayload);
  } catch (userUpErr) {
    console.warn('User storeIds update notice:', userUpErr);
    await updateDoc(doc(db, 'users', ownerUid), {
      role: 'owner',
      storeId,
      activeStoreId: storeId
    }).catch(() => {});
  }

  return newStore;
}

/**
 * Switch connected/active store for a user profile
 */
export async function switchUserActiveStore(uid: string, storeId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      storeId,
      activeStoreId: storeId
    });
  } catch (err) {
    console.warn('Error switching active store:', err);
  }
}

export async function updateStoreStatus(storeId: string, status: 'active' | 'suspended'): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId), { status });
}

// ---------------- PRODUCTS ---------------- //

export function subscribeProducts(callback: (prods: Product[]) => void) {
  try {
    return onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        callback(snapshot.docs.map(d => d.data() as Product));
      } else {
        callback(INITIAL_PRODUCTS);
      }
    }, (error) => {
      console.warn('Products subscription notice:', error);
      callback(INITIAL_PRODUCTS);
    });
  } catch {
    callback(INITIAL_PRODUCTS);
    return () => {};
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Product);
    }
  } catch (e) {
    console.warn('Error fetching products from Firestore:', e);
  }
  return INITIAL_PRODUCTS;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await getProductWithCanonicalCheck(slug);
  return result.product;
}

export async function getProductWithCanonicalCheck(slug: string): Promise<{ product: Product | null; isRedirect: boolean; canonicalSlug: string }> {
  try {
    // 1. Direct current slug match
    const q1 = query(collection(db, 'products'), where('productSlug', '==', slug));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const product = snap1.docs[0].data() as Product;
      return { product, isRedirect: false, canonicalSlug: product.productSlug };
    }

    // 2. Old slugs match (for 301 Permanent Redirect)
    const q2 = query(collection(db, 'products'), where('oldSlugs', 'array-contains', slug));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const product = snap2.docs[0].data() as Product;
      return { product, isRedirect: true, canonicalSlug: product.productSlug };
    }
  } catch (e) {
    console.warn('Error finding product by slug in firestore:', e);
  }

  // Fallback initial products
  const initial = INITIAL_PRODUCTS.find(p => p.productSlug === slug || p.oldSlugs?.includes(slug));
  if (initial) {
    const isRedirect = initial.productSlug !== slug;
    return { product: initial, isRedirect, canonicalSlug: initial.productSlug };
  }

  return { product: null, isRedirect: false, canonicalSlug: slug };
}

export async function createProduct(productData: Omit<Product, 'productId' | 'productSlug' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const productSlug = generateProductSlug(productData.title);

  const newProd: Product = {
    ...productData,
    productId,
    productSlug,
    oldSlugs: [],
    rating: 5.0,
    reviewCount: 0,
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'products', productId), newProd);
  return newProd;
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
  // If productSlug is changing, preserve old slug in oldSlugs array
  if (updates.productSlug) {
    try {
      const existingDoc = await getDoc(doc(db, 'products', productId));
      if (existingDoc.exists()) {
        const existingData = existingDoc.data() as Product;
        if (existingData.productSlug && existingData.productSlug !== updates.productSlug) {
          await updateDoc(doc(db, 'products', productId), {
            ...updates,
            oldSlugs: arrayUnion(existingData.productSlug),
            updatedAt: new Date().toISOString()
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Error archiving old slug during product update:', e);
    }
  }

  await updateDoc(doc(db, 'products', productId), {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    const prodDoc = await getDoc(doc(db, 'products', productId));
    if (prodDoc.exists()) {
      const prod = prodDoc.data() as Product;
      const mediaUrls = [...(prod.images || []), prod.videoUrl].filter(Boolean) as string[];
      if (mediaUrls.length > 0) {
        deleteMultipleFromCloudinary(mediaUrls).catch(err =>
          console.warn('[Cloudinary] Product media cleanup notice:', err)
        );
      }
    }
  } catch (err) {
    console.warn('Notice reading product before deletion:', err);
  }
  await deleteDoc(doc(db, 'products', productId));
}

// ---------------- CHATS & MESSAGES ---------------- //

export interface UserChatsPayload {
  customerChats: ChatThread[]; // Threads where user is the buyer/customer
  sellerChats: ChatThread[];   // Threads where user's store is the seller
  allChats: ChatThread[];      // All threads combined and sorted
}

export function subscribeAllUserChats(
  userId: string,
  storeId?: string,
  callback?: (payload: UserChatsPayload) => void
) {
  let customerThreads: ChatThread[] = [];
  let sellerThreads: ChatThread[] = [];

  const emit = () => {
    if (!callback) return;
    const combined = [...customerThreads, ...sellerThreads];
    const uniqueMap = new Map<string, ChatThread>();
    combined.forEach(t => uniqueMap.set(t.chatId, t));
    const allChats = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    callback({
      customerChats: customerThreads,
      sellerChats: sellerThreads,
      allChats
    });
  };

  // 1. Customer chats (where user is buyer)
  let unsubCustomer = () => {};
  if (userId) {
    try {
      const qCust = query(collection(db, 'chats'), where('customerId', '==', userId));
      unsubCustomer = onSnapshot(qCust, (snap) => {
        customerThreads = snap.docs.map(d => d.data() as ChatThread);
        customerThreads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        emit();
      }, (err) => {
        console.warn('Customer chats listener notice:', err);
      });
    } catch (e) {
      console.warn('Customer chats query error:', e);
    }
  }

  // 2. Seller chats (where user's store receives customer inquiries)
  let unsubSeller = () => {};
  if (storeId) {
    try {
      const qSell = query(collection(db, 'chats'), where('storeId', '==', storeId));
      unsubSeller = onSnapshot(qSell, (snap) => {
        sellerThreads = snap.docs.map(d => d.data() as ChatThread);
        sellerThreads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        emit();
      }, (err) => {
        console.warn('Seller chats listener notice:', err);
      });
    } catch (e) {
      console.warn('Seller chats query error:', e);
    }
  }

  return () => {
    unsubCustomer();
    unsubSeller();
  };
}

export function subscribeUserChats(userId: string, isStoreOwner: boolean, storeId?: string, callback?: (threads: ChatThread[]) => void) {
  return subscribeAllUserChats(userId, storeId, (payload) => {
    if (!callback) return;
    if (isStoreOwner && storeId) {
      callback(payload.sellerChats);
    } else {
      callback(payload.customerChats);
    }
  });
}

export function subscribeMessages(chatId: string, callback: (msgs: ChatMessage[]) => void) {
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => d.data() as ChatMessage);
      callback(msgs);
    }, (err) => {
      console.warn('Messages listener notice:', err);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

export async function getOrCreateChatThread(
  customerId: string, 
  customerName: string, 
  storeId: string, 
  storeName: string
): Promise<string> {
  // Prevent self-chat: customer cannot chat with their own store
  if (customerId === storeId) {
    console.warn('Self-chat prevented.');
    return '';
  }

  const chatId = `${customerId}_${storeId}`;
  const chatRef = doc(db, 'chats', chatId);
  
  try {
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      const newThread: ChatThread = {
        chatId,
        customerId,
        customerName: customerName || 'Customer',
        storeId,
        storeName: storeName || 'Official Store',
        lastMessage: 'Chat started',
        updatedAt: new Date().toISOString()
      };
      await setDoc(chatRef, newThread);
    } else {
      // Refresh names if they were generic
      const current = snap.data() as ChatThread;
      if (storeName && current.storeName !== storeName) {
        await updateDoc(chatRef, { storeName });
      }
    }
  } catch (e) {
    console.warn('Chat thread check notice:', e);
  }
  
  return chatId;
}

export async function sendChatMessage(
  chatId: string, 
  senderId: string, 
  text: string, 
  imageUrl?: string
): Promise<void> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const msgDoc: ChatMessage = {
    messageId,
    chatId,
    senderId,
    text,
    imageUrl: imageUrl || '',
    createdAt: new Date().toISOString()
  };

  // Add message into subcollection
  await setDoc(doc(db, 'chats', chatId, 'messages', messageId), msgDoc);

  // Update thread's lastMessage and updatedAt
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text || (imageUrl ? '📷 Sent an image' : ''),
    updatedAt: new Date().toISOString()
  });
}

// ---------------- ORDERS ---------------- //

export async function createOrder(orderData: Omit<Order, 'orderId' | 'createdAt'>): Promise<Order> {
  const orderId = `SDA-${Math.floor(100000 + Math.random() * 900000)}`;
  const order: Order = {
    ...orderData,
    orderId,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'orders', orderId), order);
  return order;
}

export function subscribeUserOrders(userId: string, callback: (orders: Order[]) => void) {
  try {
    const q = query(collection(db, 'orders'), where('customerId', '==', userId));
    return onSnapshot(q, (snap) => {
      const orders = snap.docs.map(d => d.data() as Order);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(orders);
    }, (e) => {
      console.warn('Orders listener notice:', e);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

export function subscribeStoreOrders(storeId: string, callback: (orders: Order[]) => void) {
  try {
    const q = query(collection(db, 'orders'), where('storeIds', 'array-contains', storeId));
    return onSnapshot(q, (snap) => {
      const orders = snap.docs.map(d => d.data() as Order);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(orders);
    }, (e) => {
      console.warn('Store orders listener notice:', e);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

export async function updateOrderStatus(orderId: string, status: Order['orderStatus']): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { orderStatus: status });
}

// ---------------- BANNERS ---------------- //

export function subscribeBanners(callback: (banners: Banner[]) => void) {
  try {
    return onSnapshot(collection(db, 'banners'), (snap) => {
      if (!snap.empty) {
        const bans = snap.docs.map(d => d.data() as Banner);
        bans.sort((a, b) => a.order - b.order);
        callback(bans);
      } else {
        callback(INITIAL_BANNERS);
      }
    }, () => {
      callback(INITIAL_BANNERS);
    });
  } catch {
    callback(INITIAL_BANNERS);
    return () => {};
  }
}

export async function addBanner(banner: Omit<Banner, 'bannerId'>): Promise<Banner> {
  const bannerId = `banner_${Date.now()}`;
  const newBan: Banner = { ...banner, bannerId };
  await setDoc(doc(db, 'banners', bannerId), newBan);
  return newBan;
}

export async function deleteBanner(bannerId: string): Promise<void> {
  try {
    const snap = await getDoc(doc(db, 'banners', bannerId));
    if (snap.exists()) {
      const data = snap.data() as Banner;
      if (data.imageUrl) {
        deleteFromCloudinary(data.imageUrl).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('Notice in deleteBanner media cleanup:', e);
  }
  await deleteDoc(doc(db, 'banners', bannerId));
}

// ---------------- USER CART PERSISTENCE (Lightweight & Enterprise Grade) ---------------- //

export interface CompactStoredCartItem {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  storeId: string;
  storeName?: string;
  productSlug: string;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
}

export async function getUserCartFromFirestore(uid: string): Promise<CartItem[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const rawCart = (data.cart || []) as any[];
      return rawCart.map(item => {
        // If legacy format with nested product
        if (item.product && item.product.productId) {
          return item as CartItem;
        }
        // If clean compact format
        const cartItem: CartItem = {
          quantity: Number(item.quantity) || 1,
          selectedColor: item.selectedColor || undefined,
          selectedSize: item.selectedSize || undefined,
          product: {
            productId: item.productId,
            title: item.title || 'Product',
            price: Number(item.price) || 0,
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            productSlug: item.productSlug || item.productId,
            storeId: item.storeId || '',
            storeName: item.storeName || '',
            images: item.image ? [item.image] : [],
            description: '',
            stock: 99,
            categoryPath: [],
            mainCategory: '',
            isFeatured: false,
            status: 'approved',
            ownerUid: ''
          }
        };
        return cartItem;
      });
    }
  } catch (err) {
    console.warn('Failed to load cart from Firestore:', err);
  }
  return [];
}

export async function saveUserCartToFirestore(uid: string, cart: CartItem[]): Promise<void> {
  try {
    // Convert to lightweight, clean format storing only essential fields (Daraz/Amazon standard)
    const compactCart: CompactStoredCartItem[] = cart.map(item => ({
      productId: item.product.productId,
      title: item.product.title,
      price: item.product.price,
      originalPrice: item.product.originalPrice || null,
      image: item.product.images?.[0] || '',
      storeId: item.product.storeId || '',
      storeName: item.product.storeName || '',
      productSlug: item.product.productSlug || item.product.productId,
      quantity: item.quantity,
      selectedColor: item.selectedColor || null,
      selectedSize: item.selectedSize || null
    }));

    const cleanCart = JSON.parse(JSON.stringify(compactCart));
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { cart: cleanCart }, { merge: true });
  } catch (e) {
    console.error('Failed to save cart to Firestore:', e);
  }
}

// ---------------- USER & CASCADE CLEANUP ENGINE ---------------- //

const PROTECTED_STORE_IDS = new Set(INITIAL_STORES.map(s => s.storeId));
const PROTECTED_PRODUCT_IDS = new Set(INITIAL_PRODUCTS.map(p => p.productId));
const PROTECTED_USER_IDS = new Set(['demo_admin_uid', 'owner_tts_user', 'demo_customer_uid']);

/**
 * Fetch all registered users from Firestore
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ ...(d.data() as UserProfile), uid: d.id }));
  } catch (err) {
    console.warn('Failed to fetch users from Firestore:', err);
    return [];
  }
}

// ---------------- CHAT THREAD & MESSAGES CASCADE DELETION ---------------- //

/**
 * Completely delete a chat thread and all its nested messages in subcollection
 */
export async function deleteChatThreadWithMessages(chatId: string): Promise<number> {
  let deletedMessagesCount = 0;
  const mediaUrls: string[] = [];
  try {
    const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
    if (!messagesSnap.empty) {
      const batch = writeBatch(db);
      messagesSnap.docs.forEach(docSnap => {
        const msg = docSnap.data() as ChatMessage;
        if (msg.imageUrl) {
          mediaUrls.push(msg.imageUrl);
        }
        batch.delete(docSnap.ref);
        deletedMessagesCount++;
      });
      await batch.commit();
    }
    // Delete the chat thread document itself
    await deleteDoc(doc(db, 'chats', chatId));

    if (mediaUrls.length > 0) {
      deleteMultipleFromCloudinary(mediaUrls).catch(err =>
        console.warn('[Cloudinary] Chat messages media cleanup notice:', err)
      );
    }
  } catch (err) {
    console.warn(`Error deleting chat thread ${chatId}:`, err);
  }
  return deletedMessagesCount;
}

/**
 * Delete all chats associated with a storeId
 */
export async function deleteChatsByStore(storeId: string): Promise<{
  deletedChatsCount: number;
  deletedMessagesCount: number;
}> {
  let deletedChatsCount = 0;
  let deletedMessagesCount = 0;
  try {
    const deletedChatIds = new Set<string>();

    // 1. Query where storeId == storeId
    const chatsQuery = query(collection(db, 'chats'), where('storeId', '==', storeId));
    const chatsSnap = await getDocs(chatsQuery);
    for (const chatDoc of chatsSnap.docs) {
      const msgsCount = await deleteChatThreadWithMessages(chatDoc.id);
      deletedMessagesCount += msgsCount;
      deletedChatsCount++;
      deletedChatIds.add(chatDoc.id);
    }

    // 2. Also check any chat where doc id ends with _storeId or data().storeId matches
    const allChatsSnap = await getDocs(collection(db, 'chats'));
    for (const chatDoc of allChatsSnap.docs) {
      if (deletedChatIds.has(chatDoc.id)) continue;
      const data = chatDoc.data() as ChatThread;
      if (data.storeId === storeId || chatDoc.id.endsWith(`_${storeId}`)) {
        const msgsCount = await deleteChatThreadWithMessages(chatDoc.id);
        deletedMessagesCount += msgsCount;
        deletedChatsCount++;
        deletedChatIds.add(chatDoc.id);
      }
    }
  } catch (err) {
    console.warn(`Error deleting chats for store ${storeId}:`, err);
  }
  return { deletedChatsCount, deletedMessagesCount };
}

/**
 * Delete all chats associated with a customer UID
 */
export async function deleteChatsByUser(uid: string): Promise<{
  deletedChatsCount: number;
  deletedMessagesCount: number;
}> {
  let deletedChatsCount = 0;
  let deletedMessagesCount = 0;
  try {
    const deletedChatIds = new Set<string>();

    // 1. Query where customerId == uid
    const chatsQuery = query(collection(db, 'chats'), where('customerId', '==', uid));
    const chatsSnap = await getDocs(chatsQuery);
    for (const chatDoc of chatsSnap.docs) {
      const msgsCount = await deleteChatThreadWithMessages(chatDoc.id);
      deletedMessagesCount += msgsCount;
      deletedChatsCount++;
      deletedChatIds.add(chatDoc.id);
    }

    // 2. Also check any chat where doc id starts with uid_ or customerId == uid
    const allChatsSnap = await getDocs(collection(db, 'chats'));
    for (const chatDoc of allChatsSnap.docs) {
      if (deletedChatIds.has(chatDoc.id)) continue;
      const data = chatDoc.data() as ChatThread;
      if (data.customerId === uid || chatDoc.id.startsWith(`${uid}_`)) {
        const msgsCount = await deleteChatThreadWithMessages(chatDoc.id);
        deletedMessagesCount += msgsCount;
        deletedChatsCount++;
        deletedChatIds.add(chatDoc.id);
      }
    }
  } catch (err) {
    console.warn(`Error deleting chats for user ${uid}:`, err);
  }
  return { deletedChatsCount, deletedMessagesCount };
}

/**
 * Delete a store and all associated products and chats from Firestore (Cascade)
 */
export async function deleteStoreWithProducts(storeId: string): Promise<{ 
  deletedProductsCount: number;
  deletedChatsCount: number;
}> {
  let deletedProductsCount = 0;
  let deletedChatsCount = 0;
  const mediaUrlsToDelete: string[] = [];

  try {
    // 0. Fetch store document to extract logoUrl & bannerUrl
    const storeDoc = await getDoc(doc(db, 'stores', storeId));
    if (storeDoc.exists()) {
      const sData = storeDoc.data() as Store;
      if (sData.logoUrl) mediaUrlsToDelete.push(sData.logoUrl);
      if (sData.bannerUrl) mediaUrlsToDelete.push(sData.bannerUrl);
    }

    // 1. Delete all products belonging to this store & collect media
    const prodsQuery = query(collection(db, 'products'), where('storeId', '==', storeId));
    const prodsSnap = await getDocs(prodsQuery);
    
    for (const prodDoc of prodsSnap.docs) {
      const pData = prodDoc.data() as Product;
      if (pData.images && Array.isArray(pData.images)) {
        mediaUrlsToDelete.push(...pData.images);
      }
      if (pData.videoUrl) {
        mediaUrlsToDelete.push(pData.videoUrl);
      }
      await deleteDoc(doc(db, 'products', prodDoc.id));
      deletedProductsCount++;
    }

    // 2. Cascade delete all chats and nested messages belonging to this store
    const chatRes = await deleteChatsByStore(storeId);
    deletedChatsCount = chatRes.deletedChatsCount;

    // 3. Delete the store document itself
    await deleteDoc(doc(db, 'stores', storeId));
    console.log(`Cascade deleted store ${storeId}, ${deletedProductsCount} products, and ${deletedChatsCount} chats.`);

    // 4. Delete store logo, banner, and product images/videos from Cloudinary
    if (mediaUrlsToDelete.length > 0) {
      deleteMultipleFromCloudinary(mediaUrlsToDelete).catch(err =>
        console.warn('[Cloudinary] Store cascade media cleanup notice:', err)
      );
    }
  } catch (err) {
    console.error(`Error deleting store ${storeId}, products, and chats:`, err);
  }
  return { deletedProductsCount, deletedChatsCount };
}

/**
 * Delete a user and cascade delete their store, products, and all associated chats from Firestore
 */
export async function deleteUserCascade(uid: string, targetStoreId?: string): Promise<{
  storeDeleted: boolean;
  deletedProductsCount: number;
  deletedChatsCount: number;
}> {
  let storeDeleted = false;
  let deletedProductsCount = 0;
  let deletedChatsCount = 0;
  const userMediaToDelete: string[] = [];

  try {
    const storesToDelete = new Set<string>();
    if (targetStoreId) {
      storesToDelete.add(targetStoreId);
    }

    // 1. Check user document for linked storeId and avatarUrl
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const uData = userDoc.data() as UserProfile;
      if (uData.avatarUrl) userMediaToDelete.push(uData.avatarUrl);
      if (uData.storeId) storesToDelete.add(uData.storeId);
      if (Array.isArray(uData.storeIds)) {
        uData.storeIds.forEach(id => { if (id) storesToDelete.add(id); });
      }
      for (let i = 1; i <= 10; i++) {
        const key = `storeId_${i}` as keyof UserProfile;
        if (uData[key]) storesToDelete.add(uData[key] as string);
      }
    }

    // 2. Search all stores where ownerUid == uid
    const storeQuery = query(collection(db, 'stores'), where('ownerUid', '==', uid));
    const storeSnap = await getDocs(storeQuery);
    for (const sDoc of storeSnap.docs) {
      storesToDelete.add(sDoc.id);
    }

    // 3. Cascade delete every store owned by this user & its products & store chats & cloud media
    for (const sId of storesToDelete) {
      if (!PROTECTED_STORE_IDS.has(sId)) {
        const res = await deleteStoreWithProducts(sId);
        deletedProductsCount += res.deletedProductsCount;
        deletedChatsCount += res.deletedChatsCount;
        storeDeleted = true;
      }
    }

    // 4. Delete any stray products authored by this ownerUid & collect media
    const ownerProdsQuery = query(collection(db, 'products'), where('ownerUid', '==', uid));
    const ownerProdsSnap = await getDocs(ownerProdsQuery);
    for (const pDoc of ownerProdsSnap.docs) {
      if (!PROTECTED_PRODUCT_IDS.has(pDoc.id)) {
        const pData = pDoc.data() as Product;
        if (pData.images && Array.isArray(pData.images)) {
          userMediaToDelete.push(...pData.images);
        }
        if (pData.videoUrl) {
          userMediaToDelete.push(pData.videoUrl);
        }
        await deleteDoc(doc(db, 'products', pDoc.id));
        deletedProductsCount++;
      }
    }

    // 5. Cascade delete all customer chats initiated by this user UID (including nested messages & images)
    const userChatRes = await deleteChatsByUser(uid);
    deletedChatsCount += userChatRes.deletedChatsCount;

    // 6. Delete user document from Firestore
    await deleteDoc(doc(db, 'users', uid));
    console.log(`Cascade deleted user ${uid}, stores: ${Array.from(storesToDelete).join(', ') || 'none'}, ${deletedProductsCount} products, and ${deletedChatsCount} chats.`);

    // 7. Delete user avatar & stray product media from Cloudinary
    if (userMediaToDelete.length > 0) {
      deleteMultipleFromCloudinary(userMediaToDelete).catch(err =>
        console.warn('[Cloudinary] User cascade media cleanup notice:', err)
      );
    }
  } catch (err) {
    console.error(`Error performing cascade delete for user ${uid}:`, err);
  }

  return { storeDeleted, deletedProductsCount, deletedChatsCount };
}

/**
 * Automatic Orphan Garbage Collector:
 * Detects:
 * 1. Stores whose owner user was deleted (e.g. directly from Firebase Console) -> purges store, products & store chats
 * 2. Products whose store no longer exists -> purges products
 * 3. Chats whose customer UID or Store ID was deleted -> purges chat thread & all nested messages
 */
let isCleaningOrphans = false;
export async function cleanOrphanedStoresAndProducts(): Promise<{
  orphanedStoresCleaned: number;
  orphanedProductsCleaned: number;
  orphanedChatsCleaned: number;
}> {
  if (isCleaningOrphans) {
    return { orphanedStoresCleaned: 0, orphanedProductsCleaned: 0, orphanedChatsCleaned: 0 };
  }
  isCleaningOrphans = true;

  let orphanedStoresCleaned = 0;
  let orphanedProductsCleaned = 0;
  let orphanedChatsCleaned = 0;

  try {
    // 1. Fetch current user documents
    const usersSnap = await getDocs(collection(db, 'users'));
    const existingUserUids = new Set(usersSnap.docs.map(d => d.id));

    // 2. Fetch current stores
    const storesSnap = await getDocs(collection(db, 'stores'));
    const existingStores = storesSnap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Store)
    }));

    const validStoreIds = new Set<string>();

    // 3. Check for orphaned stores (ownerUid no longer exists in users collection)
    for (const store of existingStores) {
      const isProtected = PROTECTED_STORE_IDS.has(store.storeId);
      const isOwnerProtected = PROTECTED_USER_IDS.has(store.ownerUid);
      const ownerExists = existingUserUids.has(store.ownerUid) || isOwnerProtected;

      if (!isProtected && !ownerExists && store.ownerUid) {
        console.warn(`[Orphan Cleaner] Store "${store.storeName}" (${store.storeId}) owner ${store.ownerUid} was deleted! Purging store, products, chats & cloud media...`);
        const storeMediaToDelete: string[] = [];
        if (store.logoUrl) storeMediaToDelete.push(store.logoUrl);
        if (store.bannerUrl) storeMediaToDelete.push(store.bannerUrl);

        // Delete store document
        await deleteDoc(doc(db, 'stores', store.storeId));
        orphanedStoresCleaned++;

        // Delete all products belonging to this orphaned store & collect media
        const pQuery = query(collection(db, 'products'), where('storeId', '==', store.storeId));
        const pSnap = await getDocs(pQuery);
        for (const pDoc of pSnap.docs) {
          const pData = pDoc.data() as Product;
          if (pData.images && Array.isArray(pData.images)) {
            storeMediaToDelete.push(...pData.images);
          }
          if (pData.videoUrl) {
            storeMediaToDelete.push(pData.videoUrl);
          }
          await deleteDoc(doc(db, 'products', pDoc.id));
          orphanedProductsCleaned++;
        }

        // Delete all chats belonging to this orphaned store
        const chatRes = await deleteChatsByStore(store.storeId);
        orphanedChatsCleaned += chatRes.deletedChatsCount;

        // Delete all media from Cloudinary
        if (storeMediaToDelete.length > 0) {
          deleteMultipleFromCloudinary(storeMediaToDelete).catch(err =>
            console.warn('[Cloudinary] Orphan store media cleanup notice:', err)
          );
        }
      } else {
        validStoreIds.add(store.storeId);
      }
    }

    // 4. Fetch products and check for orphaned products (storeId or ownerUid no longer exists)
    const prodsSnap = await getDocs(collection(db, 'products'));
    for (const prodDoc of prodsSnap.docs) {
      const prod = prodDoc.data() as Product;
      const isProtectedProd = PROTECTED_PRODUCT_IDS.has(prod.productId);
      const isStoreInvalid = prod.storeId && !validStoreIds.has(prod.storeId);
      const isOwnerMissing = prod.ownerUid && !existingUserUids.has(prod.ownerUid) && !PROTECTED_USER_IDS.has(prod.ownerUid);

      if (!isProtectedProd && (isStoreInvalid || isOwnerMissing)) {
        console.warn(`[Orphan Cleaner] Product "${prod.title}" (${prod.productId}) store ${prod.storeId} no longer exists! Purging...`);
        const orphanProdMedia = [...(prod.images || []), prod.videoUrl].filter(Boolean) as string[];
        await deleteDoc(doc(db, 'products', prod.productId));
        orphanedProductsCleaned++;

        if (orphanProdMedia.length > 0) {
          deleteMultipleFromCloudinary(orphanProdMedia).catch(err =>
            console.warn('[Cloudinary] Orphan product media cleanup notice:', err)
          );
        }
      }
    }

    // 5. Check for orphaned chats (where customerId no longer exists in users OR storeId no longer exists in validStoreIds)
    const chatsSnap = await getDocs(collection(db, 'chats'));
    for (const chatDoc of chatsSnap.docs) {
      const chat = chatDoc.data() as ChatThread;
      const isCustomerOrphaned = chat.customerId && 
        !existingUserUids.has(chat.customerId) && 
        !PROTECTED_USER_IDS.has(chat.customerId);
      const isStoreOrphaned = chat.storeId && 
        !validStoreIds.has(chat.storeId) && 
        !PROTECTED_STORE_IDS.has(chat.storeId);

      if (isCustomerOrphaned || isStoreOrphaned) {
        console.warn(`[Orphan Cleaner] Chat "${chatDoc.id}" (Customer: ${chat.customerId}, Store: ${chat.storeId}) is orphaned because user or store was deleted! Purging chat & messages...`);
        await deleteChatThreadWithMessages(chatDoc.id);
        orphanedChatsCleaned++;
      }
    }

    if (orphanedStoresCleaned > 0 || orphanedProductsCleaned > 0 || orphanedChatsCleaned > 0) {
      console.log(`[Orphan Cleaner] Cleanup completed: Purged ${orphanedStoresCleaned} orphaned stores, ${orphanedProductsCleaned} orphaned products, and ${orphanedChatsCleaned} orphaned chats.`);
    }
  } catch (err) {
    console.warn('[Orphan Cleaner] Notice during check:', err);
  } finally {
    isCleaningOrphans = false;
  }

  return { orphanedStoresCleaned, orphanedProductsCleaned, orphanedChatsCleaned };
}

export const cleanOrphanedStoresProductsAndChats = cleanOrphanedStoresAndProducts;

/**
 * Real-time watcher that triggers automatic cascade cleanup whenever a user document is deleted
 */
export function subscribeUsersWatchCleanup(): () => void {
  try {
    let previousUserCount: number | null = null;
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      const currentCount = snapshot.size;
      if (previousUserCount !== null && currentCount < previousUserCount) {
        console.log('[Users Watcher] User deletion detected in Firestore! Running automatic cascade cleanup...');
        cleanOrphanedStoresAndProducts().catch(console.error);
      }
      previousUserCount = currentCount;
    }, (error) => {
      console.warn('Users watcher notice:', error);
    });
  } catch {
    return () => {};
  }
}



