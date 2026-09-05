from typing import List, Dict, Any, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Merchant, Product, ProductRelation, Cart, CartItem, Order, OrderItem
from backend.schemas import (
    AIProtocolCatalogProduct, AIProtocolSearchRequest,
    AIProtocolCartCreateRequest, AIProtocolCheckoutRequest,
    RazorpayOrderResponse, PaymentVerifyRequest, PaymentVerifyResponse
)
from backend.services.catalog_service import CatalogService
from backend.services.payment_service import PaymentService
from backend.services.audit_service import AuditService

router = APIRouter(prefix="/ai-protocol", tags=["AI Commerce Protocol Layer"])

@router.get("/catalog", response_model=List[AIProtocolCatalogProduct])
def get_ai_catalog(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        return []
        
    products = db.query(Product).filter(Product.merchant_id == merchant.id, Product.is_active == True).all()
    return [CatalogService.to_protocol_schema(db, p) for p in products]

@router.post("/search", response_model=List[AIProtocolCatalogProduct])
def search_ai_catalog(req: AIProtocolSearchRequest, merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        return []
        
    products = CatalogService.get_products(
        db=db,
        merchant_id=merchant.id,
        category=req.category,
        query=req.query,
        max_price=req.max_price,
        limit=req.limit
    )
    
    # Audit log
    AuditService.log_event(
        db=db,
        merchant_id=merchant.id,
        actor="AI_BUYER",
        action="PROTOCOL_SEARCH",
        reference_type="CATALOG",
        decision=f"AI Buyer searched protocol with query: '{req.query}'",
        result="SUCCESS",
        metadata_info={"query": req.query, "category": req.category, "results_count": len(products)}
    )
    
    return [CatalogService.to_protocol_schema(db, p) for p in products]

@router.get("/products/{product_id}", response_model=AIProtocolCatalogProduct)
def get_protocol_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in AI protocol catalog")
    return CatalogService.to_protocol_schema(db, product)

@router.post("/cart")
def create_ai_cart(req: AIProtocolCartCreateRequest, merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
        
    session_id = f"ai_buyer_{req.buyer_agent_id}_{uuid.uuid4().hex[:6]}"
    cart = Cart(
        merchant_id=merchant.id,
        session_id=session_id,
        status="ACTIVE"
    )
    db.add(cart)
    db.commit()
    db.refresh(cart)
    
    added_items = []
    total_val = 0.0
    for item in req.items:
        p_id = item.get("product_id")
        qty = item.get("quantity", 1)
        p = db.query(Product).filter(Product.id == p_id).first()
        if p:
            eff_price = p.price * (1 - (p.discount_percent or 0.0) / 100.0)
            c_item = CartItem(
                cart_id=cart.id,
                product_id=p.id,
                quantity=qty,
                unit_price=eff_price,
                is_upsell=item.get("is_upsell", False),
                added_via="AI_BUYER"
            )
            db.add(c_item)
            total_val += (eff_price * qty)
            added_items.append({"product_id": p.id, "name": p.name, "quantity": qty, "price": eff_price})
            
    cart.base_subtotal = total_val
    cart.total_amount = round(total_val * 1.18, 2)
    db.commit()
    
    AuditService.log_event(
        db=db,
        merchant_id=merchant.id,
        actor="AI_BUYER",
        action="PROTOCOL_CART_CREATED",
        reference_type="CART",
        reference_id=cart.id,
        decision=f"AI Buyer Agent ({req.buyer_agent_id}) initialized programmatic cart with {len(added_items)} items.",
        result="SUCCESS",
        metadata_info={"buyer_agent_id": req.buyer_agent_id, "items": added_items, "total": cart.total_amount}
    )
    
    return {
        "cart_id": cart.id,
        "session_id": cart.session_id,
        "buyer_agent_id": req.buyer_agent_id,
        "items": added_items,
        "total_amount": cart.total_amount,
        "currency": "INR",
        "status": "ready_for_checkout"
    }

@router.post("/checkout")
def ai_checkout(req: AIProtocolCheckoutRequest, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.id == req.cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="Cart has no items")
        
    order_num = f"ORD-AIBUYER-{uuid.uuid4().hex[:6].upper()}"
    
    order = Order(
        merchant_id=cart.merchant_id,
        cart_id=cart.id,
        order_number=order_num,
        status="PENDING",
        subtotal=cart.base_subtotal,
        discount_amount=0.0,
        tax_amount=round(cart.base_subtotal * 0.18, 2),
        total_amount=cart.total_amount,
        organic_revenue=0.0,
        ai_assisted_revenue=cart.total_amount,
        upsell_revenue=cart.upsell_subtotal,
        cross_sell_revenue=cart.base_subtotal,
        final_revenue=cart.total_amount,
        customer_name=f"AI Buyer Agent ({req.buyer_agent_id})",
        customer_email=f"{req.buyer_agent_id}@autonomous-agent.net",
        shipping_address=req.shipping_info.get("address", "AI Agent Automated Warehouse Locker #42, Bangalore")
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    for item in items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        oi = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=prod.name if prod else "Product",
            sku=prod.sku if prod else "SKU",
            unit_price=item.unit_price,
            quantity=item.quantity,
            is_upsell=item.is_upsell,
            added_via="AI_BUYER",
            line_total=round(item.unit_price * item.quantity, 2)
        )
        db.add(oi)
    db.commit()
    
    rzp_resp = PaymentService.create_razorpay_order(db=db, order=order, merchant_name="TechNest Autonomous AI Store")
    
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "razorpay_order_id": rzp_resp.razorpay_order_id,
        "amount_paise": rzp_resp.amount,
        "currency": "INR",
        "key_id": rzp_resp.key_id,
        "status": "payment_required"
    }
