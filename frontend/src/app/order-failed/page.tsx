'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { formatINR } from '@/lib/utils';
import { AlertTriangle, ShieldCheck, RefreshCw, ShoppingCart, Bot } from 'lucide-react';
import { RazorpayModal } from '@/components/RazorpayModal';
import { api } from '@/lib/api';

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '';
  const { cart } = useCart();
  const [checkoutOrderData, setCheckoutOrderData] = useState<any | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPayment = async () => {
    if (!cart || cart.items.length === 0) {
      window.location.href = '/cart';
      return;
    }
    try {
      setIsRetrying(true);
      const rzpOrder = await api.createCheckoutOrder(cart.id, {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@nitk.edu.in',
        phone: '9876543210',
        address: '402, Innov8 Cyber Tech Park, Koramangala, Bengaluru, KA 560034'
      });
      setCheckoutOrderData(rzpOrder);
    } catch (err: any) {
      alert(err.message || 'Failed to re-initialize payment.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
      <div className="p-8 rounded-3xl glass-panel border border-amber-500/30 text-center space-y-4 shadow-2xl bg-amber-950/10">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Cart-Safe Guarantee • Zero Data Loss
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Payment Wasn&apos;t Completed</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          Your bank declined the transaction, but don&apos;t worry! Your chosen products, accessories, and promotional discounts are completely preserved.
        </p>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-blue-400">
            <span className="flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> AI Failure Recovery Assistant
            </span>
            <span className="text-slate-500 text-[10px] font-mono">Audit Action: PAYMENT_RECOVERY_OFFERED</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            We have held your reserved inventory. You can instantly retry with a different card or UPI without re-selecting your items.
          </p>
        </div>

        {cart && cart.items.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2">
            <div className="font-bold text-slate-200 flex items-center justify-between">
              <span>Preserved Cart Items ({cart.item_count})</span>
              <span className="text-blue-400">{formatINR(cart.total_amount)}</span>
            </div>
            <div className="divide-y divide-slate-800/80 max-h-32 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="py-1.5 flex justify-between text-[11px] text-slate-400">
                  <span>{item.product_name} {item.is_upsell && '(AI Add-on)'}</span>
                  <span className="font-medium text-slate-300">{formatINR(item.line_total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRetryPayment}
            disabled={isRetrying}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Opening Razorpay...' : 'Retry Payment (1-Click)'}
          </button>

          <a
            href="/cart"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <ShoppingCart className="w-4 h-4" /> Return to Cart
          </a>
        </div>
      </div>

      <RazorpayModal
        orderData={checkoutOrderData}
        onClose={() => setCheckoutOrderData(null)}
      />
    </div>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-3" />
        Loading recovery screen...
      </div>
    }>
      <OrderFailedContent />
    </Suspense>
  );
}
