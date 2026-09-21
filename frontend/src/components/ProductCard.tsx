'use client';

import React, { useState } from 'react';
import { Product, AIRecommendationCard } from '@/types';
import { formatINR } from '@/lib/utils';
import { Sparkles, ShoppingCart, HelpCircle, Star, Check } from 'lucide-react';
import { WhyRecommendedModal } from './WhyRecommendedModal';
import { useCart } from '@/lib/cart-context';

interface ProductCardProps {
  product: Product;
  recommendationCard?: AIRecommendationCard;
  isUpsell?: boolean;
}

export function ProductCard({ product, recommendationCard, isUpsell = false }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addItem(product.id, isUpsell, isUpsell ? 'AI_RECOMMENDATION' : 'ORGANIC');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const defaultCard: AIRecommendationCard = recommendationCard || {
    product,
    recommendation_type: isUpsell ? 'UPSELL' : 'PRIMARY',
    confidence_score: 0.94,
    headline_reason: `Top-rated item in ${product.category} with verified student and developer suitability.`,
    factors: [
      { factor_name: 'Compatibility & Ecosystem', passed: true, description: 'Universal compatibility with standard setups', weight: 0.25 },
      { factor_name: 'Budget & Pricing', passed: true, description: `Competitively priced at ${formatINR(product.discounted_price)}`, weight: 0.25 },
      { factor_name: 'Rating & Satisfaction', passed: true, description: `${product.rating}★ verified satisfaction`, weight: 0.25 },
      { factor_name: 'Inventory Available', passed: true, description: `${product.stock} units currently in stock`, weight: 0.25 }
    ],
    estimated_aov_impact: product.discounted_price
  };

  return (
    <>
      <div className={`group relative rounded-2xl glass-panel border p-4 flex flex-col justify-between transition duration-200 hover:shadow-xl hover:shadow-blue-500/5 ${
        isUpsell ? 'border-purple-500/40 bg-purple-950/10' : 'border-slate-800 hover:border-blue-500/40'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            {product.category}
          </span>
          {isUpsell ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse-subtle">
              <Sparkles className="w-3 h-3 text-purple-400" /> AI Recommended Add-on
            </span>
          ) : (
            <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {product.rating}
            </div>
          )}
        </div>

        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-900 mb-3.5 border border-slate-800/80">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              No Image
            </div>
          )}
          {product.discount_percent > 0 && (
            <span className="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-md">
              {product.discount_percent}% OFF
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-white line-clamp-2 mb-1.5 group-hover:text-blue-400 transition">
              {product.name}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
              {product.description}
            </p>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3.5">
                {Object.entries(product.specifications).slice(0, 2).map(([k, v]) => (
                  <span key={k} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                    {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <div className="text-base font-extrabold text-white">
                {formatINR(product.discounted_price)}
              </div>
              {product.discount_percent > 0 && (
                <div className="text-[11px] text-slate-500 line-through">
                  {formatINR(product.price)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                title="Why is this recommended?"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition border border-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Why?</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={added || product.stock <= 0}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : isUpsell
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {isUpsell ? 'Add Upsell' : 'Add to Cart'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <WhyRecommendedModal
        card={showModal ? defaultCard : null}
        onClose={() => setShowModal(false)}
        onAddToCart={(pid, upsell) => addItem(pid, upsell, upsell ? 'AI_RECOMMENDATION' : 'ORGANIC')}
      />
    </>
  );
}
