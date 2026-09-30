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

/**
 * Uploads a single file (image/video) to Cloudinary
 */
export async function uploadToCloudinary(
  file: File, 
  resourceType: 'image' | 'video' = 'image'
): Promise<string> {
  // If cloud name is demo or default, and direct upload might fail without custom preset,
  // we try real upload first; if it encounters network/credential error, we fallback gracefully to DataURL.
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.secure_url || data.url;
    }
  } catch (error) {
    console.warn('Direct Cloudinary upload failed, using local asset reader fallback:', error);
  }

  // Graceful fallback to browser-readable Data URL
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
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads multiple files in parallel
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  resourceType: 'image' | 'video' = 'image'
): Promise<string[]> {
  const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file, resourceType));
  return Promise.all(uploadPromises);
}
