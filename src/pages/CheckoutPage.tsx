import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  MapPin, 
  Check, 
  ArrowLeft, 
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/firestoreService';
import type { CartItem } from '../types';

interface CheckoutPageProps {
  onBackToShopping: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToShopping,
  onOrderSuccess
}) => {
  const { cartItems, subtotal, clearCart } = useCart();
  const { userProfile } = useAuth();

  const [customerName, setCustomerName] = useState(userProfile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'card'>('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const deliveryFee = city === 'inside_dhaka' ? 60 : 120;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setPlacing(true);

    try {
      const storeIds = Array.from(new Set(cartItems.map(i => i.product.storeId)));

      // Create order in Firestore
      const newOrder = await createOrder({
        customerId: userProfile?.uid || 'guest_' + Math.random().toString(36).substring(7),
        customerName,
        customerPhone,
        customerEmail: userProfile?.email || 'guest@sodaipur.com',
        items: cartItems,
        subtotal,
        shippingFee: deliveryFee,
        discount: 0,
        total: grandTotal,
        city,
        shippingAddress: `${shippingAddress} (${city === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}${notes ? ' - Note: ' + notes : ''})`,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        orderStatus: 'pending',
        storeIds
      });

      clearCart();
      onOrderSuccess(newOrder.orderId);
    } catch (err) {
      console.error('Order creation failed:', err);
    } finally {
      setPlacing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 stroke-1 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Your shopping bag is empty</h2>
        <p className="text-xs text-slate-500">
          Add items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={onBackToShopping}
          className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="pb-16 max-w-5xl mx-auto space-y-6">
      <button
        onClick={onBackToShopping}
        className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Continue Shopping</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Checkout Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs">
          <h2 className="text-lg font-black text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-700" />
            <span>Delivery & Payment Information</span>
          </h2>

          <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Delivery Location</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCity('inside_dhaka')}
                  className={`p-3 rounded-xl border text-xs text-left transition-all ${
                    city === 'inside_dhaka' 
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold' 
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block font-bold">Inside Dhaka</span>
                  <span className="text-[11px] text-slate-500">24 Hours (৳60 Delivery)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCity('outside_dhaka')}
                  className={`p-3 rounded-xl border text-xs text-left transition-all ${
                    city === 'outside_dhaka' 
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold' 
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block font-bold">Outside Dhaka</span>
                  <span className="text-[11px] text-slate-500">48-72 Hours (৳120 Delivery)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Detailed Address *</label>
              <textarea
                required
                rows={2}
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                placeholder="House #, Road #, Area, District/Thana..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block font-bold text-slate-700 mb-2">Select Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    paymentMethod === 'cod' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block font-bold text-xs">Cash on Delivery</span>
                  <span className="text-[10px] text-slate-400">Pay on inspect</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    paymentMethod === 'bkash' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block font-bold text-xs text-pink-600">bKash</span>
                  <span className="text-[10px] text-slate-400">Instant Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    paymentMethod === 'nagad' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block font-bold text-xs text-orange-600">Nagad</span>
                  <span className="text-[10px] text-slate-400">Direct Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block font-bold text-xs text-blue-600">Card / SSL</span>
                  <span className="text-[10px] text-slate-400">Visa / Master</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Delivery Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Call before delivery, deliver in afternoon"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={placing}
              className="w-full py-3.5 mt-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {placing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Your Order...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm & Place Order (৳{grandTotal.toLocaleString()})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
              Order Summary ({cartItems.length} items)
            </h3>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-2 pr-1">
              {cartItems.map((item: CartItem) => (
                <div key={item.product.productId} className="pt-2 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.product.title}</p>
                    <p className="text-[11px] text-slate-400">Qty: {item.quantity} × ৳{item.product.price.toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    ৳{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charge</span>
                <span>৳{deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-100 pt-2">
                <span>Total Amount</span>
                <span className="text-emerald-700">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="leading-snug">
              Every parcel on Sodaipur is backed by verified store authenticity and cash on inspection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

