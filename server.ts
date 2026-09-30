import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(express.json());

  // In-memory cache to drastically reduce Firebase Firestore read operations
  const cache = new Map<string, { data: any; expiry: number }>();
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data as T;
    }
    return null;
  }

  function setCached<T>(key: string, data: T): void {
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
  }

  // Fallback initial catalog for instant server responses and SEO crawlers
  const INITIAL_STORES = [
    {
      storeId: 'store_tts_fashion',
      storeName: 'TTS Fashion Zone',
      storeSlug: 'tts-fashion',
      oldSlugs: ['tts-fashion-old', 'tts-clothing'],
      logoUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=160&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      address: 'Shop 42, Level 3, Bashundhara City, Dhaka'
    },
    {
      storeId: 'store_gadget_bazaar',
      storeName: 'Dhaka Gadget Bazaar',
      storeSlug: 'gadget-bazaar',
      oldSlugs: ['gadget-dhaka'],
      logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=160&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
      address: 'Multiplan Center, New Elephant Road, Dhaka'
    },
    {
      storeId: 'store_bengal_spices',
      storeName: 'Bengal Pure Agro & Grocery',
      storeSlug: 'bengal-pure-agro',
      oldSlugs: ['bengal-grocery'],
      logoUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=160&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
      address: 'Kawran Bazar Wholesale Market, Dhaka'
    }
  ];

  const INITIAL_PRODUCTS = [
    {
      productId: 'prod_mens_panjabi_01',
      storeId: 'store_tts_fashion',
      title: 'Premium Handcrafted Cotton Panjabi - Festive Black',
      productSlug: 'premium-handcrafted-cotton-panjabi-festive-black',
      oldSlugs: ['handcrafted-cotton-panjabi', 'mens-black-panjabi'],
      price: 1850,
      originalPrice: 2450,
      description: 'Exclusive 100% fine combed cotton men panjabi featuring authentic thread embroidery and designer snap buttons.',
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'],
      rating: 4.9,
      reviewCount: 38
    },
    {
      productId: 'prod_wireless_earbuds_02',
      storeId: 'store_gadget_bazaar',
      title: 'Anker Soundcore Space A40 ANC Earbuds',
      productSlug: 'anker-soundcore-space-a40-anc-earbuds',
      oldSlugs: ['anker-a40-earbuds'],
      price: 6490,
      originalPrice: 7990,
      description: 'Active Noise Cancelling wireless earbuds with 50-hour total playtime, Hi-Res wireless audio, and lightweight fit.',
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80'],
      rating: 4.8,
      reviewCount: 64
    },
    {
      productId: 'prod_organic_ghee_03',
      storeId: 'store_bengal_spices',
      title: 'Artisanal Organic Desi Cow Bilona Ghee (500g)',
      productSlug: 'artisanal-organic-desi-cow-bilona-ghee-500g',
      oldSlugs: ['desi-cow-ghee-500g'],
      price: 1250,
      originalPrice: 1450,
      description: 'Traditional slow-cooked bilona ghee made from grass-fed cow milk butter. 100% unadulterated and lab-tested.',
      images: ['https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop&q=80'],
      rating: 5.0,
      reviewCount: 112
    }
  ];

  // Helper to fetch store by slug with oldSlugs 301 check
  async function fetchStore(slug: string) {
    const cacheKey = `store_${slug}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    // Check in-memory store list
    for (const store of INITIAL_STORES) {
      if (store.storeSlug === slug) {
        const res = { store, isRedirect: false, canonicalSlug: store.storeSlug };
        setCached(cacheKey, res);
        return res;
      }
      if (store.oldSlugs && store.oldSlugs.includes(slug)) {
        const res = { store, isRedirect: true, canonicalSlug: store.storeSlug };
        setCached(cacheKey, res);
        return res;
      }
    }

    return { store: null, isRedirect: false, canonicalSlug: slug };
  }

  // Helper to fetch product by slug with oldSlugs 301 check
  async function fetchProduct(slug: string) {
    const cacheKey = `prod_${slug}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    for (const prod of INITIAL_PRODUCTS) {
      if (prod.productSlug === slug) {
        const store = INITIAL_STORES.find(s => s.storeId === prod.storeId);
        const res = { product: prod, store, isRedirect: false, canonicalSlug: prod.productSlug };
        setCached(cacheKey, res);
        return res;
      }
      if (prod.oldSlugs && prod.oldSlugs.includes(slug)) {
        const store = INITIAL_STORES.find(s => s.storeId === prod.storeId);
        const res = { product: prod, store, isRedirect: true, canonicalSlug: prod.productSlug };
        setCached(cacheKey, res);
        return res;
      }
    }

    return { product: null, store: null, isRedirect: false, canonicalSlug: slug };
  }

  // Cache Revalidation API Endpoint (Next.js ISR equivalent)
  app.post('/api/revalidate', (req, res) => {
    const { tag, slug } = req.query;
    if (slug) {
      cache.delete(`prod_${slug}`);
      cache.delete(`store_${slug}`);
    } else if (tag) {
      // Clear entire or partial cache
      cache.clear();
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ revalidated: true, now: Date.now() });
  });

  // Healthcheck for Google Cloud Run / Render
  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  let vite: any;
  if (!isProd) {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'custom'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from Vite build output with 1 year cache for immutable assets
    app.use('/assets', express.static(path.resolve(__dirname, 'dist/assets'), {
      maxAge: '1y',
      immutable: true
    }));
    app.use(express.static(path.resolve(__dirname, 'dist'), {
      maxAge: '1h'
    }));
  }

  // Load index.html template
  function getIndexHtml(): string {
    const templatePath = isProd 
      ? path.resolve(__dirname, 'dist/index.html') 
      : path.resolve(__dirname, 'index.html');
    return fs.readFileSync(templatePath, 'utf-8');
  }

  // 1. Store Product Route: /stores/:storeSlug/products/:productSlug
  app.get('/stores/:storeSlug/products/:productSlug', async (req, res, next) => {
    try {
      const { storeSlug, productSlug } = req.params;
      const productInfo = await fetchProduct(productSlug);

      if (productInfo.product) {
        const canonicalStoreSlug = productInfo.store?.storeSlug || storeSlug;
        const canonicalProductSlug = productInfo.product.productSlug;

        // Automated Server-Side 301 Permanent Redirect for oldSlugs
        if (productInfo.isRedirect || productSlug !== canonicalProductSlug || storeSlug !== canonicalStoreSlug) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.redirect(301, `/stores/${canonicalStoreSlug}/products/${canonicalProductSlug}`);
        }

        // Apply CDN Caching Headers
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('Surrogate-Control', 'max-age=3600');
        res.setHeader('CDN-Cache-Control', 'max-age=3600, stale-while-revalidate=86400');
        res.setHeader('X-Cache-Tag', `products, product-${canonicalProductSlug}, store-${canonicalStoreSlug}`);

        let html = getIndexHtml();
        if (!isProd && vite) {
          html = await vite.transformIndexHtml(req.originalUrl, html);
        }

        // Inject Dynamic Server-Side SEO & Schema.org Metadata
        const p = productInfo.product;
        const title = `${p.title} | Sodaipur - সোদাইপুর`;
        const desc = p.description.replace(/"/g, '&quot;');
        const img = p.images[0] || 'https://sodaipur.com/og-image.jpg';

        const jsonLd = JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": p.title,
          "image": p.images,
          "description": p.description,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "BDT",
            "price": p.price,
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": productInfo.store?.storeName || "Sodaipur Vendor"
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": p.rating || 5.0,
            "reviewCount": p.reviewCount || 10
          }
        });

        html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${desc}" />`);
        html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title}" />`);
        html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${desc}" />`);
        html = html.replace('</head>', `  <meta property="og:image" content="${img}" />\n  <script type="application/ld+json">${jsonLd}</script>\n</head>`);

        return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      }

      next();
    } catch (e) {
      next(e);
    }
  });

  // 2. Direct Product Route: /products/:productSlug -> 301 Permanent Redirect to Canonical Store Product URL
  app.get('/products/:productSlug', async (req, res, next) => {
    try {
      const { productSlug } = req.params;
      const productInfo = await fetchProduct(productSlug);

      if (productInfo.product) {
        const canonicalStoreSlug = productInfo.store?.storeSlug || 'shop';
        const canonicalProductSlug = productInfo.product.productSlug;
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.redirect(301, `/stores/${canonicalStoreSlug}/products/${canonicalProductSlug}`);
      }

      next();
    } catch (e) {
      next(e);
    }
  });

  // 3. Store Profile Route: /stores/:storeSlug
  app.get('/stores/:storeSlug', async (req, res, next) => {
    try {
      const { storeSlug } = req.params;
      const storeInfo = await fetchStore(storeSlug);

      if (storeInfo.store) {
        // Automated 301 Redirect for oldSlugs
        if (storeInfo.isRedirect || storeSlug !== storeInfo.canonicalSlug) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.redirect(301, `/stores/${storeInfo.canonicalSlug}`);
        }

        // CDN Caching Headers
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('Surrogate-Control', 'max-age=3600');
        res.setHeader('CDN-Cache-Control', 'max-age=3600, stale-while-revalidate=86400');
        res.setHeader('X-Cache-Tag', `stores, store-${storeSlug}`);

        let html = getIndexHtml();
        if (!isProd && vite) {
          html = await vite.transformIndexHtml(req.originalUrl, html);
        }

        const s = storeInfo.store;
        const title = `${s.storeName} - Verified Store | Sodaipur (সোদাইপুর)`;
        const desc = `Shop verified authentic products directly from ${s.storeName} with fast delivery and cash on delivery on Sodaipur.`;

        const jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          "name": s.storeName,
          "image": s.logoUrl,
          "telephone": s.phone || "+8801700000000",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": s.address || "Dhaka, Bangladesh",
            "addressCountry": "BD"
          }
        });

        html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${desc}" />`);
        html = html.replace('</head>', `  <script type="application/ld+json">${jsonLd}</script>\n</head>`);

        return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      }

      next();
    } catch (e) {
      next(e);
    }
  });

  // 4. Default SPA Fallback for all other routes
  app.get('*', async (req, res, next) => {
    try {
      let html = getIndexHtml();
      if (!isProd && vite) {
        html = await vite.transformIndexHtml(req.originalUrl, html);
      }
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sodaipur Server running on port ${PORT} [Mode: ${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
