from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Cart, CartItem, Product, Merchant, MerchantRule
from backend.schemas import CartResponse, CartItemResponse, CartItemAddRequest, AIRecommendationCard
from backend.services.recommendation_service import RecommendationEngine
from backend.services.audit_service import AuditService

router = APIRouter(prefix="/cart", tags=["Cart"])

def calculate_cart_totals(db: Session, cart: Cart) -> CartResponse:
    items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    
    base_subtotal = 0.0
    upsell_subtotal = 0.0
    total_discount = 0.0
    item_responses: List[CartItemResponse] = []
    product_ids_in_cart = []
    
    for item in items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            continue
            
        product_ids_in_cart.append(prod.id)
        effective_price = prod.price * (1 - (prod.discount_percent or 0.0) / 100.0)
        line_total = round(effective_price * item.quantity, 2)
        
        if item.is_upsell:
            upsell_subtotal += line_total
        else:
            base_subtotal += line_total
            
        total_discount += round((prod.price - effective_price) * item.quantity, 2)
        
        item_responses.append(CartItemResponse(
            id=item.id,
            product_id=prod.id,
            product_name=prod.name,
            sku=prod.sku,
            image_url=prod.image_url,
            category=prod.category,
            unit_price=effective_price,
            quantity=item.quantity,
            line_total=line_total,
            is_upsell=item.is_upsell,
            added_via=item.added_via
        ))
        
    net_subtotal = base_subtotal + upsell_subtotal
    tax_amount = round(net_subtotal * 0.18, 2)  # 18% GST
    total_amount = round(net_subtotal + tax_amount, 2)
    
    orig_aov = base_subtotal
    aov_uplift = round(((upsell_subtotal) / max(1.0, base_subtotal)) * 100, 1) if base_subtotal > 0 else 0.0
    
    cart.base_subtotal = base_subtotal
    cart.upsell_subtotal = upsell_subtotal
    cart.discount_amount = total_discount
    cart.tax_amount = tax_amount
    cart.total_amount = total_amount
    cart.original_aov = orig_aov
    cart.projected_aov = total_amount
    db.commit()
    
    # Calculate available dynamic upsells for items in cart
    available_upsells: List[AIRecommendationCard] = []
    for pid in product_ids_in_cart:
        prod_upsells = RecommendationEngine.get_product_upsells(
            db=db,
            merchant_id=cart.merchant_id,
            base_product_id=pid,
            current_cart_ids=product_ids_in_cart,
            max_results=2
        )
        for u in prod_upsells:
            if not any(x.product.id == u.product.id for x in available_upsells):
                available_upsells.append(u)
                
    return CartResponse(
        id=cart.id,
        session_id=cart.session_id,
        merchant_id=cart.merchant_id,
        items=item_responses,
        item_count=len(item_responses),
        base_subtotal=round(base_subtotal, 2),
        upsell_subtotal=round(upsell_subtotal, 2),
        discount_amount=round(total_discount, 2),
        tax_amount=round(tax_amount, 2),
        total_amount=round(total_amount, 2),
        original_aov=round(orig_aov, 2),
        projected_aov=round(total_amount, 2),
        aov_uplift_percent=aov_uplift,
        ai_added_value=round(upsell_subtotal, 2),
        available_upsells=available_upsells[:3]
    )

@router.get("", response_model=CartResponse)
def get_cart(session_id: str, merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    cart = db.query(Cart).filter(
        Cart.session_id == session_id,
        Cart.merchant_id == merchant.id,
        Cart.status == "ACTIVE"
    ).first()
    
    if not cart:
        cart = Cart(
            merchant_id=merchant.id,
            session_id=session_id,
            status="ACTIVE"
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    return calculate_cart_totals(db, cart)

@router.post("/items", response_model=CartResponse)
def add_cart_item(session_id: str, item_in: CartItemAddRequest, merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    product = db.query(Product).filter(Product.id == item_in.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or inactive")
        
    if product.stock < item_in.quantity:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {product.stock} available.")
        
    cart = db.query(Cart).filter(
        Cart.session_id == session_id,
        Cart.merchant_id == merchant.id,
        Cart.status == "ACTIVE"
    ).first()
    
    if not cart:
        cart = Cart(
            merchant_id=merchant.id,
            session_id=session_id,
            status="ACTIVE"
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product.id
    ).first()
    
    effective_price = product.price * (1 - (product.discount_percent or 0.0) / 100.0)
    
    if existing_item:
        existing_item.quantity += item_in.quantity
        if item_in.is_upsell:
            existing_item.is_upsell = True
            existing_item.added_via = item_in.added_via or "AI_RECOMMENDATION"
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=item_in.quantity,
            unit_price=effective_price,
            is_upsell=item_in.is_upsell,
            recommendation_id=item_in.recommendation_id,
            added_via=item_in.added_via
        )
        db.add(cart_item)
        
    db.commit()
    
    # Audit log
    AuditService.log_event(
        db=db,
        merchant_id=merchant.id,
        actor="CUSTOMER" if item_in.added_via == "ORGANIC" else ("AI_BUYER" if item_in.added_via == "AI_BUYER" else "CUSTOMER_APPROVED_AI_UPSELL"),
        action="ADD_TO_CART",
        reference_type="PRODUCT",
        reference_id=product.id,
        decision=f"Added {item_in.quantity}x {product.name} ({'AI Upsell' if item_in.is_upsell else 'Direct Add'})",
        result="SUCCESS",
        metadata_info={"cart_id": cart.id, "product_name": product.name, "is_upsell": item_in.is_upsell, "added_via": item_in.added_via}
    )
    
    return calculate_cart_totals(db, cart)

@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_cart_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
        
    cart = db.query(Cart).filter(Cart.id == item.cart_id).first()
    db.delete(item)
    db.commit()
    
    if cart:
        AuditService.log_event(
            db=db,
            merchant_id=cart.merchant_id,
            actor="CUSTOMER",
            action="REMOVE_FROM_CART",
            reference_type="CART_ITEM",
            reference_id=item_id,
            decision="Removed item from cart",
            result="SUCCESS",
            metadata_info={"cart_id": cart.id}
        )
        return calculate_cart_totals(db, cart)
    raise HTTPException(status_code=404, detail="Cart not found")
