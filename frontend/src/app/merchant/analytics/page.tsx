'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RevenueAttributionSummary, RevenueTrendPoint } from '@/types';
import { formatINR } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

export default function MerchantAnalyticsPage() {
  const [summary, setSummary] = useState<RevenueAttributionSummary | null>(null);
  const [trends, setTrends] = useState<RevenueTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [sumData, trendData] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getRevenueTrends()
        ]);
        setSummary(sumData);
        setTrends(trendData);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Feature K • Revenue Attribution
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Revenue Attribution & Financial Impact</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Deterministic attribution modeling showing exact rupee breakdown between organic baseline, AI-guided discovery, and cross-sell add-ons.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Organic Base Revenue</span>
          <div className="text-2xl font-black text-white">
            {summary ? formatINR(summary.organic_revenue) : '₹--'}
          </div>
          <p className="text-[11px] text-slate-500">Orders placed directly without AI assistance</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-purple-500/30 bg-purple-950/10 space-y-2">
          <span className="text-xs font-semibold text-purple-300">AI Upsell & Cross-Sell</span>
          <div className="text-2xl font-black text-purple-200">
            {summary ? formatINR(summary.upsell_revenue) : '₹--'}
          </div>
          <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +{summary?.aov_uplift_pct || 0}% AOV Increase
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-blue-500/30 bg-blue-950/10 space-y-2">
          <span className="text-xs font-semibold text-blue-300">Autonomous AI Buyer Revenue</span>
          <div className="text-2xl font-black text-blue-200">
            {summary ? formatINR(summary.ai_buyer_revenue) : '₹--'}
          </div>
          <p className="text-[11px] text-slate-400">{summary?.ai_buyer_orders_count || 0} programmatic orders</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Total Net Captured</span>
          <div className="text-2xl font-black text-emerald-400">
            {summary ? formatINR(summary.total_revenue) : '₹--'}
          </div>
          <p className="text-[11px] text-slate-400">{summary?.total_orders || 0} total paid orders</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white">Organic vs AI-Attributed Revenue Breakdown</h3>
        <div className="h-80 w-full pt-4">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="organic_revenue" name="Organic Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ai_revenue" name="AI Attributed Revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Loading attribution chart...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
