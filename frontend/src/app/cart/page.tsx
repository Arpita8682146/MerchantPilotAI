'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatINR } from '@/lib/utils';
import { ShoppingCart, Trash2, Sparkles, ShieldCheck, ArrowRight, Store } from 'lucide-react';
import { RazorpayModal } from '@/components/RazorpayModal';
import { api } from '@/lib/api';

export default function CartPage() {
  const { cart, addItem, removeItem } = useCart();
  const [checkoutOrderData, setCheckoutOrderData] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    try {
      setIsProcessing(true);
      const rzpOrder = await api.createCheckoutOrder(cart.id, {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@nitk.edu.in',
        phone: '9876543210',
        address: '402, Innov8 Cyber Tech Park, Koramangala, Bengaluru, KA 560034'
      });
      setCheckoutOrderData(rzpOrder);
    } catch (err: any) {
      alert(err.message || 'Failed to start Razorpay checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-blue-400" />
            Smart Cart
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Server-calculated pricing, dynamic tax calculation, and real-time AI upsell attribution.
          </p>
        </div>

        <a
          href="/shop"
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
        >
          <Store className="w-3.5 h-3.5" /> Continue Shopping
        </a>
      </div>

      {cart && cart.items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
              {cart.items.map((item) => (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                        {item.is_upsell && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" /> AI Contextual Add-on
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white truncate">{item.product_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white">{formatINR(item.line_total)}</div>
                      <div className="text-[11px] text-slate-400">{formatINR(item.unit_price)} × {item.quantity}</div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition border border-transparent hover:border-rose-500/30"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cart.available_upsells && cart.available_upsells.length > 0 && (
              <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 space-y-4 bg-purple-950/10">
                <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Frequently Paired with Your Selected Items
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cart.available_upsells.map((up) => (
                    <div
                      key={up.product.id}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-xs text-white truncate">{up.product.name}</h5>
                        <div className="text-[11px] text-purple-400 font-medium mt-0.5">
                          {formatINR(up.product.discounted_price)}
                        </div>
                      </div>
                      <button
                        onClick={() => addItem(up.product.id, true, 'AI_RECOMMENDATION')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition active:scale-95 flex-shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-6 h-fit">
            <h3 className="font-bold text-base text-white pb-3 border-b border-slate-800">Order Summary</h3>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-purple-950/30 to-slate-900 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Original Baseline AOV:</span>
                <span className="font-semibold text-slate-200">{formatINR(cart.original_aov)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-300 font-semibold">AI Value Added:</span>
                <span className="font-bold text-emerald-400">+{formatINR(cart.upsell_subtotal)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                <span className="text-white">Projected AOV Uplift:</span>
                <span className="text-purple-400 font-extrabold">+{cart.aov_uplift_percent}%</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Base Subtotal:</span>
                <span className="text-slate-200 font-medium">{formatINR(cart.base_subtotal)}</span>
              </div>
              {cart.upsell_subtotal > 0 && (
                <div className="flex justify-between text-purple-300 font-medium">
                  <span>AI Upsell Subtotal:</span>
                  <span>+{formatINR(cart.upsell_subtotal)}</span>
                </div>
              )}
              {cart.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>AI-Generated Savings:</span>
                  <span>-{formatINR(cart.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span className="text-slate-200 font-medium">{formatINR(cart.tax_amount)}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total Payable:</span>
                <span className="text-2xl font-black text-blue-400">{formatINR(cart.total_amount)}</span>
              </div>
            </div>

            <button
              onClick={handleStartCheckout}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition active:scale-[0.99] disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              {isProcessing ? 'Creating Razorpay Order...' : `Proceed to Razorpay Checkout`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-16 rounded-3xl glass-panel border border-slate-800 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Your Cart is Empty</h3>
          <p className="text-xs text-slate-400">
            Discover products with our AI Sales Agent or browse the catalog to add items.
          </p>
          <a
            href="/ai-shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            Ask AI Sales Agent
          </a>
        </div>
      )}

      <RazorpayModal
        orderData={checkoutOrderData}
        onClose={() => setCheckoutOrderData(null)}
      />
    </div>
  );
}
