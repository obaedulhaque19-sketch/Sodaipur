import type { Metadata } from 'next';
import React from 'react';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Sodaipur - Multi-Vendor E-Commerce Platform | সোদাইপুর',
  description: 'Fast, authentic, multi-vendor marketplace in Bangladesh. Buy clothing, gadgets, groceries and artisanal products with cash on delivery and fast shipping.',
  metadataBase: new URL(process.env.APP_URL || 'https://sodaipur.com'),
  openGraph: {
    title: 'Sodaipur - সোদাইপুর E-Commerce',
    description: 'Shop authentic Bangladeshi fashion, electronics, and daily essentials.',
    url: 'https://sodaipur.com',
    siteName: 'Sodaipur',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'Sodaipur Marketplace'
      }
    ],
    locale: 'bn_BD',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sodaipur - সোদাইপুর Marketplace',
    description: 'Authentic multi-vendor marketplace in Bangladesh.'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="font-sans antialiased text-slate-800 bg-slate-50">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-800">
        <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
