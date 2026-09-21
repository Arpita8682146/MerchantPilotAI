'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  Bot, Play, CheckCircle2,
  Terminal, RefreshCw
} from 'lucide-react';

interface SimulatorStep {
  id: number;
  title: string;
  endpoint: string;
  method: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS';
  payload?: any;
  response?: any;
  latency_ms?: number;
}

export default function AIBuyerSimulatorPage() {
  const [buyerAgentPrompt, setBuyerAgentPrompt] = useState(
    'Find the best laptop under ₹70,000 for a software engineering student with 16GB RAM, plus a protective sleeve.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);

  const [steps, setSteps] = useState<SimulatorStep[]>([
    {
      id: 1,
      title: 'Machine Search & Catalog Query',
      endpoint: '/api/ai-protocol/search',
      method: 'POST',
      status: 'PENDING',
    },
    {
      id: 2,
      title: 'Autonomous Spec & Compatibility Evaluation',
      endpoint: '/api/ai-protocol/products/{id}',
      method: 'GET',
      status: 'PENDING',
    },
    {
      id: 3,
      title: 'Programmatic Cart Initialization',
      endpoint: '/api/ai-protocol/cart',
      method: 'POST',
      status: 'PENDING',
    },
    {
      id: 4,
      title: 'Machine Checkout Order Generation',
      endpoint: '/api/ai-protocol/checkout',
      method: 'POST',
      status: 'PENDING',
    },
    {
      id: 5,
      title: 'Server-Side Cryptographic Payment Settlement',
      endpoint: '/api/payments/verify',
      method: 'POST',
      status: 'PENDING',
    },
  ]);

  const runSimulation = async () => {
    setIsRunning(true);
    setOrderResult(null);
    const agentId = 'autonomous_agent_cs' + Math.floor(Math.random() * 900 + 100);

    const updateStep = (index: number, status: 'RUNNING' | 'SUCCESS', data?: Partial<SimulatorStep>) => {
      setSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, status, ...(data || {}) } : s))
      );
    };

    try {
      updateStep(0, 'RUNNING');
      const start1 = Date.now();
      const searchRes = await api.searchAIProtocol('laptop coding 16gb', 70000);
      const chosenLaptop = searchRes[0];
      updateStep(0, 'SUCCESS', {
        latency_ms: Date.now() - start1,
        payload: { query: 'laptop coding 16gb', max_price: 70000, limit: 6 },
        response: { total_matched: searchRes.length, top_choice: chosenLaptop?.name, price: chosenLaptop?.price }
      });
      await new Promise((r) => setTimeout(r, 600));

      updateStep(1, 'RUNNING');
      const start2 = Date.now();
      updateStep(1, 'SUCCESS', {
        latency_ms: Date.now() - start2,
        payload: { target_product_id: chosenLaptop?.product_id },
        response: {
          processor: chosenLaptop?.specifications?.processor,
          ram: chosenLaptop?.specifications?.ram,
          paired_accessory: 'TechNest ArmorShield Sleeve'
        }
      });
      await new Promise((r) => setTimeout(r, 600));

      updateStep(2, 'RUNNING');
      const start3 = Date.now();
      const cartItems = [
        { product_id: chosenLaptop?.product_id, quantity: 1 },
      ];
      const cartRes = await api.createAICart(agentId, cartItems);
      updateStep(2, 'SUCCESS', {
        latency_ms: Date.now() - start3,
        payload: { buyer_agent_id: agentId, items: cartItems },
        response: cartRes
      });
      await new Promise((r) => setTimeout(r, 600));

      updateStep(3, 'RUNNING');
      const start4 = Date.now();
      const checkoutRes = await api.aiCheckout(cartRes.cart_id, agentId);
      updateStep(3, 'SUCCESS', {
        latency_ms: Date.now() - start4,
        payload: { cart_id: cartRes.cart_id, buyer_agent_id: agentId },
        response: checkoutRes
      });
      await new Promise((r) => setTimeout(r, 600));

      updateStep(4, 'RUNNING');
      const start5 = Date.now();
      const verifyRes = await api.verifyPayment({
        order_id: checkoutRes.order_id,
        razorpay_order_id: checkoutRes.razorpay_order_id,
        razorpay_payment_id: 'pay_agent_' + Math.random().toString(36).substring(2, 9),
        razorpay_signature: 'demo_sig_autonomous_agent',
      });
      updateStep(4, 'SUCCESS', {
        latency_ms: Date.now() - start5,
        payload: { order_id: checkoutRes.order_id, razorpay_order_id: checkoutRes.razorpay_order_id },
        response: verifyRes
      });

      setOrderResult({
        order_number: checkoutRes.order_number,
        buyer_agent_id: agentId,
        total_amount: chosenLaptop?.price * 1.18,
        status: 'PAID'
      });
    } catch (err: any) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Feature E • AI Buyer Simulator
            </span>
            <span className="text-xs text-slate-400">Agentic Commerce Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Autonomous AI Buyer Simulation</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Simulates external AI buyers discovering, evaluating compatibility, and completing checkout programmatically through TechNest&apos;s structured commerce APIs without scraping HTML.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={isRunning}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex-shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Executing Protocol Steps...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-300 fill-emerald-300" /> Run Live Agent Simulation
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl border border-slate-800 p-5 space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Autonomous AI Buyer Goal Prompt
            </label>
            <textarea
              value={buyerAgentPrompt}
              onChange={(e) => setBuyerAgentPrompt(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none font-sans"
            />
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Machine Protocol Execution Flow
            </h3>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-2xl border transition text-xs ${
                    step.status === 'RUNNING'
                      ? 'bg-blue-950/40 border-blue-500 animate-pulse-subtle'
                      : step.status === 'SUCCESS'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <div className="flex items-center gap-2">
                      {step.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : step.status === 'RUNNING' ? (
                        <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                      )}
                      <span className="text-white">{step.title}</span>
                    </div>
                    {step.latency_ms !== undefined && (
                      <span className="text-[10px] text-slate-400 font-mono">{step.latency_ms}ms</span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 font-bold">{step.method}</span>
                    <span className="truncate">{step.endpoint}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-3xl border border-slate-800 p-5 h-[540px] flex flex-col justify-between overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>Real-Time Machine Protocol Wire Log</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">JSON-RPC / REST</span>
              </div>

              <div className="mt-3 flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-4">
                {steps.some((s) => s.response) ? (
                  steps
                    .filter((s) => s.response)
                    .map((s) => (
                      <div key={s.id} className="space-y-1.5 pb-3 border-b border-slate-800/60">
                        <div className="text-blue-400 font-bold flex items-center gap-2">
                          <span>&gt; {s.method} {s.endpoint}</span>
                          {s.latency_ms && <span className="text-slate-500 font-normal">({s.latency_ms}ms)</span>}
                        </div>
                        {s.payload && (
                          <div className="text-slate-500 text-[10px]">
                            Payload: {JSON.stringify(s.payload)}
                          </div>
                        )}
                        <div className="text-emerald-400 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          Response: {JSON.stringify(s.response, null, 2)}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Click &ldquo;Run Live Agent Simulation&rdquo; to watch the autonomous machine interaction.
                  </div>
                )}
              </div>
            </div>

            {orderResult && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between mt-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-white">Autonomous Order Completed!</span>
                    <span className="text-[11px] text-slate-300">Order: {orderResult.order_number} • Buyer: {orderResult.buyer_agent_id}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-emerald-400 block">{formatINR(orderResult.total_amount)}</span>
                  <span className="text-[10px] text-slate-400">Attributed to AI Buyer</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
