import React from 'react';
import { ShieldCheck, Truck, Clock, Headphones, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 pb-16 lg:pb-0">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">Fast Delivery</h4>
              <p className="text-[11px] text-slate-500">Dhaka in 24h, Nationwide 48-72h</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">100% Authentic</h4>
              <p className="text-[11px] text-slate-500">Verified multi-vendor stores</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">Cash on Delivery</h4>
              <p className="text-[11px] text-slate-500">Pay upon parcel inspection</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">Direct Seller Chat</h4>
              <p className="text-[11px] text-slate-500">Real-time WhatsApp style chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
              S
            </div>
            <span className="text-white font-black text-base">Sodaipur / সোদাইপুর</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-3">
            Bangladesh’s mobile-first trusted marketplace connecting discerning buyers with authentic local stores, artisans, and fashion houses.
          </p>
          <p className="text-[11px] text-slate-500">
            Helpline: +880 9612-SODAIPUR (7am - 11pm)
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Customer Care</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate('/orders')} className="hover:text-emerald-400">Track My Order</button></li>
            <li><button onClick={() => onNavigate('/about')} className="hover:text-emerald-400">About Sodaipur</button></li>
            <li><button onClick={() => onNavigate('/contact')} className="hover:text-emerald-400">Help & Support</button></li>
            <li><button onClick={() => onNavigate('/terms')} className="hover:text-emerald-400">Terms & Privacy Policy</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Seller Center</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate('/seller/dashboard')} className="text-emerald-400 font-bold hover:underline">Open a Store on Sodaipur</button></li>
            <li><button onClick={() => onNavigate('/seller/dashboard')} className="hover:text-emerald-400">Seller Dashboard</button></li>
            <li><button onClick={() => onNavigate('/seller/products/new')} className="hover:text-emerald-400">Upload New Product</button></li>
            <li><button onClick={() => onNavigate('/chat')} className="hover:text-emerald-400">Buyer Chat Inbox</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Payment Methods</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 font-bold text-[11px]">bKash</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 font-bold text-[11px]">Nagad</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 font-bold text-[11px]">Visa / Master</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 font-bold text-[11px]">Cash on Delivery</span>
          </div>
          <p className="text-[11px] text-slate-500">
            256-bit SSL encrypted secure checkout.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 px-4 text-center text-[11px] text-slate-500 pb-20 sm:pb-24 lg:pb-4">
        © {new Date().getFullYear()} Sodaipur.com — All Rights Reserved. Engineered with Next.js, Firebase & Tailwind CSS.
      </div>
    </footer>
  );
};
