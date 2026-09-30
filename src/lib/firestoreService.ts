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
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import type { Category, Store, Product, ChatThread, ChatMessage, Order, Banner, UserProfile } from '../types';
import { INITIAL_CATEGORIES, INITIAL_STORES, INITIAL_PRODUCTS, INITIAL_BANNERS } from './seedData';
import { generateStoreSlug, generateProductSlug } from './slugify';

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
  
  // Update user profile with role='owner' and storeId
  await updateDoc(doc(db, 'users', ownerUid), {
    role: 'owner',
    storeId
  });

  return newStore;
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
  await deleteDoc(doc(db, 'products', productId));
}

// ---------------- CHATS & MESSAGES ---------------- //

export function subscribeUserChats(userId: string, isStoreOwner: boolean, storeId?: string, callback?: (threads: ChatThread[]) => void) {
  try {
    // If owner, query where storeId == currentStoreId; if customer, where customerId == userId
    const q = isStoreOwner && storeId
      ? query(collection(db, 'chats'), where('storeId', '==', storeId))
      : query(collection(db, 'chats'), where('customerId', '==', userId));

    return onSnapshot(q, (snap) => {
      const threads = snap.docs.map(d => d.data() as ChatThread);
      // Sort by updatedAt desc
      threads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      if (callback) callback(threads);
    }, (err) => {
      console.warn('Chat threads listener notice:', err);
      if (callback) callback([]);
    });
  } catch {
    if (callback) callback([]);
    return () => {};
  }
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
  const chatId = `${customerId}_${storeId}`;
  const chatRef = doc(db, 'chats', chatId);
  
  try {
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      const newThread: ChatThread = {
        chatId,
        customerId,
        customerName,
        storeId,
        storeName,
        lastMessage: 'Chat started',
        updatedAt: new Date().toISOString()
      };
      await setDoc(chatRef, newThread);
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
  await deleteDoc(doc(db, 'banners', bannerId));
}
