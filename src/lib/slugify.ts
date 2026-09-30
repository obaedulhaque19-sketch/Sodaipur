/**
 * SEO Permalinks & Slugify Engine
 * Handles English & Bangla Unicode (e.g. প্রিমিয়াম-কটন-শার্ট)
 * Cleans unwanted punctuation, normalizes spacing to hyphens, and appends unique suffix
 */

export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .trim()
    .toLowerCase()
    // Keep English alphanumeric, Bangla unicode characters (\u0980-\u09FF), and hyphens/spaces
    .replace(/[^\w\s\u0980-\u09FF-]/g, '')
    // Replace multiple spaces or underscores with a single hyphen
    .replace(/[\s_]+/g, '-')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates an SEO permalink slug with a unique short identifier
 * Example: generateProductSlug("Premium Cotton T-Shirt") -> "premium-cotton-t-shirt-p482"
 * Example: generateProductSlug("প্রিমিয়াম কটন শার্ট") -> "প্রিমিয়াম-কটন-শার্ট-p791"
 */
export function generateProductSlug(title: string, customId?: string): string {
  const baseSlug = slugify(title) || 'product';
  const idSuffix = customId ? customId : `p${Math.floor(100 + Math.random() * 900)}`;
  return `${baseSlug}-${idSuffix}`;
}

/**
 * Generates store slug from store name
 * e.g. "TTS Fashion" -> "tts-fashion"
 */
export function generateStoreSlug(storeName: string, suffixIndex?: number): string {
  const base = slugify(storeName) || 'store';
  if (suffixIndex && suffixIndex > 0) {
    return `${base}-${suffixIndex}`;
  }
  return base;
}
