'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RevenueAttributionSummary, RevenueTrendPoint, FunnelStep } from '@/types';
import { formatINR } from '@/lib/utils';
import {
  DollarSign, Sparkles, TrendingUp,
  Percent, ArrowUpRight, ShieldCheck, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid
} from 'recharts';

export default function MerchantDashboardPage() {
  const [summary, setSummary] = useState<RevenueAttributionSummary | null>(null);
  const [trends, setTrends] = useState<RevenueTrendPoint[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sumData, trendData, funnelData] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getRevenueTrends(),
        api.getFunnelMetrics()
      ]);
      setSummary(sumData);
      setTrends(trendData);
      setFunnel(funnelData);
    } catch (err) {
      console.error('Failed to load merchant metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Live Financial Intelligence
            </span>
            <span className="text-xs text-slate-400">TechNest Flagship Store</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Executive Commerce Dashboard</h1>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Total Captured Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary ? formatINR(summary.total_revenue) : '₹--'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Organic: {summary ? formatINR(summary.organic_revenue) : '₹--'}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-purple-500/30 bg-purple-950/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
            <span>AI-Assisted Revenue</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-200">
            {summary ? formatINR(summary.ai_assisted_revenue) : '₹--'}
          </div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {summary?.ai_revenue_share_pct || 0}% of Total Revenue
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary ? formatINR(summary.aov_overall) : '₹--'}
          </div>
          <div className="text-[11px] text-purple-400 font-bold">
            AI AOV: {summary ? formatINR(summary.aov_ai_assisted) : '₹--'} (+{summary?.aov_uplift_pct || 0}%)
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Upsell Acceptance Rate</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary?.upsell_acceptance_rate || 0}%
          </div>
          <div className="text-[11px] text-slate-400">
            {summary?.total_orders || 0} total paid orders recorded
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Captured Revenue Growth</h3>
              <p className="text-xs text-slate-400">Total Revenue vs AI-Attributed Revenue over time</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-slate-300">Total Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                <span className="text-purple-300">AI Revenue</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any) => [formatINR(Number(value)), '']}
                  />
                  <Area type="monotone" dataKey="total_revenue" name="Total Revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" />
                  <Area type="monotone" dataKey="ai_revenue" name="AI Attributed Revenue" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#aiGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading trend visualization...
              </div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">AI Conversion Funnel</h3>
            <p className="text-xs text-slate-400">Visitor progression to paid orders</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {funnel.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{step.step}</span>
                  <span className="text-blue-400 font-mono">{step.count.toLocaleString()} ({step.pct}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, step.pct)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 mt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>AI Sales Agent achieves 18.7% direct conversion vs 5.8% baseline storefront.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
