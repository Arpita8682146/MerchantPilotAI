'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, ShoppingCart, LayoutDashboard, Bot, Compass } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatINR } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { cart, notification } = useCart();
  const isMerchantPortal = pathname.startsWith('/merchant');

  return (
    <nav className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                MerchantPilot <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">Agentic Commerce Engine</span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            <a
              href="/ai-shop"
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                pathname === '/ai-shop'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              AI Sales Agent
            </a>
            <a
              href="/shop"
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                pathname === '/shop'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4 text-slate-400" />
              Catalog
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notification && (
            <div className="hidden lg:flex items-center gap-2 bg-blue-950/80 text-blue-300 text-xs px-3 py-1.5 rounded-full border border-blue-500/40 animate-fade-in shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              {notification}
            </div>
          )}

          <a
            href="/merchant/dashboard"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              isMerchantPortal
                ? 'bg-purple-900/40 text-purple-200 border-purple-500/40 shadow-sm'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
            Merchant Portal
          </a>

          <a
            href="/cart"
            className="relative px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cart && cart.item_count > 0 && (
              <span className="bg-white text-blue-600 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
                {cart.item_count}
              </span>
            )}
            {cart && cart.total_amount > 0 && (
              <span className="hidden md:inline font-medium opacity-90 pl-1 border-l border-blue-400/50">
                {formatINR(cart.total_amount)}
              </span>
            )}
          </a>
        </div>
      </div>
    </nav>
  );
}
