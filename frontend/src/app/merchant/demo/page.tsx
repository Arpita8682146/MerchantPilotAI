'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import {
  PlayCircle, Sparkles, AlertTriangle, ShieldCheck,
  Bot, CheckCircle2
} from 'lucide-react';

const DEMO_CARDS = [
  {
    id: 'laptop_coding_upsell',
    title: '1. Conversational Discovery & Contextual Upsell',
    desc: 'Customer asks for CSE laptop under ₹70k with a mouse. AI searches catalog, explains Vivobook 16X match, and pairs compatible Sleeve & Mouse.',
    badge: 'Core Feature B & C',
    icon: Sparkles,
    color: 'blue',
    redirect: '/ai-shop',
  },
  {
    id: 'payment_failure_recovery',
    title: '2. Payment Failure & Zero-Cart-Loss Recovery',
    desc: 'Simulates card decline. Shows that cart items, discounts, and inventory are held with 100% data integrity, with 1-click retry offered.',
    badge: 'Feature I • Fintech Safety',
    icon: AlertTriangle,
    color: 'amber',
    redirect: '/order-failed',
  },
  {
    id: 'guardrail_blocking',
    title: '3. Merchant Guardrail Enforcement (Bounded Autonomy)',
    desc: 'Merchant sets Max Upsell Cap = ₹1,500. Engine automatically filters out expensive items and logs a GUARDRAIL_ENFORCED audit event.',
    badge: 'Feature M • Bounded Autonomy',
    icon: ShieldCheck,
    color: 'rose',
    redirect: '/merchant/settings',
  },
  {
    id: 'ai_buyer_autonomous',
    title: '4. Autonomous External AI Buyer Simulator',
    desc: 'External AI Buyer executes programmatic discovery -> cart -> checkout -> payment via /api/ai-protocol/* structured APIs.',
    badge: 'Feature E • AI Buyer Protocol',
    icon: Bot,
    color: 'purple',
    redirect: '/merchant/ai-buyer',
  },
  {
    id: 'low_confidence_escalation',
    title: '5. Low Confidence Query & Human Support Escalation',
    desc: 'Customer asks out-of-scope question. AI detects boundary, refuses to hallucinate, and opens priority escalation ticket ESC-XXXX.',
    badge: 'Feature Q • Safety & Escalation',
    icon: CheckCircle2,
    color: 'emerald',
    redirect: '/merchant/agent',
  },
];

export default function DemoHubPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshCart } = useCart();

  const handleRun = async (scenarioId: string, redirectUrl: string) => {
    try {
      setIsLoading(true);
      setActiveId(scenarioId);
      setStatusMsg('Executing scenario...');
      const res = await api.runDemoScenario(scenarioId);
      setStatusMsg(`✓ ${res.message}`);
      await refreshCart();
      setTimeout(() => {
        router.push(redirectUrl);
      }, 800);
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Buildathon 2026 Pitch Hub
            </span>
            <span className="text-xs text-slate-300">5-Minute Live Presentation Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Interactive Demo Scenarios</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Trigger pre-packaged live scenarios demonstrating the full agentic commerce lifecycle without relying on external network conditions.
          </p>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-pulse">
            {statusMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEMO_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = activeId === card.id;

          return (
            <div
              key={card.id}
              className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {card.badge}
                  </span>
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-bold text-base text-white">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>

              <button
                onClick={() => handleRun(card.id, card.redirect)}
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95 disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4 text-blue-200" />
                {isSelected && isLoading ? 'Launching...' : 'Run Scenario & Launch View'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
