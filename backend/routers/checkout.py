import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Cart, CartItem, Product, Order, OrderItem, Merchant
from backend.schemas import CheckoutCreateOrderRequest, RazorpayOrderResponse, OrderResponse, OrderItemResponse
from backend.services.payment_service import PaymentService
from backend.services.audit_service import AuditService

router = APIRouter(prefix="/checkout", tags=["Checkout"])

@router.post("/create-order", response_model=RazorpayOrderResponse)
def create_checkout_order(req: CheckoutCreateOrderRequest, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.id == req.cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")
        
    merchant = db.query(Merchant).filter(Merchant.id == cart.merchant_id).first()
    merchant_name = merchant.name if merchant else "TechNest Store"
    
    # Calculate order breakdown
    order_num = f"ORD-2026-{uuid.uuid4().hex[:8].upper()}"
    base_subtotal = 0.0
    upsell_subtotal = 0.0
    organic_revenue = 0.0
    ai_assisted_revenue = 0.0
    upsell_revenue = 0.0
    cross_sell_revenue = 0.0
    total_discount = 0.0
    
    order_items_to_add = []
    
    for item in items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            continue
            
        if prod.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Item {prod.name} has only {prod.stock} left in stock.")
            
        effective_price = prod.price * (1 - (prod.discount_percent or 0.0) / 100.0)
        line_total = round(effective_price * item.quantity, 2)
        
        if item.is_upsell or item.added_via in ["AI_RECOMMENDATION", "AI_BUYER"]:
            ai_assisted_revenue += line_total
            if item.is_upsell:
                upsell_revenue += line_total
                upsell_subtotal += line_total
            else:
                cross_sell_revenue += line_total
                base_subtotal += line_total
        else:
            organic_revenue += line_total
            base_subtotal += line_total
            
        total_discount += round((prod.price - effective_price) * item.quantity, 2)
        
        order_items_to_add.append({
            "product_id": prod.id,
            "product_name": prod.name,
            "sku": prod.sku,
            "unit_price": effective_price,
            "quantity": item.quantity,
            "is_upsell": item.is_upsell,
            "added_via": item.added_via,
            "line_total": line_total
        })
        
    net_subtotal = base_subtotal + upsell_subtotal
    tax_amount = round(net_subtotal * 0.18, 2)  # 18% GST
    total_amount = round(net_subtotal + tax_amount, 2)
    
    # Create Order record
    order = Order(
        merchant_id=cart.merchant_id,
        customer_id=cart.customer_id,
        cart_id=cart.id,
        order_number=order_num,
        status="PENDING",
        subtotal=net_subtotal,
        discount_amount=total_discount,
        tax_amount=tax_amount,
        total_amount=total_amount,
        organic_revenue=organic_revenue,
        ai_assisted_revenue=ai_assisted_revenue,
        upsell_revenue=upsell_revenue,
        cross_sell_revenue=cross_sell_revenue,
        final_revenue=total_amount,
        customer_name=req.customer_name,
        customer_email=req.customer_email,
        customer_phone=req.customer_phone,
        shipping_address=req.shipping_address
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Add Order Items
    for oi in order_items_to_add:
        order_item = OrderItem(
            order_id=order.id,
            product_id=oi["product_id"],
            product_name=oi["product_name"],
            sku=oi["sku"],
            unit_price=oi["unit_price"],
            quantity=oi["quantity"],
            is_upsell=oi["is_upsell"],
            added_via=oi["added_via"],
            line_total=oi["line_total"]
        )
        db.add(order_item)
    db.commit()
    
    # Audit log
    AuditService.log_event(
        db=db,
        merchant_id=order.merchant_id,
        actor="CUSTOMER",
        action="CHECKOUT_INITIATED",
        reference_type="ORDER",
        reference_id=order.order_number,
        decision=f"Initiated bounded checkout for order {order.order_number} (Total: ₹{total_amount:,.2f})",
        result="SUCCESS",
        metadata_info={"cart_id": cart.id, "total_amount": total_amount, "upsell_revenue": upsell_revenue},
        order_id=order.id
    )
    
    # Create Razorpay Order
    return PaymentService.create_razorpay_order(db=db, order=order, merchant_name=merchant_name)

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        order = db.query(Order).filter(Order.order_number == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    item_resps = [
        OrderItemResponse(
            id=i.id,
            product_id=i.product_id,
            product_name=i.product_name,
            sku=i.sku,
            unit_price=i.unit_price,
            quantity=i.quantity,
            is_upsell=i.is_upsell,
            added_via=i.added_via,
            line_total=i.line_total
        )
        for i in items
    ]
    
    payment = order.payment
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        status=order.status,
        total_amount=order.total_amount,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        tax_amount=order.tax_amount,
        organic_revenue=order.organic_revenue,
        ai_assisted_revenue=order.ai_assisted_revenue,
        upsell_revenue=order.upsell_revenue,
        cross_sell_revenue=order.cross_sell_revenue,
        final_revenue=order.final_revenue,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        shipping_address=order.shipping_address,
        created_at=order.created_at,
        items=item_resps,
        payment_status=payment.status if payment else None,
        razorpay_order_id=payment.razorpay_order_id if payment else None,
        razorpay_payment_id=payment.razorpay_payment_id if payment else None
    )
