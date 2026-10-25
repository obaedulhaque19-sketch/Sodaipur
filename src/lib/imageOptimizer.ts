/**
 * Image Optimizer & Compressor Utility
 * Automatically compresses high-resolution / heavy images (10MB-30MB+) into
 * lightweight, high-fidelity WebP/JPEG files in KB format (typically 30KB - 150KB).
 * Ensures rapid uploads to Cloudinary and prevents Firestore document size limit crashes.
 */

export interface OptimizeOptions {
  mode?: 'avatar_500' | 'logo_500' | 'banner' | 'product' | 'general';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.82)
}

/**
 * Optimizes an image File to high-definition KB format using client-side canvas.
 * - 'avatar_500' & 'logo_500': Precise 500x500 square center-cropped (target: 30KB - 60KB)
 * - 'banner': Max 1200x420 aspect-fit (target: 70KB - 140KB)
 * - 'product': Max 1080x1080 aspect-fit (target: 60KB - 130KB)
 */
export async function optimizeImageFile(file: File, options: OptimizeOptions = {}): Promise<File> {
  // If not an image, return original file (e.g. video or PDF)
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Set defaults based on mode
  let targetWidth = options.maxWidth || 1200;
  let targetHeight = options.maxHeight || 1200;
  let quality = options.quality ?? 0.82;
  const isSquareMode = options.mode === 'avatar_500' || options.mode === 'logo_500';

  if (isSquareMode) {
    targetWidth = 500;
    targetHeight = 500;
  } else if (options.mode === 'banner') {
    targetWidth = options.maxWidth || 1200;
    targetHeight = options.maxHeight || 420;
  } else if (options.mode === 'product') {
    targetWidth = options.maxWidth || 1080;
    targetHeight = options.maxHeight || 1080;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(file);
            return;
          }

          let drawWidth = img.width;
          let drawHeight = img.height;
          let offsetX = 0;
          let offsetY = 0;

          if (isSquareMode) {
            // 500x500 square center-crop
            canvas.width = 500;
            canvas.height = 500;

            const minSide = Math.min(img.width, img.height);
            const sourceX = (img.width - minSide) / 2;
            const sourceY = (img.height - minSide) / 2;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sourceX, sourceY, minSide, minSide, 0, 0, 500, 500);
          } else {
            // Aspect-ratio preserving fit within targetWidth x targetHeight
            let scale = 1;
            if (drawWidth > targetWidth || drawHeight > targetHeight) {
              scale = Math.min(targetWidth / drawWidth, targetHeight / drawHeight);
            }

            const finalW = Math.round(drawWidth * scale);
            const finalH = Math.round(drawHeight * scale);

            canvas.width = finalW;
            canvas.height = finalH;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, finalW, finalH);
          }

          // Try exporting as WebP (modern high-compression format)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
                const optimizedFile = new File([blob], cleanName, {
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                console.log(`[Image Optimizer] Compressed "${file.name}" from ${(file.size / 1024).toFixed(1)} KB down to ${(optimizedFile.size / 1024).toFixed(1)} KB`);
                resolve(optimizedFile);
              } else {
                // Fallback to JPEG if WebP blob generation fails
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob) {
                      const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
                      const optimizedFile = new File([jpegBlob], cleanName, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                      });
                      resolve(optimizedFile);
                    } else {
                      resolve(file);
                    }
                  },
                  'image/jpeg',
                  quality
                );
              }
            },
            'image/webp',
            quality
          );
        } catch (canvasErr) {
          console.warn('[Image Optimizer] Canvas processing fallback:', canvasErr);
          resolve(file);
        }
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}
