'use client';

import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ShieldCheck, Bot, RefreshCw, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';

export function DemoScenarioBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshCart } = useCart();

  const handleRunScenario = async (scenarioId: string, redirectUrl?: string) => {
    try {
      setIsLoading(true);
      setStatusMsg('Running scenario...');
      const res = await api.runDemoScenario(scenarioId);
      setStatusMsg(`✓ ${res.message}`);
      await refreshCart();
      if (redirectUrl) {
        setTimeout(() => {
          router.push(redirectUrl);
        }, 600);
      }
      setTimeout(() => {
        setStatusMsg(null);
      }, 5000);
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDb = async () => {
    if (confirm('Reset database to clean seed state (30+ products, customers & historical metrics)?')) {
      try {
        setIsLoading(true);
        await api.resetDemoDatabase();
        setStatusMsg('✓ Database reset successfully!');
        await refreshCart();
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (err: any) {
        setStatusMsg(`❌ Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-purple-950/90 border-b border-blue-500/30 text-xs px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
            <Sparkles className="w-3 h-3 text-blue-400" />
            Buildathon 2026 Demo Mode
          </span>
          <span className="text-slate-300 hidden sm:inline">
            1-Click Live Presentations & Bounded Autonomy Scenarios
          </span>
        </div>

        <div className="flex items-center gap-2">
          {statusMsg && (
            <span className="text-emerald-400 font-medium animate-pulse bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {statusMsg}
            </span>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded font-medium transition border border-slate-700"
          >
            {isOpen ? 'Hide Presets' : 'Quick Demo Scenarios'}
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => handleRunScenario('laptop_coding_upsell', '/ai-shop')}
            disabled={isLoading}
            className="bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 text-blue-200 p-2 rounded text-left transition flex flex-col justify-between"
          >
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" /> 1. Laptop + AI Upsell
            </span>
            <span className="text-[10px] text-blue-300/70 mt-1">CSE Laptop + Sleeve + Mouse</span>
          </button>

          <button
            onClick={() => handleRunScenario('payment_failure_recovery', '/order-failed')}
            disabled={isLoading}
            className="bg-amber-900/30 hover:bg-amber-800/50 border border-amber-500/30 text-amber-200 p-2 rounded text-left transition flex flex-col justify-between"
          >
            <span className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" /> 2. Payment Failure
            </span>
            <span className="text-[10px] text-amber-300/70 mt-1">Safe Cart & 1-Click Retry</span>
          </button>

          <button
            onClick={() => handleRunScenario('guardrail_blocking', '/merchant/settings')}
            disabled={isLoading}
            className="bg-rose-900/30 hover:bg-rose-800/50 border border-rose-500/30 text-rose-200 p-2 rounded text-left transition flex flex-col justify-between"
          >
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-rose-400" /> 3. Guardrail Enforced
            </span>
            <span className="text-[10px] text-rose-300/70 mt-1">Cap ₹2k Blocks High Upsell</span>
          </button>

          <button
            onClick={() => handleRunScenario('ai_buyer_autonomous', '/merchant/ai-buyer')}
            disabled={isLoading}
            className="bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 p-2 rounded text-left transition flex flex-col justify-between"
          >
            <span className="font-bold flex items-center gap-1">
              <Bot className="w-3 h-3 text-purple-400" /> 4. AI Buyer Simulator
            </span>
            <span className="text-[10px] text-purple-300/70 mt-1">Autonomous API Checkout</span>
          </button>

          <button
            onClick={() => handleRunScenario('low_confidence_escalation', '/merchant/agent')}
            disabled={isLoading}
            className="bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-500/30 text-emerald-200 p-2 rounded text-left transition flex flex-col justify-between"
          >
            <span className="font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> 5. Human Escalation
            </span>
            <span className="text-[10px] text-emerald-300/70 mt-1">Support Ticket Handoff</span>
          </button>

          <button
            onClick={handleResetDb}
            disabled={isLoading}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 p-2 rounded text-left transition flex flex-col justify-between"
          >
            <span className="font-bold flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-slate-400" /> Reset Database
            </span>
            <span className="text-[10px] text-slate-400 mt-1">Clean Seed & Orders</span>
          </button>
        </div>
      )}
    </div>
  );
}
