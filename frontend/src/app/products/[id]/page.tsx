'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductDetail } from '@/types';
import { formatINR } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';
import {
  Sparkles, ShoppingCart, Star, ArrowLeft,
  Check, Cpu, RefreshCw, CheckCircle2
} from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (id) {
      api.getProductDetail(id)
        .then((data) => setProduct(data))
        .catch((err) => console.error('Failed to load product detail:', err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    await addItem(product.id, false, 'ORGANIC');
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-3" />
        Loading product information...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center text-slate-400 space-y-4">
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <a href="/shop" className="inline-flex items-center gap-2 text-xs text-blue-400 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Return to Catalog
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-fade-in">
      <a href="/shop" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 glass-panel rounded-3xl border border-slate-800 p-6 flex items-center justify-center bg-slate-900/60 overflow-hidden relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full max-h-96 object-cover rounded-2xl border border-slate-700/60 shadow-2xl"
            />
          ) : (
            <div className="h-72 w-full flex items-center justify-center text-slate-600">
              <Cpu className="w-16 h-16" />
            </div>
          )}
          {product.discount_percent > 0 && (
            <span className="absolute top-8 left-8 text-xs font-black px-3 py-1 rounded-lg bg-rose-600 text-white shadow-lg">
              {product.discount_percent}% OFF
            </span>
          )}
        </div>

        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {product.rating} ({Math.round(product.popularity_score * 100)}% popularity)
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {product.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-baseline gap-4">
              <span className="text-3xl font-black text-white">
                {formatINR(product.discounted_price)}
              </span>
              {product.discount_percent > 0 && (
                <span className="text-sm text-slate-500 line-through">
                  {formatINR(product.price)}
                </span>
              )}
              <span className="text-xs text-emerald-400 font-semibold ml-auto flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock} units)
              </span>
            </div>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Technical Specifications</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                      <span className="text-slate-400 block capitalize text-[11px]">{k.replace('_', ' ')}</span>
                      <span className="font-bold text-white">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleAddToCart}
              disabled={added || product.stock <= 0}
              className={`w-full sm:flex-1 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg active:scale-95 ${
                added ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Added to Smart Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" /> Add to Cart ({formatINR(product.discounted_price)})
                </>
              )}
            </button>

            <a
              href="/ai-shop"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-purple-400" /> Ask AI to Pair Add-ons
            </a>
          </div>
        </div>
      </div>

      {product.compatible_products && product.compatible_products.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Compatible Add-ons & Peripherals</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {product.compatible_products.map((p) => (
              <ProductCard key={p.id} product={p} isUpsell={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
