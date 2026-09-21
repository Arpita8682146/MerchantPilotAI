'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { Search, Sparkles } from 'lucide-react';

const CATEGORIES = ['All', 'Laptops', 'Accessories', 'Mice', 'Keyboards', 'Monitors', 'Headphones', 'USB Accessories'];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProds = async () => {
      try {
        setIsLoading(true);
        const data = await api.getProducts(
          selectedCategory === 'All' ? undefined : selectedCategory,
          searchQuery || undefined
        );
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProds();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              TechNest Catalog
            </span>
            <span className="text-xs text-slate-400">30+ Developer & College Hardware Items</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Hardware & Peripherals</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Every product is enriched with AI compatibility metadata and deterministic recommendation factors.
          </p>
        </div>

        <a
          href="/ai-shop"
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition flex-shrink-0"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          Ask AI Sales Agent to Pick
        </a>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog (e.g. 16GB, Vivobook)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl glass-panel border border-slate-800 text-center text-slate-400">
          <p className="text-sm">No products found matching &ldquo;{searchQuery}&rdquo;.</p>
        </div>
      )}
    </div>
  );
}
