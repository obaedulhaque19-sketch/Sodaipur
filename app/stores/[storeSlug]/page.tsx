import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';
import App from '../../../src/App';
import { getStoreWithCanonicalCheck } from '../../../src/lib/firestoreService';

// ISR (Incremental Static Regeneration): Cache store page for 1 hour on CDN
export const revalidate = 3600;

interface StorePageProps {
  params: Promise<{ storeSlug: string }> | { storeSlug: string };
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const storeInfo = await getStoreWithCanonicalCheck(resolvedParams.storeSlug);
  const store = storeInfo.store;

  if (!store) {
    return {
      title: 'Store Not Found | Sodaipur (সোদাইপুর)'
    };
  }

  const title = `${store.storeName} - Verified Seller | Sodaipur (সোদাইপুর)`;
  const description = `Shop authentic products from ${store.storeName} on Sodaipur. Fast delivery and cash on delivery available across Bangladesh.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/stores/${store.storeSlug}`
    },
    openGraph: {
      title,
      description,
      images: store.logoUrl ? [{ url: store.logoUrl }] : []
    }
  };
}

export default async function StoreDetailPage({ params }: StorePageProps) {
  const resolvedParams = await params;
  const storeInfo = await getStoreWithCanonicalCheck(resolvedParams.storeSlug);

  // Automated Server-Side 301 Permanent Redirect for oldSlugs
  if (storeInfo.isRedirect && storeInfo.canonicalSlug !== resolvedParams.storeSlug) {
    redirect(`/stores/${storeInfo.canonicalSlug}`);
  }

  return <App />;
}
