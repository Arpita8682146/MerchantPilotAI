'use client';

import React from 'react';
import { X, CheckCircle2, ShieldCheck, Cpu, Sparkles } from 'lucide-react';
import { AIRecommendationCard } from '@/types';
import { formatINR } from '@/lib/utils';

interface WhyRecommendedModalProps {
  card: AIRecommendationCard | null;
  onClose: () => void;
  onAddToCart?: (productId: string, isUpsell: boolean) => void;
}

export function WhyRecommendedModal({ card, onClose, onAddToCart }: WhyRecommendedModalProps) {
  if (!card) return null;

  const { product, factors, confidence_score, headline_reason, recommendation_type } = card;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up">
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Why Recommended?</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {Math.round(confidence_score * 100)}% Match
                </span>
              </div>
              <p className="text-xs text-slate-400">Observable evidence & compatibility breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover bg-slate-900 flex-shrink-0 border border-slate-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500">
                <Cpu className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm text-white truncate">{product.name}</h4>
              <p className="text-xs text-slate-400">{product.category} • SKU: {product.sku}</p>
              <div className="text-sm font-bold text-blue-400 mt-0.5">
                {formatINR(product.discounted_price)}
                {product.discount_percent > 0 && (
                  <span className="text-xs text-slate-400 line-through ml-2 font-normal">
                    {formatINR(product.price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200">
            <span className="font-bold block text-blue-400 mb-0.5">AI Decision Summary:</span>
            {headline_reason}
          </div>

          <div>
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Deterministic Factor Scoring
            </h5>
            <div className="space-y-2">
              {factors && factors.length > 0 ? (
                factors.map((f, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                      f.passed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        f.passed ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span>{f.factor_name}</span>
                        <span className="text-[10px] text-slate-400">Weight: {Math.round(f.weight * 100)}%</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">
                  ✓ Verified hardware compatibility and merchant inventory.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Bounded Autonomy: Recommendation respects merchant price limits and stock availability in real-time.
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Close
          </button>
          {onAddToCart && (
            <button
              onClick={() => {
                onAddToCart(product.id, recommendation_type === 'UPSELL' || recommendation_type === 'CROSS_SELL');
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-md"
            >
              Add {product.name.split(' ')[0]} to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
