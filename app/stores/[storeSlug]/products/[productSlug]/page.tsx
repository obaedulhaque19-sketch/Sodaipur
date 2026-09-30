import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';
import App from '../../../../../src/App';
import { getProductWithCanonicalCheck, getStoreById } from '../../../../../src/lib/firestoreService';

// ISR (Incremental Static Regeneration): Cache generated product pages on CDN for 1 hour
export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ storeSlug: string; productSlug: string }> | { storeSlug: string; productSlug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const productInfo = await getProductWithCanonicalCheck(resolvedParams.productSlug);
  const product = productInfo.product;

  if (!product) {
    return {
      title: 'Product Not Found | Sodaipur (সোদাইপুর)'
    };
  }

  const title = `${product.title} | Sodaipur - সোদাইপুর`;
  const description = product.description.slice(0, 160);
  const images = product.images.length > 0 ? [{ url: product.images[0] }] : [];

  return {
    title,
    description,
    alternates: {
      canonical: `/stores/${resolvedParams.storeSlug}/products/${product.productSlug}`
    },
    openGraph: {
      title,
      description,
      images,
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };
}

export default async function ProductDetailPageNext({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const productInfo = await getProductWithCanonicalCheck(resolvedParams.productSlug);

  if (productInfo.product) {
    const store = await getStoreById(productInfo.product.storeId);
    const canonicalStoreSlug = store?.storeSlug || resolvedParams.storeSlug;
    const canonicalProductSlug = productInfo.product.productSlug;

    // Automated Server-Side 301 Permanent Redirect for oldSlugs
    if (
      productInfo.isRedirect ||
      resolvedParams.productSlug !== canonicalProductSlug ||
      resolvedParams.storeSlug !== canonicalStoreSlug
    ) {
      redirect(`/stores/${canonicalStoreSlug}/products/${canonicalProductSlug}`);
    }
  }

  return (
    <>
      {productInfo.product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Product',
              name: productInfo.product.title,
              image: productInfo.product.images,
              description: productInfo.product.description,
              offers: {
                '@type': 'Offer',
                priceCurrency: 'BDT',
                price: productInfo.product.price,
                availability: 'https://schema.org/InStock'
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: productInfo.product.rating || 5.0,
                reviewCount: productInfo.product.reviewCount || 10
              }
            })
          }}
        />
      )}
      <App />
    </>
  );
}
