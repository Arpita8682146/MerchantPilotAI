import React from 'react';
import { Sparkles, ArrowRight, Bot, ShieldCheck, Zap, LineChart, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-20">
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Razorpay AI Builder Buildathon 2026 ? Track 01: AI Growth & Agentic Commerce
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
          Turn Every Merchant into an <span className="gradient-text">AI-Native Store</span>.
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
          MerchantPilot AI gives merchants a conversational AI sales agent that discovers products, performs contextual cross-selling with bounded autonomy, and transacts directly with external AI buyers via structured commerce APIs.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/ai-shop"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            Launch AI Sales Agent
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="/merchant/dashboard"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm flex items-center gap-2 transition"
          >
            <LineChart className="w-4 h-4 text-purple-400" />
            Open Merchant Intelligence Portal
          </a>
        </div>

        <div className="mt-12 p-6 rounded-3xl glass-panel border border-slate-700/80 shadow-2xl text-left max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-2 font-mono text-[11px] text-slate-400">Customer Query ? Bounded Recommendation</span>
            </div>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Bounded Guardrails Enforced
            </span>
          </div>

          <div className="pt-4 space-y-3 font-sans text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 text-slate-200 border border-slate-700/60 max-w-[85%]">
              <span className="font-bold text-blue-400 block mb-0.5">Customer:</span>
              &ldquo;I need a laptop for coding under ?70,000. I am a CSE student and I also need a mouse.&rdquo;
            </div>

            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-slate-200 ml-auto max-w-[92%]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-400" /> MerchantPilot AI Sales Agent:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">320ms ? 98% Match</span>
              </div>
              <p className="text-slate-300 mb-2">
                I recommend the <strong>ASUS Vivobook 16X (16GB RAM / Core i5 13th Gen)</strong> at ?64,999. It easily handles Docker and IDEs.
              </p>
              <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[11px] text-purple-200 flex items-center justify-between">
                <span>?? <strong>Contextual Upsell:</strong> Added compatible <strong>Water-Resistant Sleeve (?999)</strong> and <strong>Silent Mouse (?1,299)</strong>.</span>
                <span className="font-bold text-emerald-400 ml-2">AOV +3.5%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Why MerchantPilot AI is Different
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Not a generic chatbot. A deterministic, revenue-attributing agentic commerce system built on 7 core pillars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Agent-Readable Catalog</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transforms standard product catalogs into structured schemas with compatibility matrices, upgrade paths, and use cases readable by any AI buyer.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Bounded Upsell Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic multi-factor scoring respecting merchant rules (e.g. Max Upsell Cap ?2,000). Provides observable &ldquo;Why Recommended?&rdquo; evidence.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Razorpay & Audit Trail</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Server-side HMAC SHA256 verification, zero-cart-loss payment failure recovery, and an immutable audit log for every transaction.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
