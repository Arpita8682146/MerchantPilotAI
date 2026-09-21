export interface Product {
  id: string;
  merchant_id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discount_percent: number;
  discounted_price: number;
  stock: number;
  specifications: Record<string, any>;
  use_cases: string[];
  target_customer: string | null;
  tags: string[];
  popularity_score: number;
  rating: number;
  merchant_margin: number;
  return_policy: string;
  image_url: string | null;
  is_active: boolean;
}

export interface ProductDetail extends Product {
  compatible_products: Product[];
  complementary_products: Product[];
  alternatives: Product[];
  upgrades: Product[];
}

export interface WhyRecommendedFactor {
  factor_name: string;
  passed: boolean;
  description: string;
  weight: number;
}

export interface AIRecommendationCard {
  product: Product;
  recommendation_type: 'PRIMARY' | 'UPSELL' | 'CROSS_SELL' | 'ALTERNATIVE';
  confidence_score: number;
  headline_reason: string;
  factors: WhyRecommendedFactor[];
  estimated_aov_impact: number;
}

export interface ToolExecutionInfo {
  tool_name: string;
  parameters: Record<string, any>;
  result_summary: string;
  status: string;
}

export interface ChatMessageResponse {
  session_id: string;
  reply: string;
  recommended_products: AIRecommendationCard[];
  upsell_products: AIRecommendationCard[];
  suggested_questions: string[];
  needs_clarification: boolean;
  is_escalated: boolean;
  tool_executions: ToolExecutionInfo[];
  latency_ms: number;
  bounded_guardrail_applied: boolean;
  guardrail_note: string | null;
}

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  image_url: string | null;
  category: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  is_upsell: boolean;
  added_via: string;
}

export interface Cart {
  id: string;
  session_id: string;
  merchant_id: string;
  items: CartItem[];
  item_count: number;
  base_subtotal: number;
  upsell_subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  original_aov: number;
  projected_aov: number;
  aov_uplift_percent: number;
  ai_added_value: number;
  available_upsells: AIRecommendationCard[];
}

export interface RazorpayOrderResponse {
  razorpay_order_id: string;
  amount: number; // in paise
  currency: string;
  key_id: string;
  merchant_name: string;
  order_id: string;
  order_number: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  status: string;
  order_id: string;
  order_number: string;
  payment_id: string | null;
  message: string;
  revenue_breakdown: {
    total_revenue: number;
    organic_revenue: number;
    ai_assisted_revenue: number;
    upsell_revenue: number;
    final_revenue: number;
  } | null;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  is_upsell: boolean;
  added_via: string;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  organic_revenue: number;
  ai_assisted_revenue: number;
  upsell_revenue: number;
  cross_sell_revenue: number;
  final_revenue: number;
  customer_name: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  created_at: string;
  items: OrderItem[];
  payment_status: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
}

export interface RevenueAttributionSummary {
  total_revenue: number;
  organic_revenue: number;
  ai_assisted_revenue: number;
  upsell_revenue: number;
  cross_sell_revenue: number;
  ai_revenue_share_pct: number;
  aov_overall: number;
  aov_ai_assisted: number;
  aov_organic: number;
  aov_uplift_pct: number;
  total_orders: number;
  ai_assisted_orders: number;
  upsell_acceptance_rate: number;
  cart_abandonment_rate: number;
  ai_buyer_orders_count: number;
  ai_buyer_revenue: number;
}

export interface RevenueTrendPoint {
  date: string;
  total_revenue: number;
  ai_revenue: number;
  organic_revenue: number;
  order_count: number;
}

export interface FunnelStep {
  step: string;
  count: number;
  pct: number;
}

export interface AgentMetricsSummary {
  total_sessions: number;
  total_tool_calls: number;
  avg_latency_ms: number;
  success_rate_pct: number;
  active_guardrails_triggered: number;
  human_escalations_count: number;
  tool_distribution: Record<string, number>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  reference_type: string | null;
  reference_id: string | null;
  decision: string | null;
  result: string;
  metadata_info: Record<string, any>;
  order_id: string | null;
  payment_id: string | null;
}

export interface MerchantRules {
  id: string;
  merchant_id: string;
  ai_agent_enabled: boolean;
  max_upsell_amount: number;
  max_discount_percent: number;
  allowed_categories: string[];
  blacklisted_products: string[];
  recommendation_mode: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  updated_at: string;
}

export interface SupportEscalation {
  id: string;
  session_id: string | null;
  customer_email: string | null;
  customer_query: string;
  ai_confidence_score: number;
  reason: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
}
