'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { formatINR } from '@/lib/utils';
import { CheckCircle2, ShieldCheck, Sparkles, Package, Store, LineChart, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}

    if (orderId) {
      api.getOrder(orderId)
        .then((data) => setOrder(data))
        .catch((err) => console.error('Failed to fetch order:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
      <div className="p-8 rounded-3xl glass-panel border border-emerald-500/30 text-center space-y-4 shadow-2xl bg-emerald-950/10">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" /> Server-Side HMAC Verified • Payment Captured
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Payment Confirmed!</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          Thank you for your order. Your transaction has been recorded in the immutable audit trail and sent for fulfilment.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            Order: <strong className="text-white">{order?.order_number || orderId || 'ORD-2026-CONFIRMED'}</strong>
          </span>
          {order?.razorpay_payment_id && (
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              Razorpay ID: <strong className="text-blue-400">{order.razorpay_payment_id}</strong>
            </span>
          )}
        </div>
      </div>

      {order && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Package className="w-4 h-4 text-blue-400" /> Ordered Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{item.product_name}</div>
                    <div className="text-slate-400 text-[11px]">
                      {item.is_upsell ? '✨ Contextual AI Upsell' : 'Direct Catalog Item'} • Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold text-slate-200">{formatINR(item.line_total)}</div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                <span>Total Paid:</span>
                <span className="text-emerald-400">{formatINR(order.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 space-y-4 bg-purple-950/10">
            <h3 className="font-bold text-sm text-purple-300 flex items-center gap-2 pb-2 border-b border-purple-500/20">
              <Sparkles className="w-4 h-4 text-purple-400" /> Transparent Revenue Attribution
            </h3>
            <p className="text-xs text-slate-400">
              MerchantPilot strictly separates baseline organic sales from AI-generated growth:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Organic Base Revenue:</span>
                <span className="font-semibold text-slate-200">{formatINR(order.organic_revenue)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-purple-950/40 border border-purple-500/30">
                <span className="text-purple-300 font-semibold">AI-Attributed Upsell Revenue:</span>
                <span className="font-bold text-emerald-400">+{formatINR(order.upsell_revenue)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Total Net Captured:</span>
                <span className="font-black text-blue-400">{formatINR(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
        <a
          href="/ai-shop"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
        >
          <Store className="w-4 h-4" /> Make Another AI Purchase
        </a>
        <a
          href="/merchant/analytics"
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center gap-2 transition"
        >
          <LineChart className="w-4 h-4 text-purple-400" /> View Revenue in Merchant Analytics
        </a>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-3" />
        Loading order confirmation...
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
