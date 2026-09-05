from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Merchant(Base):
    __tablename__ = "merchants"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(100), default="Electronics & Tech")
    currency = Column(String(10), default="INR")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    
    products = relationship("Product", back_populates="merchant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="merchant", cascade="all, delete-orphan")
    carts = relationship("Cart", back_populates="merchant", cascade="all, delete-orphan")
    rules = relationship("MerchantRule", back_populates="merchant", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="merchant", cascade="all, delete-orphan")
    escalations = relationship("SupportEscalation", back_populates="merchant", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    discount_percent = Column(Float, default=0.0)
    stock = Column(Integer, default=50)
    
    specifications = Column(JSON, default=dict)
    use_cases = Column(JSON, default=list)
    target_customer = Column(String(255), nullable=True)
    tags = Column(JSON, default=list)
    popularity_score = Column(Float, default=0.8)
    rating = Column(Float, default=4.5)
    merchant_margin = Column(Float, default=0.25)
    return_policy = Column(String(255), default="7-day replacement")
    image_url = Column(String(500), nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    
    merchant = relationship("Merchant", back_populates="products")
    relations_from = relationship("ProductRelation", foreign_keys="ProductRelation.source_product_id", back_populates="source_product", cascade="all, delete-orphan")
    relations_to = relationship("ProductRelation", foreign_keys="ProductRelation.target_product_id", back_populates="target_product", cascade="all, delete-orphan")


class ProductRelation(Base):
    __tablename__ = "product_relations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    target_product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    relation_type = Column(String(50), nullable=False, index=True)  # COMPATIBLE, COMPLEMENTARY, ALTERNATIVE, PREMIUM_ALTERNATIVE, BUDGET_ALTERNATIVE, UPGRADE
    relevance_score = Column(Float, default=0.85)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
    
    source_product = relationship("Product", foreign_keys=[source_product_id], back_populates="relations_from")
    target_product = relationship("Product", foreign_keys=[target_product_id], back_populates="relations_to")


class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    persona_type = Column(String(100), default="general")  # student, developer, gamer, designer, office_worker
    budget_limit = Column(Float, nullable=True)
    price_sensitivity = Column(String(50), default="moderate")  # low, moderate, high
    created_at = Column(DateTime, default=get_utc_now)
    
    orders = relationship("Order", back_populates="customer")
    carts = relationship("Cart", back_populates="customer")


class Cart(Base):
    __tablename__ = "carts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    session_id = Column(String(100), index=True, nullable=False)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, CHECKED_OUT, ABANDONED
    
    base_subtotal = Column(Float, default=0.0)
    upsell_subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    original_aov = Column(Float, default=0.0)
    projected_aov = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    merchant = relationship("Merchant", back_populates="carts")
    customer = relationship("Customer", back_populates="carts")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    cart_id = Column(String(36), ForeignKey("carts.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    is_upsell = Column(Boolean, default=False)
    recommendation_id = Column(String(36), nullable=True)
    added_via = Column(String(50), default="ORGANIC")  # ORGANIC, AI_RECOMMENDATION, AI_BUYER
    created_at = Column(DateTime, default=get_utc_now)
    
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    cart_id = Column(String(36), ForeignKey("carts.id"), nullable=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, PAID, FAILED, CANCELLED, REFUNDED
    
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    
    # Financial Attribution
    organic_revenue = Column(Float, default=0.0)
    ai_assisted_revenue = Column(Float, default=0.0)
    upsell_revenue = Column(Float, default=0.0)
    cross_sell_revenue = Column(Float, default=0.0)
    final_revenue = Column(Float, default=0.0)
    
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    shipping_address = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now)
    
    merchant = relationship("Merchant", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    sku = Column(String(50), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    is_upsell = Column(Boolean, default=False)
    added_via = Column(String(50), default="ORGANIC")
    line_total = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, unique=True, index=True)
    razorpay_order_id = Column(String(100), index=True, nullable=False)
    razorpay_payment_id = Column(String(100), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="CREATED")  # CREATED, ATTEMPTED, SUCCESS, FAILED, CANCELLED
    
    failure_reason = Column(Text, nullable=True)
    error_code = Column(String(100), nullable=True)
    error_description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now)
    verified_at = Column(DateTime, nullable=True)
    
    order = relationship("Order", back_populates="payment")
    attempts = relationship("PaymentAttempt", back_populates="payment", cascade="all, delete-orphan")


class PaymentAttempt(Base):
    __tablename__ = "payment_attempts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    payment_id = Column(String(36), ForeignKey("payments.id"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    razorpay_order_id = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)  # ATTEMPTED, SUCCESS, FAILED, CANCELLED
    error_code = Column(String(100), nullable=True)
    error_description = Column(Text, nullable=True)
    customer_action = Column(String(100), nullable=True)  # RETRIED, CANCELLED, ABANDONED
    agent_recovery_offered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)
    
    payment = relationship("Payment", back_populates="attempts")


class AISession(Base):
    __tablename__ = "ai_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    session_token = Column(String(100), unique=True, index=True, nullable=False)
    channel = Column(String(50), default="WEB_STORE")  # WEB_STORE, AI_BUYER_API
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    messages = relationship("AIMessage", back_populates="session", cascade="all, delete-orphan")
    recommendations = relationship("AIRecommendation", back_populates="session", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("ai_sessions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant, system, tool
    content = Column(Text, nullable=False)
    tool_calls = Column(JSON, nullable=True)
    tool_results = Column(JSON, nullable=True)
    latency_ms = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=get_utc_now)
    
    session = relationship("AISession", back_populates="messages")


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("ai_sessions.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    recommendation_type = Column(String(50), default="PRIMARY")  # PRIMARY, UPSELL, CROSS_SELL, ALTERNATIVE
    confidence_score = Column(Float, default=0.9)
    factors = Column(JSON, default=dict)  # intent_match, compatibility, budget_fit, popularity, affinity, margin
    explanation_text = Column(Text, nullable=False)
    accepted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)
    
    session = relationship("AISession", back_populates="recommendations")
    product = relationship("Product")


class MerchantRule(Base):
    __tablename__ = "merchant_rules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), unique=True, nullable=False)
    ai_agent_enabled = Column(Boolean, default=True)
    max_upsell_amount = Column(Float, default=2000.0)
    max_discount_percent = Column(Float, default=20.0)
    allowed_categories = Column(JSON, default=list)
    blacklisted_products = Column(JSON, default=list)
    recommendation_mode = Column(String(50), default="BALANCED")  # CONSERVATIVE, BALANCED, AGGRESSIVE
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    merchant = relationship("Merchant", back_populates="rules")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=get_utc_now, index=True)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False, index=True)
    actor = Column(String(50), nullable=False)  # AI_AGENT, CUSTOMER, SYSTEM, RAZORPAY, AI_BUYER, MERCHANT_ADMIN
    action = Column(String(100), nullable=False, index=True)
    reference_type = Column(String(50), nullable=True)  # PRODUCT, CART, PAYMENT, ORDER, RULE
    reference_id = Column(String(100), nullable=True)
    decision = Column(Text, nullable=True)
    result = Column(String(50), default="SUCCESS")  # SUCCESS, FAILED, BLOCKED_BY_GUARDRAIL, WARNING
    metadata_info = Column(JSON, default=dict)
    order_id = Column(String(36), nullable=True, index=True)
    payment_id = Column(String(36), nullable=True, index=True)
    
    merchant = relationship("Merchant", back_populates="audit_logs")


class Experiment(Base):
    __tablename__ = "experiments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="RUNNING")  # RUNNING, PAUSED, COMPLETED
    control_name = Column(String(100), default="Control (Standard Catalog)")
    variant_name = Column(String(100), default="Variant (AI Agent & Upsell Engine)")
    control_traffic_pct = Column(Integer, default=50)
    created_at = Column(DateTime, default=get_utc_now)
    
    events = relationship("ExperimentEvent", back_populates="experiment", cascade="all, delete-orphan")


class ExperimentEvent(Base):
    __tablename__ = "experiment_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id"), nullable=False, index=True)
    variant = Column(String(20), nullable=False)  # CONTROL, VARIANT
    event_type = Column(String(50), nullable=False)  # PAGE_VIEW, AI_ENGAGEMENT, ADD_TO_CART, CHECKOUT_START, ORDER_COMPLETE
    order_id = Column(String(36), nullable=True)
    revenue = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)
    
    experiment = relationship("Experiment", back_populates="events")


class SupportEscalation(Base):
    __tablename__ = "support_escalations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False, index=True)
    session_id = Column(String(36), nullable=True)
    customer_email = Column(String(255), nullable=True)
    customer_query = Column(Text, nullable=False)
    ai_confidence_score = Column(Float, default=0.3)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN")  # OPEN, RESOLVED
    created_at = Column(DateTime, default=get_utc_now)
    
    merchant = relationship("Merchant", back_populates="escalations")
class CustomerPreference(Base):
    __tablename__ = 'customer_preferences'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey('customers.id'), nullable=False, index=True)
    pref_key = Column(String(100), nullable=False)
    pref_value = Column(String(255), nullable=False)
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=get_utc_now)
