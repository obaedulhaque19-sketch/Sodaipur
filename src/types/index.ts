export type UserRole = 'customer' | 'owner' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  role: UserRole;
  storeId?: string;
  createdAt?: string;
}

export interface Store {
  storeId: string;
  ownerUid: string;
  storeName: string;
  storeSlug: string;
  oldSlugs?: string[];
  logoUrl?: string;
  bannerUrl?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'suspended';
  rating?: number;
  totalSales?: number;
  createdAt?: string;
}

export interface Category {
  categoryId: string;
  name: string;
  nameBn?: string;
  slug: string;
  parentId: string | null;
  level: number; // 0: Main, 1: Sub, 2: Child, 3: Micro
  iconUrl?: string;
  createdAt?: string;
}

export interface Product {
  productId: string;
  storeId: string;
  ownerUid: string;
  title: string;
  titleBn?: string;
  productSlug: string;
  oldSlugs?: string[];
  price: number;
  originalPrice?: number;
  stock: number;
  categoryPath: string[]; // array of category slugs or names
  mainCategory: string;
  subCategory?: string;
  childCategory?: string;
  microCategory?: string;
  description: string;
  images: string[];
  videoUrl?: string;
  isFeatured: boolean;
  status: 'approved' | 'pending';
  storeName?: string;
  storeLogo?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatThread {
  chatId: string; // {customerId}_{storeId}
  customerId: string;
  customerName?: string;
  customerAvatar?: string;
  storeId: string;
  storeName?: string;
  storeLogo?: string;
  lastMessage: string;
  updatedAt: string;
  unreadCountCustomer?: number;
  unreadCountStore?: number;
}

export interface ChatMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: 'inside_dhaka' | 'outside_dhaka';
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'card';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  storeIds: string[];
}

export interface Banner {
  bannerId: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl: string;
  badge?: string;
  isActive: boolean;
  order: number;
}
