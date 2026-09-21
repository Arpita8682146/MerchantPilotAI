'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AgentMetricsSummary, SupportEscalation } from '@/types';
import {
  LifeBuoy, RefreshCw, Check
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export default function AgentObservabilityPage() {
  const [metrics, setMetrics] = useState<AgentMetricsSummary | null>(null);
  const [escalations, setEscalations] = useState<SupportEscalation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [m, e] = await Promise.all([
        api.getAgentMetrics(),
        api.getEscalations()
      ]);
      setMetrics(m);
      setEscalations(e);
    } catch (err) {
      console.error('Failed to load agent observability:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveEscalation(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve ticket');
    }
  };

  const chartData = metrics?.tool_distribution
    ? Object.entries(metrics.tool_distribution).map(([k, v]) => ({
        tool: k.replace(/_/g, ' '),
        calls: v,
      }))
    : [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Feature P & Q • Observability & Escalations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Agent Telemetry & Handoffs</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Inspect tool execution distributions, latency percentiles, and human handoff escalation tickets.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Telemetry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Total Tool Invocations</span>
          <div className="text-2xl font-black text-white">{metrics?.total_tool_calls || 0}</div>
          <p className="text-[11px] text-slate-500">Deterministic tool executions</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-blue-500/30 bg-blue-950/10 space-y-2">
          <span className="text-xs font-semibold text-blue-300">Avg Agent Latency</span>
          <div className="text-2xl font-black text-blue-200">{metrics?.avg_latency_ms || 0}ms</div>
          <p className="text-[11px] text-emerald-400 font-semibold">⚡ Sub-second response</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Guardrails Enforced</span>
          <div className="text-2xl font-black text-amber-400">{metrics?.active_guardrails_triggered || 0}</div>
          <p className="text-[11px] text-slate-500">Bounded upsell limits enforced</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Human Escalation Tickets</span>
          <div className="text-2xl font-black text-purple-300">{escalations.filter((e) => e.status === 'OPEN').length} Open</div>
          <p className="text-[11px] text-slate-500">{escalations.length} total logged</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white">Tool Call Invocations</h3>
          <div className="h-64 w-full pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} />
                  <YAxis dataKey="tool" type="category" stroke="#64748B" fontSize={10} width={130} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="calls" name="Invocations" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading tool distribution...
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 p-6 rounded-3xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-purple-400" />
                Priority Escalation Tickets
              </h3>
              <span className="text-xs text-slate-400">Human Handoff Log</span>
            </div>

            <div className="space-y-2.5 pt-3 max-h-64 overflow-y-auto pr-1">
              {escalations.length > 0 ? (
                escalations.map((esc) => (
                  <div
                    key={esc.id}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                      esc.status === 'OPEN'
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-slate-900 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white">{esc.customer_email || 'Customer'}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          esc.status === 'OPEN' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {esc.status}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] truncate">&ldquo;{esc.customer_query}&rdquo;</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Reason: {esc.reason}</p>
                    </div>

                    {esc.status === 'OPEN' && (
                      <button
                        onClick={() => handleResolve(esc.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition flex-shrink-0"
                      >
                        <Check className="w-3 h-3" /> Resolve
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No active human escalations.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            When customer inquiries exceed agent confidence, the AI halts execution and passes context to staff.
          </div>
        </div>
      </div>
    </div>
  );
}
