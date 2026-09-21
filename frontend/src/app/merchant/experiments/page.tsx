'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function ExperimentsPage() {
  const [expData, setExpData] = useState<any | null>(null);

  useEffect(() => {
    api.getExperiments()
      .then((data) => setExpData(data))
      .catch((err) => console.error('Failed to load experiment data:', err));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Feature L • A/B Experimentation
          </span>
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Experiment Active
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Storefront A/B Testing Suite</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Compare traditional static e-commerce storefronts against MerchantPilot AI-native conversational storefronts.
        </p>
      </div>

      {expData && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-purple-950/40 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-purple-300 uppercase">Statistically Significant Win</span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                +{expData.comparison.conversion_uplift_pct}% Conversion Uplift • +{expData.comparison.aov_uplift_pct}% AOV
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Confidence Level: <strong className="text-emerald-400">{expData.comparison.confidence_level_pct}%</strong> (p &lt; 0.01)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Revenue Growth</span>
              <span className="text-2xl font-black text-emerald-400">+{expData.comparison.total_revenue_uplift_pct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Baseline</span>
                  <h4 className="font-bold text-base text-slate-200">{expData.control.name}</h4>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-bold">
                  50% Traffic
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Visitors:</span>
                  <span className="font-semibold text-slate-200">{expData.control.visitors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conversion Rate:</span>
                  <span className="font-bold text-white">{expData.control.conversion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Order Value:</span>
                  <span className="font-semibold text-slate-200">{formatINR(expData.control.aov)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Upsell Acceptance:</span>
                  <span className="font-semibold text-slate-200">{expData.control.upsell_rate}%</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between text-sm font-bold">
                  <span className="text-slate-300">Generated Revenue:</span>
                  <span className="text-slate-200">{formatINR(expData.control.revenue)}</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-purple-500/40 bg-purple-950/10 p-6 space-y-4 shadow-xl shadow-purple-500/5">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase">Variant A</span>
                  <h4 className="font-bold text-base text-purple-200">{expData.variant.name}</h4>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  50% Traffic
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Visitors:</span>
                  <span className="font-semibold text-slate-200">{expData.variant.visitors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conversion Rate:</span>
                  <span className="font-bold text-emerald-400">{expData.variant.conversion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Order Value:</span>
                  <span className="font-bold text-purple-300">{formatINR(expData.variant.aov)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Upsell Acceptance:</span>
                  <span className="font-bold text-emerald-400">{expData.variant.upsell_rate}%</span>
                </div>
                <div className="pt-3 border-t border-purple-500/20 flex justify-between text-sm font-bold">
                  <span className="text-slate-200">Generated Revenue:</span>
                  <span className="text-emerald-400 font-extrabold">{formatINR(expData.variant.revenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
