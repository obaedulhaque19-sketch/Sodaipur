import { redirect } from 'next/navigation';
import { getProductWithCanonicalCheck, getStoreById } from '../../../src/lib/firestoreService';

interface LegacyProductRouteProps {
  params: Promise<{ productSlug: string }> | { productSlug: string };
}

export default async function LegacyProductPage({ params }: LegacyProductRouteProps) {
  const resolvedParams = await params;
  const productInfo = await getProductWithCanonicalCheck(resolvedParams.productSlug);

  if (productInfo.product) {
    const store = await getStoreById(productInfo.product.storeId);
    const storeSlug = store?.storeSlug || 'store';
    const canonicalProductSlug = productInfo.product.productSlug;
    redirect(`/stores/${storeSlug}/products/${canonicalProductSlug}`);
  }

  redirect('/');
}
