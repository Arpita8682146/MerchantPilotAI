'use client';

import React, { useState } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { RazorpayOrderResponse } from '@/types';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface RazorpayModalProps {
  orderData: RazorpayOrderResponse | null;
  onClose: () => void;
}

export function RazorpayModal({ orderData, onClose }: RazorpayModalProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [upiId, setUpiId] = useState('student.buyer@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  if (!orderData) return null;

  const handleSimulatePayment = async (forceSuccess: boolean) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (forceSuccess) {
        const paymentId = 'pay_' + Math.random().toString(36).substring(2, 10);
        const demoSignature = 'demo_sig_' + Math.random().toString(36).substring(2, 12);

        const verifyRes = await api.verifyPayment({
          order_id: orderData.order_id,
          razorpay_order_id: orderData.razorpay_order_id,
          razorpay_payment_id: paymentId,
          razorpay_signature: demoSignature,
        });

        if (verifyRes.success) {
          router.push(`/order-success?order_id=${orderData.order_id}`);
        } else {
          setErrorMsg(verifyRes.message || 'Signature verification failed on server.');
        }
      } else {
        await api.reportPaymentFailure({
          order_id: orderData.order_id,
          razorpay_order_id: orderData.razorpay_order_id,
          error_code: 'BAD_REQUEST_ERROR_INSUFFICIENT_FUNDS',
          error_description: 'Bank declined transaction due to temporary daily limit.',
          customer_action: 'RETRY',
        });

        router.push(`/order-failed?order_id=${orderData.order_id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slide-up">
        <div className="p-5 bg-gradient-to-r from-blue-900/60 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-600/30">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Razorpay Checkout</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  TEST MODE
                </span>
              </div>
              <p className="text-xs text-slate-300">{orderData.merchant_name} • {orderData.order_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Amount Payable</span>
            <span className="text-2xl font-black text-white">{formatINR(orderData.total_amount)}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Order ID</span>
            <span className="text-xs font-mono text-blue-400">{orderData.razorpay_order_id.slice(0, 16)}...</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('card')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                activeTab === 'card' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Cards / NetBanking
            </button>
            <button
              onClick={() => setActiveTab('upi')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                activeTab === 'upi' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              UPI / QR
            </button>
          </div>

          {activeTab === 'card' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Expiry</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CVV</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Virtual Payment Address (VPA / UPI ID)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => handleSimulatePayment(true)}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 active:scale-[0.99] disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              {isProcessing ? 'Verifying with Server HMAC...' : `Pay ${formatINR(orderData.total_amount)} (Test Success)`}
            </button>

            <button
              onClick={() => handleSimulatePayment(false)}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Simulate Payment Failure & Recovery Flow
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
            <Lock className="w-3 h-3" />
            <span>256-Bit SSL Encrypted • Server-Side HMAC SHA256 Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
}
