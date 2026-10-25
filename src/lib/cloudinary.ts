/**
 * Cloudinary Media Storage Helper
 * Supports direct unsigned uploads for images and videos with fallback support
 */

const env = typeof process !== 'undefined' ? process.env : (import.meta as any).env || {};

export const CLOUDINARY_CLOUD_NAME = 
  env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
  env.VITE_CLOUDINARY_CLOUD_NAME || 
  'demo';

export const CLOUDINARY_UPLOAD_PRESET = 
  env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 
  env.VITE_CLOUDINARY_UPLOAD_PRESET || 
  'docs_upload_example_preset';

import { optimizeImageFile, type OptimizeOptions } from './imageOptimizer';

/**
 * Uploads a single file (image/video) to Cloudinary after auto-compressing images to KB format
 */
export async function uploadToCloudinary(
  file: File, 
  resourceType: 'image' | 'video' = 'image',
  optimizeMode?: OptimizeOptions['mode']
): Promise<string> {
  // If it's an image, always optimize to lightweight KB format first
  let fileToUpload = file;
  if (resourceType === 'image' && file.type.startsWith('image/')) {
    try {
      fileToUpload = await optimizeImageFile(file, { mode: optimizeMode || 'general' });
    } catch (e) {
      console.warn('Image optimization skipped, uploading original:', e);
    }
  }

  // If cloud name is demo or default, and direct upload might fail without custom preset,
  // we try real upload first; if it encounters network/credential error, we fallback gracefully to DataURL.
  try {
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.secure_url || data.url;
    } else {
      const errRes = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload returned non-200:', response.status, errRes);
    }
  } catch (error) {
    console.warn('Direct Cloudinary upload failed, using local asset reader fallback:', error);
  }

  // Graceful fallback to browser-readable Data URL (now guaranteed to be lightweight KB size)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file buffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(fileToUpload);
  });
}

/**
 * Uploads multiple files in parallel with automatic KB optimization
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  resourceType: 'image' | 'video' = 'image',
  optimizeMode?: OptimizeOptions['mode']
): Promise<string[]> {
  const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file, resourceType, optimizeMode));
  return Promise.all(uploadPromises);
}

/**
 * Parses a Cloudinary media URL to extract its public_id and resource_type.
 * Handles subfolders, version numbers, transformations, and extensions.
 */
export function parseCloudinaryUrl(url: string): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    const typePart = parts[uploadIndex - 1];
    const resourceType = (typePart === 'video' ? 'video' : typePart === 'raw' ? 'raw' : 'image') as 'image' | 'video' | 'raw';
    
    let remainingParts = parts.slice(uploadIndex + 1);
    
    // Skip version segment (e.g. v1700000000) or transformation segments
    const versionIndex = remainingParts.findIndex(p => /^v\d+$/.test(p));
    if (versionIndex !== -1) {
      remainingParts = remainingParts.slice(versionIndex + 1);
    } else {
      while (remainingParts.length > 1 && (remainingParts[0].includes(',') || /^(c|w|h|q|f|e|b|r|co|fl)_/.test(remainingParts[0]))) {
        remainingParts.shift();
      }
    }

    if (remainingParts.length === 0) return null;

    let fullPath = remainingParts.join('/');
    const lastDotIndex = fullPath.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      fullPath = fullPath.substring(0, lastDotIndex);
    }
    return { publicId: fullPath, resourceType };
  } catch {
    return null;
  }
}

/**
 * Deletes a single asset from Cloudinary storage via secure server proxy
 */
export async function deleteFromCloudinary(
  urlOrPublicId: string, 
  resourceType?: 'image' | 'video' | 'raw'
): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    let publicId = urlOrPublicId;
    let type = resourceType || 'image';

    if (urlOrPublicId.startsWith('http://') || urlOrPublicId.startsWith('https://')) {
      const parsed = parseCloudinaryUrl(urlOrPublicId);
      if (!parsed) {
        // Not a Cloudinary URL (e.g. unsplash, external, or base64 data-url), safely ignore
        return { success: true, result: 'skipped_non_cloudinary' };
      }
      publicId = parsed.publicId;
      type = resourceType || parsed.resourceType;
    }

    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        publicId,
        resourceType: type
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, result: data.result };
    } else {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.error || response.statusText };
    }
  } catch (err: any) {
    console.warn('[Cloudinary Delete Client Notice]:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Deletes multiple assets from Cloudinary storage in parallel or batch
 */
export async function deleteMultipleFromCloudinary(
  urls: (string | undefined | null)[]
): Promise<{ deletedCount: number; errorsCount: number }> {
  const validItems: { publicId: string; resourceType: 'image' | 'video' | 'raw' }[] = [];

  for (const item of urls) {
    if (!item) continue;
    const parsed = parseCloudinaryUrl(item);
    if (parsed) {
      validItems.push(parsed);
    }
  }

  if (validItems.length === 0) {
    return { deletedCount: 0, errorsCount: 0 };
  }

  try {
    const response = await fetch('/api/cloudinary/delete-multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: validItems })
    });

    if (response.ok) {
      const res = await response.json();
      return {
        deletedCount: res.deletedCount || validItems.length,
        errorsCount: res.errorsCount || 0
      };
    }
  } catch (err) {
    console.warn('[Cloudinary Batch Delete Notice]:', err);
  }

  // Fallback to sequential/individual requests if batch endpoint unavailable
  let deletedCount = 0;
  let errorsCount = 0;
  for (const item of validItems) {
    const res = await deleteFromCloudinary(item.publicId, item.resourceType);
    if (res.success) deletedCount++;
    else errorsCount++;
  }

  return { deletedCount, errorsCount };
}
