'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatINR } from '@/lib/utils';
import { api } from '@/lib/api';
import { ShieldCheck, ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';
import { RazorpayModal } from '@/components/RazorpayModal';

export default function CheckoutPage() {
  const { cart } = useCart();
  const [name, setName] = useState('Aarav Sharma');
  const [email, setEmail] = useState('aarav.sharma@nitk.edu.in');
  const [phone, setPhone] = useState('9876543210');
  const [address, setAddress] = useState('402, Innov8 Cyber Tech Park, Koramangala, Bengaluru, KA 560034');
  const [checkoutOrderData, setCheckoutOrderData] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      setIsProcessing(true);
      const rzpOrder = await api.createCheckoutOrder(cart.id, {
        name,
        email,
        phone,
        address,
      });
      setCheckoutOrderData(rzpOrder);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize checkout order.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <a href="/cart" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </a>

      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Review & Checkout</h1>
        <p className="text-xs text-slate-400 mt-1">
          Finalize your shipping address and complete payment with Razorpay Test Mode.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-6">
          <form onSubmit={handleProceedToPayment} className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-sm text-white pb-2 border-b border-slate-800">
              Shipping & Contact Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Delivery Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !cart || cart.items.length === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              {isProcessing ? 'Initializing Razorpay...' : `Pay ${formatINR(cart?.total_amount || 0)} with Razorpay`}
            </button>
          </form>
        </div>

        <div className="md:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-sm text-white pb-2 border-b border-slate-800">
              Order Items ({cart?.item_count || 0})
            </h3>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-white block truncate">{item.product_name}</span>
                    <span className="text-[10px] text-slate-400">Qty: {item.quantity} {item.is_upsell && '• ✨ AI Add-on'}</span>
                  </div>
                  <span className="font-bold text-slate-200">{formatINR(item.line_total)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-slate-200">{formatINR((cart?.base_subtotal || 0) + (cart?.upsell_subtotal || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18% GST):</span>
                <span className="text-slate-200">{formatINR(cart?.tax_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total:</span>
                <span className="text-blue-400">{formatINR(cart?.total_amount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RazorpayModal
        orderData={checkoutOrderData}
        onClose={() => setCheckoutOrderData(null)}
      />
    </div>
  );
}
