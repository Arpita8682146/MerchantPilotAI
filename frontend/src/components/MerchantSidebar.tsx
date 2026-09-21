'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Sparkles, Bot, LineChart, ShieldAlert,
  Sliders, FlaskConical, LifeBuoy, PlayCircle, Store
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/merchant/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { href: '/merchant/ai-catalog', label: 'AI Catalog & Schemas', icon: Sparkles },
  { href: '/merchant/ai-buyer', label: 'AI Buyer Simulator', icon: Bot, badge: 'Protocol' },
  { href: '/merchant/analytics', label: 'Revenue Attribution', icon: LineChart },
  { href: '/merchant/audit', label: 'Audit Trail (Immutable)', icon: ShieldAlert },
  { href: '/merchant/experiments', label: 'A/B Experimentation', icon: FlaskConical },
  { href: '/merchant/settings', label: 'Guardrails & Rules', icon: Sliders },
  { href: '/merchant/agent', label: 'Agent Observability', icon: LifeBuoy },
  { href: '/merchant/demo', label: 'Buildathon Demo Hub', icon: PlayCircle, highlight: true },
];

export function MerchantSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div>
        <div className="px-3 py-2 mb-4 rounded-xl bg-purple-950/30 border border-purple-500/20">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Merchant Console</span>
          <span className="text-sm font-bold text-white block truncate">TechNest Electronics</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Storefront Active
          </span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : item.highlight
                    ? 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : item.highlight ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800/80">
        <a
          href="/ai-shop"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition border border-slate-700"
        >
          <Store className="w-4 h-4 text-blue-400" />
          <span>View Customer Store</span>
        </a>
      </div>
    </aside>
  );
}
