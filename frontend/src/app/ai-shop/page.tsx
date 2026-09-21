'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Bot, User, ShoppingCart, HelpCircle,
  ShieldCheck, Plus
} from 'lucide-react';
import { AIRecommendationCard, ChatMessageResponse, ToolExecutionInfo } from '@/types';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { formatINR } from '@/lib/utils';
import { WhyRecommendedModal } from '@/components/WhyRecommendedModal';
import { RazorpayModal } from '@/components/RazorpayModal';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommended_products?: AIRecommendationCard[];
  upsell_products?: AIRecommendationCard[];
  tool_executions?: ToolExecutionInfo[];
  needs_clarification?: boolean;
  is_escalated?: boolean;
  latency_ms?: number;
  guardrail_note?: string | null;
}

const DEFAULT_SUGGESTIONS = [
  "I need a laptop for coding under ₹70,000. I am a CSE student and I also need a mouse.",
  "What is the best ultrabook for college under ₹50,000?",
  "I need a gaming laptop under ₹80,000 with RTX graphics.",
  "Compare MacBook Air M2 vs ThinkPad E14 for software development."
];

export default function AIShopPage() {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: "Hello! 👋 I am your TechNest AI Sales Agent. Tell me what you're looking for, your budget, or your workflow (e.g. CSE Coding, Machine Learning, Gaming, or Office Work), and I will find the best hardware match and compatible accessories!",
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [persona, setPersona] = useState('student');
  const [activeModalCard, setActiveModalCard] = useState<AIRecommendationCard | null>(null);
  const [checkoutOrderData, setCheckoutOrderData] = useState<any | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { cart, addItem, removeItem, sessionId } = useCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    const userMsgId = 'msg-user-' + Date.now();
    const newMessages: MessageItem[] = [
      ...messages,
      { id: userMsgId, role: 'user', content: text }
    ];
    setMessages(newMessages);
    setInputVal('');
    setIsTyping(true);

    try {
      const cartProductIds = cart?.items.map((i) => i.product_id) || [];
      const res: ChatMessageResponse = await api.chatWithAgent(
        text,
        sessionId,
        persona,
        cartProductIds
      );

      const botMsg: MessageItem = {
        id: 'msg-bot-' + Date.now(),
        role: 'assistant',
        content: res.reply,
        recommended_products: res.recommended_products,
        upsell_products: res.upsell_products,
        tool_executions: res.tool_executions,
        needs_clarification: res.needs_clarification,
        is_escalated: res.is_escalated,
        latency_ms: res.latency_ms,
        guardrail_note: res.guardrail_note
      };

      setMessages([...newMessages, botMsg]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: 'msg-err-' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving the catalog information. Please try again or explore our catalog directly.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty! Add a recommended product to start checkout.');
      return;
    }

    try {
      setIsCheckingOut(true);
      const rzpOrder = await api.createCheckoutOrder(cart.id, {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@nitk.edu.in',
        phone: '9876543210',
        address: '402, Innov8 Cyber Tech Park, Koramangala, Bengaluru, KA 560034'
      });
      setCheckoutOrderData(rzpOrder);
    } catch (err: any) {
      alert(err.message || 'Failed to start Razorpay checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl min-h-[600px] h-[calc(100vh-9.5rem)]">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">TechNest AI Sales Assistant</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Bounded Autonomy • Contextual Upsell Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              title="Customer Persona Context"
            >
              <option value="student">Persona: CSE Student</option>
              <option value="developer">Persona: Software Engineer</option>
              <option value="gamer">Persona: Gamer & Creator</option>
              <option value="office_worker">Persona: Office Professional</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-3.5 max-w-[88%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {msg.latency_ms !== undefined && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Agent Latency: {msg.latency_ms}ms</span>
                      {msg.guardrail_note && (
                        <span className="text-amber-400 font-medium">🛡️ {msg.guardrail_note}</span>
                      )}
                    </div>
                  )}
                </div>

                {msg.recommended_products && msg.recommended_products.length > 0 && (
                  <div className="space-y-2 text-left animate-slide-up">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <Sparkles className="w-3.5 h-3.5" /> Primary Recommendation
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.recommended_products.map((rec, i) => (
                        <div
                          key={rec.product.id || i}
                          className="p-3.5 rounded-2xl bg-slate-900 border border-blue-500/30 hover:border-blue-500/60 transition shadow-lg flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-2">
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                                {rec.product.category}
                              </span>
                              <span className="font-bold text-purple-300">
                                {Math.round(rec.confidence_score * 100)}% Match
                              </span>
                            </div>

                            <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 mb-1">
                              {rec.product.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                              {rec.product.description}
                            </p>

                            <div className="text-xs font-bold text-blue-400 mb-3">
                              {formatINR(rec.product.discounted_price)}
                              {rec.product.discount_percent > 0 && (
                                <span className="text-[10px] text-slate-500 line-through ml-1.5 font-normal">
                                  {formatINR(rec.product.price)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setActiveModalCard(rec)}
                              className="text-[11px] text-slate-300 hover:text-blue-400 flex items-center gap-1 font-semibold transition"
                            >
                              <HelpCircle className="w-3.5 h-3.5" /> Why this?
                            </button>
                            <button
                              onClick={() => addItem(rec.product.id, false, 'AI_RECOMMENDATION')}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow transition active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.upsell_products && msg.upsell_products.length > 0 && (
                  <div className="space-y-2 text-left animate-slide-up">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Contextual Add-ons & Accessories
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.upsell_products.map((up, i) => (
                        <div
                          key={up.product.id || i}
                          className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 hover:border-purple-500/50 transition flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-purple-400 uppercase">Compatible Add-on</div>
                            <h5 className="font-bold text-xs text-white truncate">{up.product.name}</h5>
                            <div className="text-xs font-extrabold text-slate-200 mt-0.5">
                              {formatINR(up.product.discounted_price)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => setActiveModalCard(up)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                              title="Why recommended?"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => addItem(up.product.id, true, 'AI_RECOMMENDATION')}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]"></span>
                <span>Searching catalog & evaluating compatibility...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar flex-shrink-0">
          <span className="text-slate-400 font-semibold flex-shrink-0">Suggested:</span>
          {DEFAULT_SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(s)}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex-shrink-0 transition truncate max-w-xs hover:border-blue-500/50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Tell me what you need (e.g. 'Laptop for CSE coding under ₹70,000 + mouse')..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-80 glass-panel rounded-3xl border border-slate-800/80 p-5 flex flex-col justify-between shadow-2xl h-[calc(100vh-9.5rem)] flex-shrink-0">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Smart Cart</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {cart?.item_count || 0} items
            </span>
          </div>

          <div className="space-y-3 max-h-[38vh] overflow-y-auto pr-1">
            {cart && cart.items.length > 0 ? (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    item.is_upsell
                      ? 'bg-purple-950/20 border-purple-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {item.is_upsell && (
                      <span className="text-[9px] font-bold text-purple-400 block uppercase">AI Upsell Add-on</span>
                    )}
                    <h5 className="font-semibold text-white truncate">{item.product_name}</h5>
                    <div className="text-[11px] text-slate-400">
                      {formatINR(item.unit_price)} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-200 block">{formatINR(item.line_total)}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[10px] text-rose-400 hover:underline mt-0.5"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Cart is empty. Ask the AI agent for recommendations!
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          {cart && cart.upsell_subtotal > 0 && (
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] flex items-center justify-between text-purple-200">
              <span>✨ AI Upsell Value:</span>
              <span className="font-bold text-emerald-400">+{formatINR(cart.upsell_subtotal)} (+{cart.aov_uplift_percent}%)</span>
            </div>
          )}

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-slate-200">{formatINR((cart?.base_subtotal || 0) + (cart?.upsell_subtotal || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%):</span>
              <span className="text-slate-200">{formatINR(cart?.tax_amount || 0)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
              <span>Total Payable:</span>
              <span className="text-blue-400">{formatINR(cart?.total_amount || 0)}</span>
            </div>
          </div>

          <button
            onClick={handleQuickCheckout}
            disabled={!cart || cart.items.length === 0 || isCheckingOut}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition active:scale-[0.99] disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            {isCheckingOut ? 'Initializing Razorpay...' : `Checkout with Razorpay (${formatINR(cart?.total_amount || 0)})`}
          </button>
        </div>
      </div>

      <WhyRecommendedModal
        card={activeModalCard}
        onClose={() => setActiveModalCard(null)}
        onAddToCart={(pid, upsell) => addItem(pid, upsell, upsell ? 'AI_RECOMMENDATION' : 'ORGANIC')}
      />

      <RazorpayModal
        orderData={checkoutOrderData}
        onClose={() => setCheckoutOrderData(null)}
      />
    </div>
  );
}
