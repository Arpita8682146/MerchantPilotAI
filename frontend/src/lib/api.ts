import {
  Product, ProductDetail, ChatMessageResponse, Cart,
  RazorpayOrderResponse, PaymentVerifyResponse, Order,
  RevenueAttributionSummary, RevenueTrendPoint, FunnelStep,
  AgentMetricsSummary, AuditLog, MerchantRules, SupportEscalation
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    let errMsg = `API error ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.detail || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  getProducts: (category?: string, query?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('query', query);
    return fetchAPI<Product[]>(`/products?${params.toString()}`);
  },

  getProductDetail: (id: string) => fetchAPI<ProductDetail>(`/products/${id}`),

  chatWithAgent: (message: string, sessionId: string, persona: string = 'student', cartProductIds: string[] = []) =>
    fetchAPI<ChatMessageResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId,
        customer_persona: persona,
        current_cart_product_ids: cartProductIds,
      }),
    }),

  getCart: (sessionId: string) => fetchAPI<Cart>(`/cart?session_id=${sessionId}`),

  addCartItem: (sessionId: string, productId: string, isUpsell: boolean = false, addedVia: string = 'ORGANIC', quantity: number = 1) =>
    fetchAPI<Cart>(`/cart/items?session_id=${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity,
        is_upsell: isUpsell,
        added_via: addedVia,
      }),
    }),

  removeCartItem: (itemId: string) =>
    fetchAPI<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  createCheckoutOrder: (cartId: string, customerData: { name: string; email: string; phone: string; address: string }) =>
    fetchAPI<RazorpayOrderResponse>('/checkout/create-order', {
      method: 'POST',
      body: JSON.stringify({
        cart_id: cartId,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        shipping_address: customerData.address,
      }),
    }),

  getOrder: (orderId: string) => fetchAPI<Order>(`/checkout/orders/${orderId}`),

  verifyPayment: (data: { order_id: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    fetchAPI<PaymentVerifyResponse>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reportPaymentFailure: (data: { order_id: string; razorpay_order_id: string; error_code: string; error_description: string; customer_action: string }) =>
    fetchAPI<any>('/payments/report-failure', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAIProtocolCatalog: () => fetchAPI<any[]>('/ai-protocol/catalog'),
  searchAIProtocol: (query: string, maxPrice?: number) =>
    fetchAPI<any[]>('/ai-protocol/search', {
      method: 'POST',
      body: JSON.stringify({ query, max_price: maxPrice, limit: 6 }),
    }),
  createAICart: (buyerAgentId: string, items: { product_id: string; quantity: number }[]) =>
    fetchAPI<any>('/ai-protocol/cart', {
      method: 'POST',
      body: JSON.stringify({ buyer_agent_id: buyerAgentId, items }),
    }),
  aiCheckout: (cartId: string, buyerAgentId: string) =>
    fetchAPI<any>('/ai-protocol/checkout', {
      method: 'POST',
      body: JSON.stringify({
        cart_id: cartId,
        buyer_agent_id: buyerAgentId,
        shipping_info: { address: 'Automated AI Buyer Hub #104, Bangalore' },
      }),
    }),

  getAnalyticsSummary: () => fetchAPI<RevenueAttributionSummary>('/analytics/summary'),
  getRevenueTrends: () => fetchAPI<RevenueTrendPoint[]>('/analytics/trends'),
  getFunnelMetrics: () => fetchAPI<FunnelStep[]>('/analytics/funnel'),
  getAgentMetrics: () => fetchAPI<AgentMetricsSummary>('/analytics/agent'),
  getExperiments: () => fetchAPI<any>('/analytics/experiments'),
  getAuditLogs: (filters: { actor?: string; action?: string; result?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.actor) params.append('actor', filters.actor);
    if (filters.action) params.append('action', filters.action);
    if (filters.result) params.append('result', filters.result);
    return fetchAPI<AuditLog[]>(`/audit/logs?${params.toString()}`);
  },
  getMerchantRules: () => fetchAPI<MerchantRules>('/merchant/rules'),
  updateMerchantRules: (rules: Partial<MerchantRules>) =>
    fetchAPI<MerchantRules>('/merchant/rules', {
      method: 'PUT',
      body: JSON.stringify(rules),
    }),
  getEscalations: () => fetchAPI<SupportEscalation[]>('/merchant/escalations'),
  resolveEscalation: (id: string) =>
    fetchAPI<{ success: boolean; message: string }>(`/merchant/escalations/${id}/resolve`, {
      method: 'POST',
    }),
  enrichCatalog: () =>
    fetchAPI<{ success: boolean; message: string }>('/merchant/enrich-catalog', {
      method: 'POST',
    }),

  runDemoScenario: (scenarioId: string) =>
    fetchAPI<{ scenario: string; status: string; message: string; data: any }>('/demo/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId }),
    }),
  resetDemoDatabase: () => fetchAPI<any>('/demo/reset-seed', { method: 'POST' }),
};
