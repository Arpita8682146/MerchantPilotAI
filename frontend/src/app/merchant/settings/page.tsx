'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MerchantRules } from '@/types';
import { formatINR } from '@/lib/utils';
import { ShieldCheck, Save } from 'lucide-react';

export default function MerchantSettingsPage() {
  const [rules, setRules] = useState<MerchantRules | null>(null);
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [maxUpsell, setMaxUpsell] = useState(2000);
  const [maxDiscount, setMaxDiscount] = useState(20);
  const [mode, setMode] = useState<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getMerchantRules()
      .then((data) => {
        setRules(data);
        setAgentEnabled(data.ai_agent_enabled);
        setMaxUpsell(data.max_upsell_amount);
        setMaxDiscount(data.max_discount_percent);
        setMode(data.recommendation_mode);
      })
      .catch((err) => console.error('Failed to load rules:', err));
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await api.updateMerchantRules({
        ai_agent_enabled: agentEnabled,
        max_upsell_amount: Number(maxUpsell),
        max_discount_percent: Number(maxDiscount),
        recommendation_mode: mode,
      });
      setRules(updated);
      setStatusMsg('✓ Merchant Guardrails saved & applied to AI Agent runtime!');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-4xl">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Feature M • Bounded Autonomy & Guardrails
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Merchant Control Center</h1>
        <p className="text-xs text-slate-400 mt-1">
          Set hard boundaries for AI Sales Agent autonomy. The agent is strictly prevented from exceeding these limits.
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-white">Enable AI Sales Agent</h4>
            <p className="text-xs text-slate-400">When turned off, conversational storefront immediately reverts to catalog only.</p>
          </div>
          <button
            onClick={() => setAgentEnabled(!agentEnabled)}
            className={`w-14 h-8 rounded-full p-1 transition duration-200 flex items-center ${
              agentEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white shadow-md"></span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <label className="text-slate-200">Maximum Upsell Item Price Cap</label>
            <span className="text-purple-400 font-mono text-sm">{formatINR(maxUpsell)}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            The AI recommendation engine is hard-blocked from recommending add-ons priced above this threshold.
          </p>
          <input
            type="range"
            min={500}
            max={10000}
            step={250}
            value={maxUpsell}
            onChange={(e) => setMaxUpsell(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>₹500 (Strict)</span>
            <span>₹2,000 (Default)</span>
            <span>₹10,000 (Relaxed)</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <label className="text-slate-200">Maximum Allowed Discount Percentage</label>
            <span className="text-emerald-400 font-mono text-sm">{maxDiscount}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            step={5}
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-200">AI Recommendation Policy Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'CONSERVATIVE', title: 'Conservative', desc: 'Strict budget fit & exact keyword match' },
              { id: 'BALANCED', title: 'Balanced (Default)', desc: 'Optimal trade-off of compatibility & AOV' },
              { id: 'AGGRESSIVE', title: 'Aggressive Growth', desc: 'Higher weighting on cross-sell discovery' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  mode === m.id
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="font-bold text-xs text-white mb-1">{m.title}</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {statusMsg ? (
            <span className="text-xs text-emerald-400 font-bold animate-fade-in">{statusMsg}</span>
          ) : (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Changes log an immutable audit event.
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Policy...' : 'Save & Enforce Guardrails'}
          </button>
        </div>
      </div>
    </div>
  );
}
