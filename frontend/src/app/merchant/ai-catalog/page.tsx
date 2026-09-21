'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { formatINR } from '@/lib/utils';
import { Sparkles, CheckCircle2, Database } from 'lucide-react';

export default function AICatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadCatalog = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
      if (data.length > 0 && !selectedProduct) {
        setSelectedProduct(data[0]);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleEnrich = async () => {
    try {
      setEnriching(true);
      const res = await api.enrichCatalog();
      setStatusMsg(`✓ ${res.message}`);
      setTimeout(() => setStatusMsg(null), 4000);
      await loadCatalog();
    } catch (err: any) {
      setStatusMsg(`❌ ${err.message}`);
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Feature A • Agent-Readable Catalog
            </span>
            <span className="text-xs text-slate-400">AI Commerce Transformation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI-Native Product Catalog</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Converts standard e-commerce listings into rich agent-consumable schemas with hardware compatibility graphs, workflows, and upgrade paths.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {statusMsg && (
            <span className="text-xs text-emerald-400 font-bold animate-pulse">{statusMsg}</span>
          )}
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${enriching ? 'animate-spin' : ''}`} />
            {enriching ? 'Enriching Graph...' : 'Re-Enrich AI Metadata'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 glass-panel rounded-3xl border border-slate-800 p-4 space-y-3 h-[600px] flex flex-col">
          <h3 className="font-bold text-sm text-white px-2 flex items-center justify-between">
            <span>Catalog Items ({products.length})</span>
            <span className="text-xs text-slate-500 font-normal">Click to inspect</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {products.map((p) => {
              const isSelected = selectedProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {p.category} • {formatINR(p.discounted_price)}
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400">
                    {p.sku}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {selectedProduct ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
              <div className="glass-panel rounded-3xl border border-slate-800 p-5 flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <Database className="w-4 h-4 text-slate-500" />
                    <span>Traditional HTML Listing</span>
                  </div>

                  <div className="pt-4 space-y-3 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Title</span>
                      <p className="font-bold text-white text-sm">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Category & Price</span>
                      <p className="font-semibold text-slate-200">{selectedProduct.category} • {formatINR(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Description (Unstructured Text)</span>
                      <p className="text-slate-400 text-xs line-clamp-4 leading-relaxed">
                        {selectedProduct.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-500">
                  ⚠️ Hard for external AI buyers and autonomous agents to reason about compatibility or workflow suitability.
                </div>
              </div>

              <div className="glass-panel rounded-3xl border border-purple-500/30 bg-purple-950/10 p-5 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 text-xs font-bold text-purple-300">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>AI Commerce Protocol Schema</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                      JSON-LD / Agent Spec
                    </span>
                  </div>

                  <div className="mt-3 flex-1 overflow-y-auto bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 font-mono text-[11px] text-blue-300 space-y-1">
                    <pre className="whitespace-pre-wrap">
{JSON.stringify(
  {
    product_id: selectedProduct.id,
    sku: selectedProduct.sku,
    name: selectedProduct.name,
    category: selectedProduct.category,
    price: selectedProduct.price,
    discounted_price: selectedProduct.discounted_price,
    currency: 'INR',
    availability: selectedProduct.stock > 0 ? 'in_stock' : 'out_of_stock',
    stock_count: selectedProduct.stock,
    specifications: selectedProduct.specifications,
    use_cases: selectedProduct.use_cases,
    target_customer: selectedProduct.target_customer,
    popularity_score: selectedProduct.popularity_score,
    rating: selectedProduct.rating,
    merchant_margin: selectedProduct.merchant_margin,
    return_policy: selectedProduct.return_policy,
  },
  null,
  2
)}
                    </pre>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 flex items-center gap-2 mt-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Programmatically transactable via standard <code>/api/ai-protocol/*</code> endpoints.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 glass-panel rounded-3xl border border-slate-800 text-center text-slate-400">
              Select a product from the left to inspect its AI transformation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
