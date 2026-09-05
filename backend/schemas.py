from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Base & Generic
class SuccessResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None

# Merchant Schemas
class MerchantBase(BaseModel):
    name: str
    slug: str
    category: str = "Electronics & Tech"
    currency: str = "INR"
    description: Optional[str] = None

class MerchantCreate(MerchantBase):
    pass

class MerchantResponse(MerchantBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductRelationResponse(BaseModel):
    target_product_id: str
    relation_type: str
    relevance_score: float
    reason: str
    target_product_name: Optional[str] = None
    target_product_price: Optional[float] = None
    target_product_image: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    merchant_id: str
    sku: str
    name: str
    description: str
    category: str
    price: float
    discount_percent: float
    discounted_price: float
    stock: int
    specifications: Dict[str, Any] = {}
    use_cases: List[str] = []
    target_customer: Optional[str] = None
    tags: List[str] = []
    popularity_score: float
    rating: float
    merchant_margin: float
    return_policy: str
    image_url: Optional[str] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class ProductDetailResponse(ProductResponse):
    compatible_products: List[ProductResponse] = []
    complementary_products: List[ProductResponse] = []
    alternatives: List[ProductResponse] = []
    upgrades: List[ProductResponse] = []

# AI Recommendation & Explainer Schemas
class WhyRecommendedFactor(BaseModel):
    factor_name: str
    passed: bool
    description: str
    weight: float

class AIRecommendationCard(BaseModel):
    product: ProductResponse
    recommendation_type: str  # PRIMARY, UPSELL, CROSS_SELL, ALTERNATIVE
    confidence_score: float
    headline_reason: str
    factors: List[WhyRecommendedFactor] = []
    estimated_aov_impact: Optional[float] = 0.0

# Chat & Agent Schemas
class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    customer_email: Optional[str] = "student.buyer@technest.io"
    customer_persona: Optional[str] = "student"
    current_cart_product_ids: Optional[List[str]] = []

class ToolExecutionInfo(BaseModel):
    tool_name: str
    parameters: Dict[str, Any] = {}
    result_summary: str
    status: str = "SUCCESS"

class ChatMessageResponse(BaseModel):
    session_id: str
    reply: str
    recommended_products: List[AIRecommendationCard] = []
    upsell_products: List[AIRecommendationCard] = []
    suggested_questions: List[str] = []
    needs_clarification: bool = False
    is_escalated: bool = False
    tool_executions: List[ToolExecutionInfo] = []
    latency_ms: int = 0
    bounded_guardrail_applied: bool = False
    guardrail_note: Optional[str] = None

# Smart Cart Schemas
class CartItemAddRequest(BaseModel):
    product_id: str
    quantity: int = 1
    is_upsell: bool = False
    recommendation_id: Optional[str] = None
    added_via: str = "ORGANIC"  # ORGANIC, AI_RECOMMENDATION, AI_BUYER

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    sku: str
    image_url: Optional[str] = None
    category: str
    unit_price: float
    quantity: int
    line_total: float
    is_upsell: bool
    added_via: str

class CartResponse(BaseModel):
    id: str
    session_id: str
    merchant_id: str
    items: List[CartItemResponse] = []
    item_count: int
    base_subtotal: float
    upsell_subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    original_aov: float
    projected_aov: float
    aov_uplift_percent: float
    ai_added_value: float
    available_upsells: List[AIRecommendationCard] = []

# Checkout & Payment Schemas
class CheckoutCreateOrderRequest(BaseModel):
    cart_id: str
    customer_name: str = "Aarav Sharma"
    customer_email: str = "aarav.sharma@example.com"
    customer_phone: str = "9876543210"
    shipping_address: str = "402, Innov8 Cyber Tech Park, Koramangala, Bengaluru, KA 560034"

class RazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int  # in paise
    currency: str = "INR"
    key_id: str
    merchant_name: str
    order_id: str
    order_number: str
    total_amount: float
    customer_name: str
    customer_email: str
    customer_phone: str

class PaymentVerifyRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentFailureReportRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    error_code: str
    error_description: str
    customer_action: str = "RETRY"

class PaymentVerifyResponse(BaseModel):
    success: bool
    status: str
    order_id: str
    order_number: str
    payment_id: Optional[str] = None
    message: str
    revenue_breakdown: Optional[Dict[str, float]] = None

class PaymentRecoveryResponse(BaseModel):
    order_id: str
    cart_id: str
    can_retry: bool
    suggested_action: str
    recovery_message: str

# Order Schemas
class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    sku: str
    unit_price: float
    quantity: int
    is_upsell: bool
    added_via: str
    line_total: float

class OrderResponse(BaseModel):
    id: str
    order_number: str
    status: str
    total_amount: float
    subtotal: float
    discount_amount: float
    tax_amount: float
    organic_revenue: float
    ai_assisted_revenue: float
    upsell_revenue: float
    cross_sell_revenue: float
    final_revenue: float
    customer_name: Optional[str]
    customer_email: Optional[str]
    shipping_address: Optional[str]
    created_at: datetime
    items: List[OrderItemResponse] = []
    payment_status: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None

# AI Commerce Protocol API Schemas
class AIProtocolCatalogProduct(BaseModel):
    product_id: str
    sku: str
    name: str
    description: str
    category: str
    price: float
    currency: str = "INR"
    availability: str = "in_stock"
    stock_count: int
    specifications: Dict[str, Any]
    use_cases: List[str]
    target_customer: Optional[str]
    compatible_products: List[str]
    complementary_products: List[str]
    alternatives: List[str]
    tags: List[str]
    rating: float
    return_policy: str

class AIProtocolSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    max_price: Optional[float] = None
    use_cases: Optional[List[str]] = None
    limit: int = 5

class AIProtocolCartCreateRequest(BaseModel):
    buyer_agent_id: str
    items: List[Dict[str, Any]]  # [{"product_id": "...", "quantity": 1}]

class AIProtocolCheckoutRequest(BaseModel):
    cart_id: str
    buyer_agent_id: str
    shipping_info: Dict[str, str]

# Merchant Guardrail Rules
class MerchantRuleResponse(BaseModel):
    id: str
    merchant_id: str
    ai_agent_enabled: bool
    max_upsell_amount: float
    max_discount_percent: float
    allowed_categories: List[str]
    blacklisted_products: List[str]
    recommendation_mode: str
    updated_at: datetime

    class Config:
        from_attributes = True

class MerchantRuleUpdate(BaseModel):
    ai_agent_enabled: Optional[bool] = None
    max_upsell_amount: Optional[float] = None
    max_discount_percent: Optional[float] = None
    allowed_categories: Optional[List[str]] = None
    blacklisted_products: Optional[List[str]] = None
    recommendation_mode: Optional[str] = None

# Merchant Analytics & Attribution
class RevenueAttributionSummary(BaseModel):
    total_revenue: float
    organic_revenue: float
    ai_assisted_revenue: float
    upsell_revenue: float
    cross_sell_revenue: float
    ai_revenue_share_pct: float
    aov_overall: float
    aov_ai_assisted: float
    aov_organic: float
    aov_uplift_pct: float
    total_orders: int
    ai_assisted_orders: int
    upsell_acceptance_rate: float
    cart_abandonment_rate: float
    ai_buyer_orders_count: int
    ai_buyer_revenue: float

class RevenueTrendPoint(BaseModel):
    date: str
    total_revenue: float
    ai_revenue: float
    organic_revenue: float
    order_count: int

class CategoryPerformancePoint(BaseModel):
    category: str
    revenue: float
    upsell_count: int
    conversion_rate: float

class FunnelStep(BaseModel):
    step: str
    count: int
    pct: float

# Audit Logs
class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    actor: str
    action: str
    reference_type: Optional[str]
    reference_id: Optional[str]
    decision: Optional[str]
    result: str
    metadata_info: Dict[str, Any] = {}
    order_id: Optional[str]
    payment_id: Optional[str]

# Observability
class AgentMetricsSummary(BaseModel):
    total_sessions: int
    total_tool_calls: int
    avg_latency_ms: float
    success_rate_pct: float
    active_guardrails_triggered: int
    human_escalations_count: int
    tool_distribution: Dict[str, int]

# Support Escalation
class SupportEscalationResponse(BaseModel):
    id: str
    session_id: Optional[str]
    customer_email: Optional[str]
    customer_query: str
    ai_confidence_score: float
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Demo Scenarios
class DemoScenarioRunRequest(BaseModel):
    scenario_id: str  # laptop_coding_upsell, payment_failure_recovery, guardrail_blocking, ai_buyer_autonomous, low_confidence_escalation
