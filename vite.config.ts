import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import crypto from 'crypto';
import {defineConfig} from 'vite';

function cloudinaryDevMiddleware() {
  return {
    name: 'cloudinary-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if ((req.url === '/api/cloudinary/delete' || req.url === '/api/cloudinary/delete-multiple') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
              const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
              const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET;

              const destroyAsset = async (publicId: string, resourceType: string = 'image') => {
                if (!apiKey || !apiSecret || !cloudName || cloudName === 'demo') {
                  console.warn(`[Vite Dev Cloudinary] Deletion simulated for "${publicId}": API credentials not set.`);
                  return { success: true, result: 'simulated_no_credentials', publicId };
                }
                const timestamp = Math.floor(Date.now() / 1000);
                const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
                const signature = crypto.createHash('sha1').update(toSign).digest('hex');
                const formData = new URLSearchParams();
                formData.append('public_id', publicId);
                formData.append('timestamp', timestamp.toString());
                formData.append('api_key', apiKey);
                formData.append('signature', signature);
                const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;
                const r = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: formData.toString()
                });
                const d = await r.json().catch(() => ({}));
                return { success: r.ok, result: d.result || 'ok', publicId };
              };

              res.setHeader('Content-Type', 'application/json');
              if (req.url === '/api/cloudinary/delete') {
                const result = await destroyAsset(parsed.publicId, parsed.resourceType || 'image');
                res.end(JSON.stringify(result));
              } else {
                const items = Array.isArray(parsed.items) ? parsed.items : [];
                const results = await Promise.allSettled(items.map((i: any) => destroyAsset(i.publicId, i.resourceType || 'image')));
                let deletedCount = 0;
                let errorsCount = 0;
                results.forEach((r: any) => {
                  if (r.status === 'fulfilled' && r.value.success) deletedCount++;
                  else errorsCount++;
                });
                res.end(JSON.stringify({ success: true, deletedCount, errorsCount }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudinaryDevMiddleware()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
