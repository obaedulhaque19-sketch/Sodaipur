import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle2, 
  ChevronRight, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import type { Order } from '../types';
import { subscribeUserOrders } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';

interface OrdersPageProps {
  onNavigateHome: () => void;
  onNavigateProduct: (slug: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onNavigateHome,
  onNavigateProduct
}) => {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const customerId = userProfile?.uid || 'guest_buyer';

  useEffect(() => {
    const unsub = subscribeUserOrders(customerId, (fetched) => {
      setOrders(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, [customerId]);

  return (
    <div className="pb-16 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900">My Orders & Parcel Tracking</h1>
          <p className="text-xs text-slate-500">Live order status synced directly with merchants</p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs font-bold text-emerald-700 hover:underline"
        >
          Continue Shopping
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading your order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-12 h-12 stroke-1 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No orders found yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have not placed any orders yet. Explore our curated collections and place your first order.
          </p>
          <button
            onClick={onNavigateHome}
            className="mt-2 px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const isDelivered = order.orderStatus === 'delivered';
            const isShipped = order.orderStatus === 'shipped';
            const isProcessing = order.orderStatus === 'processing';

            return (
              <div
                key={order.orderId}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Order #{order.orderId}
                    </span>
                    <span className="text-xs text-slate-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isDelivered ? 'bg-emerald-100 text-emerald-800' :
                      isShipped ? 'bg-blue-100 text-blue-800' :
                      isProcessing ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Tracking Progress Steps */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                    <div className="text-emerald-700">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-1 font-black">✓</div>
                      <span>Confirmed</span>
                    </div>
                    <div className={isProcessing || isShipped || isDelivered ? 'text-emerald-700' : 'text-slate-300'}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 ${
                        isProcessing || isShipped || isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                      }`}>2</div>
                      <span>Processing</span>
                    </div>
                    <div className={isShipped || isDelivered ? 'text-emerald-700' : 'text-slate-300'}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 ${
                        isShipped || isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                      }`}>3</div>
                      <span>In Transit</span>
                    </div>
                    <div className={isDelivered ? 'text-emerald-700' : 'text-slate-300'}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 ${
                        isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                      }`}>4</div>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {order.items.map(item => (
                    <div key={item.product?.productId || Math.random()} className="flex items-center gap-3">
                      <img
                        src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={item.product?.title || 'Product'}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.product?.title || 'Item'}</p>
                        {item.product?.storeName && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5">
                            <span>{item.product.storeName}</span>
                            <VerifiedBadge size="xs" />
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Qty: {item.quantity} × ৳{(item.product?.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        ৳{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer details */}
                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="text-slate-500">
                    <span>Delivering to: <strong className="text-slate-700">{order.shippingAddress}</strong></span>
                    <span className="block text-[11px] text-slate-400">Payment: {order.paymentMethod.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Total Paid/Due:</span>
                    <span className="text-base font-black text-emerald-800">৳{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
