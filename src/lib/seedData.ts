import type { Category, Store, Product, Banner } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  // Root Level 0
  { categoryId: 'cat_mens_fashion', name: "Men's Fashion", nameBn: 'পুরুষদের ফ্যাশন', slug: 'mens-fashion', parentId: null, level: 0, iconUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=120&auto=format&fit=crop&q=80' },
  { categoryId: 'cat_womens_fashion', name: "Women's Fashion", nameBn: 'মহিলাদের ফ্যাশন', slug: 'womens-fashion', parentId: null, level: 0, iconUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=120&auto=format&fit=crop&q=80' },
  { categoryId: 'cat_groceries', name: 'Sodai & Groceries', nameBn: 'নিত্য সোদাই বাজার', slug: 'sodai-groceries', parentId: null, level: 0, iconUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&auto=format&fit=crop&q=80' },
  { categoryId: 'cat_electronics', name: 'Gadgets & Tech', nameBn: 'গ্যাজেট ও ইলেকট্রনিক্স', slug: 'gadgets-tech', parentId: null, level: 0, iconUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=80' },
  { categoryId: 'cat_home_living', name: 'Home & Living', nameBn: 'হোম ও লাইফস্টাইল', slug: 'home-living', parentId: null, level: 0, iconUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=120&auto=format&fit=crop&q=80' },

  // Sub Level 1 (under Men's Fashion)
  { categoryId: 'cat_mens_clothing', name: 'Men Clothing', nameBn: 'পোশাক', slug: 'men-clothing', parentId: 'cat_mens_fashion', level: 1 },
  { categoryId: 'cat_mens_footwear', name: 'Men Footwear', nameBn: 'জুতো ও লোফার', slug: 'men-footwear', parentId: 'cat_mens_fashion', level: 1 },

  // Child Level 2 (under Men Clothing)
  { categoryId: 'cat_mens_tops', name: 'Tops & T-Shirts', nameBn: 'টি-শার্ট ও টপস', slug: 'tops-t-shirts', parentId: 'cat_mens_clothing', level: 2 },
  { categoryId: 'cat_mens_panjabi', name: 'Panjabi & Kurta', nameBn: 'পাঞ্জাবি ও কুর্তা', slug: 'panjabi-kurta', parentId: 'cat_mens_clothing', level: 2 },

  // Micro Level 3 (under Tops & T-Shirts)
  { categoryId: 'cat_polo_tshirts', name: 'Polo T-Shirts', nameBn: 'পোলো টি-শার্ট', slug: 'polo-t-shirts', parentId: 'cat_mens_tops', level: 3 },
  { categoryId: 'cat_drop_shoulder', name: 'Drop Shoulder T-Shirts', nameBn: 'ড্রপ শোল্ডার টি-শার্ট', slug: 'drop-shoulder-t-shirts', parentId: 'cat_mens_tops', level: 3 },

  // Sub Level 1 (under Women's Fashion)
  { categoryId: 'cat_womens_traditional', name: 'Traditional Wear', nameBn: 'ঐতিহ্যবাহী পোশাক', slug: 'traditional-wear', parentId: 'cat_womens_fashion', level: 1 },
  { categoryId: 'cat_sarees', name: 'Sarees', nameBn: 'শাড়ি ও জামদানি', slug: 'sarees', parentId: 'cat_womens_traditional', level: 2 },

  // Sub Level 1 (under Sodai & Groceries)
  { categoryId: 'cat_organic_foods', name: 'Pure Organic Foods', nameBn: 'খাঁটি দেশি সোদাই', slug: 'organic-foods', parentId: 'cat_groceries', level: 1 },
  { categoryId: 'cat_oils_ghee', name: 'Mustard Oil & Ghee', nameBn: 'সরিষার তেল ও গাওয়া ঘি', slug: 'mustard-oil-ghee', parentId: 'cat_organic_foods', level: 2 },
  { categoryId: 'cat_honey', name: 'Pure Honey', nameBn: 'সুন্দরবনের খাঁটি মধু', slug: 'pure-honey', parentId: 'cat_organic_foods', level: 2 },

  // Sub Level 1 (under Electronics)
  { categoryId: 'cat_audio_wearables', name: 'Audio & Smart Watches', nameBn: 'অডিও ও স্মার্ট ওয়াচ', slug: 'audio-smart-watches', parentId: 'cat_electronics', level: 1 },
  { categoryId: 'cat_smartwatches', name: 'Smart Watches', nameBn: 'স্মার্ট ওয়াচ', slug: 'smart-watches', parentId: 'cat_audio_wearables', level: 2 },
  { categoryId: 'cat_earbuds', name: 'Wireless Earbuds', nameBn: 'ওয়্যারলেস ইয়ারবাড', slug: 'wireless-earbuds', parentId: 'cat_audio_wearables', level: 2 },
];

export const INITIAL_STORES: Store[] = [
  {
    storeId: 'store_tts_fashion',
    ownerUid: 'owner_tts_user',
    storeName: 'TTS Fashion',
    storeSlug: 'tts-fashion',
    logoUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    whatsapp: '+8801711000111',
    phone: '+8801711000111',
    address: 'Sector 3, Uttara, Dhaka-1230',
    status: 'active',
    rating: 4.9,
    totalSales: 3420,
    createdAt: new Date().toISOString()
  },
  {
    storeId: 'store_dhaka_gadgets',
    ownerUid: 'owner_gadget_user',
    storeName: 'Dhaka Gadget Hub',
    storeSlug: 'dhaka-gadget-hub',
    logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=160&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
    whatsapp: '+8801819222333',
    phone: '+8801819222333',
    address: 'Multiplan Center, New Elephant Road, Dhaka',
    status: 'active',
    rating: 4.8,
    totalSales: 1890,
    createdAt: new Date().toISOString()
  },
  {
    storeId: 'store_pure_sodai',
    ownerUid: 'owner_sodai_user',
    storeName: 'Pure Deshi সোদাই',
    storeSlug: 'pure-deshi-sodai',
    logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
    whatsapp: '+8801912444555',
    phone: '+8801912444555',
    address: 'Shyamoli Square, Mirpur Road, Dhaka',
    status: 'active',
    rating: 5.0,
    totalSales: 4120,
    createdAt: new Date().toISOString()
  },
  {
    storeId: 'store_artisan_craft',
    ownerUid: 'owner_artisan_user',
    storeName: 'Artisan Leathercraft',
    storeSlug: 'artisan-leathercraft',
    logoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=160&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80',
    whatsapp: '+8801615777888',
    phone: '+8801615777888',
    address: 'Hazaribagh Tannery Area, Dhanmondi, Dhaka',
    status: 'active',
    rating: 4.7,
    totalSales: 890,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    productId: 'prod_tts_polo_01',
    storeId: 'store_tts_fashion',
    ownerUid: 'owner_tts_user',
    storeName: 'TTS Fashion',
    storeLogo: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160&auto=format&fit=crop&q=80',
    title: 'TTS Signature Pique Cotton Polo Shirt - Navy & Gold Crest',
    titleBn: 'টিটিএস সিগনেচার পিকে কটন পোলো শার্ট - নেভি ব্লু',
    productSlug: 'tts-signature-pique-cotton-polo-shirt-p101',
    price: 950,
    originalPrice: 1450,
    stock: 45,
    categoryPath: ['mens-fashion', 'men-clothing', 'tops-t-shirts', 'polo-t-shirts'],
    mainCategory: "Men's Fashion",
    subCategory: 'Men Clothing',
    childCategory: 'Tops & T-Shirts',
    microCategory: 'Polo T-Shirts',
    description: 'Crafted from 100% 220 GSM combed pique cotton with enzyme wash. Features breathable honeycomb fabric, custom pearl buttons, and high-density embroidered crest. Perfect for both casual outings and smart workwear.',
    images: [
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isFeatured: true,
    status: 'approved',
    rating: 4.9,
    reviewCount: 42,
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_tts_panjabi_02',
    storeId: 'store_tts_fashion',
    ownerUid: 'owner_tts_user',
    storeName: 'TTS Fashion',
    storeLogo: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160&auto=format&fit=crop&q=80',
    title: 'Royal Jacquard Silk Panjabi with Hand Embroidery',
    titleBn: 'রয়েল জাকোয়ার্ড সিল্ক পাঞ্জাবি - হ্যান্ড এমব্রয়ডারি',
    productSlug: 'royal-jacquard-silk-panjabi-with-hand-embroidery-p102',
    price: 2450,
    originalPrice: 3200,
    stock: 28,
    categoryPath: ['mens-fashion', 'men-clothing', 'panjabi-kurta'],
    mainCategory: "Men's Fashion",
    subCategory: 'Men Clothing',
    childCategory: 'Panjabi & Kurta',
    description: 'Elevate your festive presence with this luxury jacquard silk blended Panjabi. Handcrafted zardozi collar embroidery and premium resin metallic buttons.',
    images: [
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80'
    ],
    isFeatured: true,
    status: 'approved',
    rating: 4.8,
    reviewCount: 29,
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_saree_jamdani_03',
    storeId: 'store_tts_fashion',
    ownerUid: 'owner_tts_user',
    storeName: 'TTS Fashion',
    storeLogo: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160&auto=format&fit=crop&q=80',
    title: 'Dhakai Traditional Pure Cotton Handloom Jamdani Saree',
    titleBn: 'ঢাকাই ঐতিহ্যবাহী হ্যান্ডলুম সুতি জামদানি শাড়ি',
    productSlug: 'dhakai-traditional-pure-cotton-handloom-jamdani-saree-p103',
    price: 4800,
    originalPrice: 6500,
    stock: 14,
    categoryPath: ['womens-fashion', 'traditional-wear', 'sarees'],
    mainCategory: "Women's Fashion",
    subCategory: 'Traditional Wear',
    childCategory: 'Sarees',
    description: 'Authentic 84-count pure cotton thread handwoven Jamdani saree by traditional master weavers in Rupganj, Narayanganj. Includes unstitched running blouse piece.',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80'
    ],
    isFeatured: true,
    status: 'approved',
    rating: 5.0,
    reviewCount: 56,
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_mustard_oil_04',
    storeId: 'store_pure_sodai',
    ownerUid: 'owner_sodai_user',
    storeName: 'Pure Deshi সোদাই',
    storeLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160&auto=format&fit=crop&q=80',
    title: 'Cold Pressed 100% Pure Mustard Oil (ঘানি ভাঙা সরিষার তেল) - 5 Liters',
    titleBn: 'কাঠের ঘানি ভাঙা ১০০% খাঁটি সরিষার তেল - ৫ লিটার',
    productSlug: 'cold-pressed-pure-mustard-oil-5l-p104',
    price: 1350,
    originalPrice: 1600,
    stock: 80,
    categoryPath: ['sodai-groceries', 'organic-foods', 'mustard-oil-ghee'],
    mainCategory: 'Sodai & Groceries',
    subCategory: 'Pure Organic Foods',
    childCategory: 'Mustard Oil & Ghee',
    description: 'Traditional wooden cold-pressed (কাঠের ঘানি) yellow and black mustard seed extraction. Free from harmful chemicals, intense authentic aroma, and rich in natural nutrients.',
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'
    ],
    isFeatured: true,
    status: 'approved',
    rating: 5.0,
    reviewCount: 112,
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_honey_sundarban_05',
    storeId: 'store_pure_sodai',
    ownerUid: 'owner_sodai_user',
    storeName: 'Pure Deshi সোদাই',
    storeLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160&auto=format&fit=crop&q=80',
    title: 'Natural Raw Wild Sundarban Honey (সুন্দরবনের প্রাকৃতিক চাকের মধু) - 1 Kg',
    titleBn: 'সুন্দরবনের প্রাকৃতিক চাকের খাঁটি মধু - ১ কেজি',
    productSlug: 'natural-raw-wild-sundarban-honey-1kg-p105',
    price: 980,
    originalPrice: 1250,
    stock: 65,
    categoryPath: ['sodai-groceries', 'organic-foods', 'pure-honey'],
    mainCategory: 'Sodai & Groceries',
    subCategory: 'Pure Organic Foods',
    childCategory: 'Pure Honey',
    description: 'Directly sourced from Khalshi and Goran flower nectar harvested by certified Mouwals of the Sundarban mangrove forest. Raw, unpasteurized, and full of natural pollen.',
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&auto=format&fit=crop&q=80'
    ],
    isFeatured: true,
    status: 'approved',
    rating: 4.9,
    reviewCount: 88,
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_gadget_watch_06',
    storeId: 'store_dhaka_gadgets',
    ownerUid: 'owner_gadget_user',
    storeName: 'Dhaka Gadget Hub',
    storeLogo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=160&auto=format&fit=crop&q=80',
    title: 'Ultra Titanium AMOLED Smartwatch with Bluetooth Calling & SpO2',
    titleBn: 'আল্ট্রা টাইটানিয়াম অ্যামোলেড স্মার্টওয়াচ - ব্লুটুথ কলিং',
    productSlug: 'ultra-titanium-amoled-smartwatch-bluetooth-calling-p106',
    price: 3850,
    originalPrice: 4999,
    stock: 30,
    categoryPath: ['gadgets-tech', 'audio-smart-watches', 'smart-watches'],
    mainCategory: 'Gadgets & Tech',
    subCategory: 'Audio & Smart Watches',
    childCategory: 'Smart Watches',
    description: '1.96-inch high-definition AMOLED Always-On display, IP68 water resistance, optical heart rate & sleep monitoring, 100+ sports modes, 7 days long battery life.',
    images: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80'
    ],
    isFeatured: true,
    status: 'approved',
    rating: 4.8,
    reviewCount: 74,
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_gadget_earbuds_07',
    storeId: 'store_dhaka_gadgets',
    ownerUid: 'owner_gadget_user',
    storeName: 'Dhaka Gadget Hub',
    storeLogo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=160&auto=format&fit=crop&q=80',
    title: 'Active Noise Cancelling Wireless Earbuds (ANC 35dB)',
    titleBn: 'এক্টিভ নয়েজ ক্যানসেলিং ওয়্যারলেস ইয়ারবাড',
    productSlug: 'active-noise-cancelling-wireless-earbuds-anc-p107',
    price: 2190,
    originalPrice: 2890,
    stock: 50,
    categoryPath: ['gadgets-tech', 'audio-smart-watches', 'wireless-earbuds'],
    mainCategory: 'Gadgets & Tech',
    subCategory: 'Audio & Smart Watches',
    childCategory: 'Wireless Earbuds',
    description: 'Hybrid Active Noise Cancellation with dual microphones, low latency gaming mode (45ms), 32 hours total playtime with type-C fast charging case.',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
    ],
    isFeatured: false,
    status: 'approved',
    rating: 4.7,
    reviewCount: 49,
    createdAt: new Date().toISOString()
  },
  {
    productId: 'prod_leather_wallet_08',
    storeId: 'store_artisan_craft',
    ownerUid: 'owner_artisan_user',
    storeName: 'Artisan Leathercraft',
    storeLogo: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=160&auto=format&fit=crop&q=80',
    title: 'Handcrafted Full-Grain Cowhide Leather Bifold Wallet',
    titleBn: 'হ্যান্ডক্রাফটেড অরিজিনাল লেদার বাইফোল্ড ওয়ালেট',
    productSlug: 'handcrafted-full-grain-cowhide-leather-bifold-wallet-p108',
    price: 1150,
    originalPrice: 1650,
    stock: 22,
    categoryPath: ['mens-fashion', 'men-clothing'],
    mainCategory: "Men's Fashion",
    subCategory: 'Men Clothing',
    description: '100% genuine top-grade cow leather wallet with RFID blocking protection, 8 card slots, 2 cash compartments, and wax thread saddle stitching.',
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80'
    ],
    isFeatured: true,
    status: 'approved',
    rating: 4.9,
    reviewCount: 38,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_BANNERS: Banner[] = [
  {
    bannerId: 'banner_01',
    title: 'Grand Eid & Festive Collection',
    subtitle: 'Up to 50% Off on Premium Panjabi, Sarees & Designer Wear',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '/search?category=mens-fashion',
    badge: 'Limited Time Deal',
    isActive: true,
    order: 1
  },
  {
    bannerId: 'banner_02',
    title: 'Pure Village সোদাই বাজার',
    subtitle: '100% Organic Mustard Oil, Honey, Ghee & Sundarban Essentials',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '/search?category=sodai-groceries',
    badge: 'Fresh & Chemical-Free',
    isActive: true,
    order: 2
  },
  {
    bannerId: 'banner_03',
    title: 'Smart Gadgets & Audio Festival',
    subtitle: 'Top Rated AMOLED Smartwatches & Noise Cancelling Earbuds',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '/search?category=gadgets-tech',
    badge: 'Official Warranty',
    isActive: true,
    order: 3
  }
];
