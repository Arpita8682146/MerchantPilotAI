'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AuditLog } from '@/types';
import { Search, RefreshCw } from 'lucide-react';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actorFilter, setActorFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAuditLogs({
        actor: actorFilter || undefined,
        result: resultFilter || undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actorFilter, resultFilter]);

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(s) ||
      (l.decision && l.decision.toLowerCase().includes(s)) ||
      l.actor.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Feature N • Immutable Audit Trail
            </span>
            <span className="text-xs text-slate-400">Cryptographic & Regulatory Auditability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">System Audit Log</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Every recommendation, cart addition, guardrail enforcement, and Razorpay signature verification is permanently logged.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Actors</option>
          <option value="AI_AGENT">AI_AGENT</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="RAZORPAY">RAZORPAY</option>
          <option value="AI_BUYER">AI_BUYER</option>
          <option value="MERCHANT_ADMIN">MERCHANT_ADMIN</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Results</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="BLOCKED_BY_GUARDRAIL">BLOCKED_BY_GUARDRAIL</option>
          <option value="FAILED">FAILED</option>
        </select>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action or decision..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Decision / Rationale</th>
                <th className="p-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isBlocked = log.result === 'BLOCKED_BY_GUARDRAIL';
                  const isFailed = log.result === 'FAILED';
                  const isSuccess = log.result === 'SUCCESS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                            log.actor === 'AI_AGENT'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : log.actor === 'RAZORPAY'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : log.actor === 'AI_BUYER'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {log.actor}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-semibold text-white whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="p-4 text-slate-300 max-w-md">
                        <p className="truncate">{log.decision || 'Action executed successfully.'}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${
                            isSuccess
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : isBlocked
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isSuccess && '✓'}
                          {isBlocked && '🛡️'}
                          {isFailed && '⚠️'}
                          {log.result}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No audit records matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
