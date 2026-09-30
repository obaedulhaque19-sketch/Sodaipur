/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/stores/:storeSlug/products/:productSlug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=3600, stale-while-revalidate=86400'
          }
        ]
      },
      {
        source: '/stores/:storeSlug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=3600, stale-while-revalidate=86400'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
