import os
import sys
import random
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import engine, Base, SessionLocal
from backend.models import (
    Merchant, Product, ProductRelation, Customer, CustomerPreference,
    Cart, CartItem, Order, OrderItem, Payment, PaymentAttempt,
    AISession, AIMessage, AIRecommendation, MerchantRule, AuditLog,
    Experiment, ExperimentEvent, SupportEscalation
)
from backend.seed_data import PRODUCTS_DATA, PRODUCT_RELATIONS_DATA, CUSTOMERS_DATA

def seed_database():
    print('Re-creating all database tables...')
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print('Creating Merchant TechNest...')
        merchant = Merchant(
            id=str(uuid.uuid4()),
            name='TechNest Electronics & Dev Hardware',
            slug='technest',
            category='Electronics & Developer Hardware',
            currency='INR',
            description='Official AI-native flagship store for high-performance laptops, mechanical peripherals, developer workstations, and tech accessories.'
        )
        db.add(merchant)
        db.commit()
        db.refresh(merchant)
        
        rule = MerchantRule(
            merchant_id=merchant.id,
            ai_agent_enabled=True,
            max_upsell_amount=2000.0,
            max_discount_percent=20.0,
            allowed_categories=['Laptops', 'Accessories', 'Monitors', 'Keyboards', 'Mice', 'Headphones', 'USB Accessories'],
            blacklisted_products=[],
            recommendation_mode='BALANCED'
        )
        db.add(rule)
        
        prod_map = {}
        for p_data in PRODUCTS_DATA:
            prod = Product(
                merchant_id=merchant.id,
                sku=p_data['sku'],
                name=p_data['name'],
                description=p_data['description'],
                category=p_data['category'],
                price=p_data['price'],
                discount_percent=p_data['discount_percent'],
                stock=p_data['stock'],
                specifications=p_data['specifications'],
                use_cases=p_data['use_cases'],
                target_customer=p_data['target_customer'],
                tags=p_data['tags'],
                popularity_score=p_data['popularity_score'],
                rating=p_data['rating'],
                merchant_margin=p_data['merchant_margin'],
                return_policy=p_data['return_policy'],
                image_url=p_data['image_url'],
                is_active=True
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
            prod_map[p_data['sku']] = prod
            
        print(f'Created {len(prod_map)} products in database.')
        
        for src_sku, tgt_sku, rel_type, rel_score, reason in PRODUCT_RELATIONS_DATA:
            if src_sku in prod_map and tgt_sku in prod_map:
                rel = ProductRelation(
                    source_product_id=prod_map[src_sku].id,
                    target_product_id=prod_map[tgt_sku].id,
                    relation_type=rel_type,
                    relevance_score=rel_score,
                    reason=reason
                )
                db.add(rel)
        db.commit()
        print(f'Created {len(PRODUCT_RELATIONS_DATA)} product relations in database.')
        
        customers = []
        for c_data in CUSTOMERS_DATA:
            cust = Customer(
                merchant_id=merchant.id,
                name=c_data['name'],
                email=c_data['email'],
                persona_type=c_data['persona_type'],
                budget_limit=c_data['budget_limit'],
                price_sensitivity=c_data['price_sensitivity']
            )
            db.add(cust)
            db.commit()
            db.refresh(cust)
            customers.append(cust)
            
        print(f'Created {len(customers)} customers.')
        
        print('Generating historical orders and financial revenue attribution...')
        now = datetime.now(timezone.utc)
        
        total_organic_rev = 0.0
        total_ai_rev = 0.0
        total_upsell_rev = 0.0
        
        order_count = 115
        for i in range(order_count):
            cust = random.choice(customers)
            days_ago = random.randint(1, 28)
            order_time = now - timedelta(days=days_ago, hours=random.randint(1, 12), minutes=random.randint(1, 59))
            
            is_ai_assisted = random.random() < 0.38
            has_upsell = is_ai_assisted and (random.random() < 0.65)
            
            if random.random() < 0.70:
                primary_prod = random.choice([prod_map['LAP-ASUS-VIVO16'], prod_map['LAP-LENOVO-THINK14'], prod_map['LAP-ACER-NITRO-V'], prod_map['LAP-DELL-INSP15']])
            else:
                primary_prod = random.choice([prod_map['KB-KEYCHRON-K2'], prod_map['MON-LG-27-4K'], prod_map['MON-ACER-24-100HZ'], prod_map['AUD-SONY-XM5']])
                
            p1_eff = primary_prod.price * (1 - (primary_prod.discount_percent or 0.0) / 100.0)
            
            upsell_prod = None
            if has_upsell:
                upsell_prod = random.choice([
                    prod_map['ACC-SLEEVE-16'], prod_map['MOU-LOGI-PEBBLE'],
                    prod_map['ACC-HUB-7IN1'], prod_map['ACC-COOLING-STAND']
                ])
                
            p2_eff = (upsell_prod.price * (1 - (upsell_prod.discount_percent or 0.0) / 100.0)) if upsell_prod else 0.0
            
            net_subtotal = p1_eff + p2_eff
            tax = round(net_subtotal * 0.18, 2)
            total = round(net_subtotal + tax, 2)
            
            org_rev = 0.0 if is_ai_assisted else round(p1_eff + tax, 2)
            ai_assisted_rev = round(total, 2) if is_ai_assisted else 0.0
            upsell_rev_amt = round(p2_eff * 1.18, 2) if has_upsell else 0.0
            
            total_organic_rev += org_rev
            total_ai_rev += ai_assisted_rev
            total_upsell_rev += upsell_rev_amt
            
            order = Order(
                merchant_id=merchant.id,
                customer_id=cust.id,
                order_number=f'ORD-2026-{1000 + i}',
                status='PAID',
                subtotal=net_subtotal,
                discount_amount=round((primary_prod.price - p1_eff) + ((upsell_prod.price - p2_eff) if upsell_prod else 0), 2),
                tax_amount=tax,
                total_amount=total,
                organic_revenue=org_rev,
                ai_assisted_revenue=ai_assisted_rev,
                upsell_revenue=upsell_rev_amt,
                cross_sell_revenue=round(p1_eff * 1.18, 2) if is_ai_assisted else 0.0,
                final_revenue=total,
                customer_name=cust.name,
                customer_email=cust.email,
                customer_phone='9876543210',
                shipping_address=f'Flat {101 + i}, Prestige Tech Park, Marathahalli, Bengaluru, KA 560087',
                created_at=order_time
            )
            db.add(order)
            db.commit()
            db.refresh(order)
            
            oi1 = OrderItem(
                order_id=order.id,
                product_id=primary_prod.id,
                product_name=primary_prod.name,
                sku=primary_prod.sku,
                unit_price=p1_eff,
                quantity=1,
                is_upsell=False,
                added_via='AI_RECOMMENDATION' if is_ai_assisted else 'ORGANIC',
                line_total=p1_eff
            )
            db.add(oi1)
            
            if upsell_prod:
                oi2 = OrderItem(
                    order_id=order.id,
                    product_id=upsell_prod.id,
                    product_name=upsell_prod.name,
                    sku=upsell_prod.sku,
                    unit_price=p2_eff,
                    quantity=1,
                    is_upsell=True,
                    added_via='AI_RECOMMENDATION',
                    line_total=p2_eff
                )
                db.add(oi2)
                
            payment = Payment(
                order_id=order.id,
                razorpay_order_id=f'order_rzp_{uuid.uuid4().hex[:12]}',
                razorpay_payment_id=f'pay_rzp_{uuid.uuid4().hex[:12]}',
                razorpay_signature=f'sig_{uuid.uuid4().hex[:16]}',
                amount=total,
                currency='INR',
                status='SUCCESS',
                created_at=order_time,
                verified_at=order_time + timedelta(seconds=random.randint(15, 60))
            )
            db.add(payment)
            
        db.commit()
        print(f'Generated {order_count} historical orders. Total Revenue: INR {(total_organic_rev + total_ai_rev):,.2f}')
        
        audit_events = [
            ('AI_AGENT', 'PRODUCT_RECOMMENDATION', 'PRODUCT', prod_map['LAP-ASUS-VIVO16'].id, 'Recommended ASUS Vivobook 16X for CSE Coding intent', 'SUCCESS'),
            ('CUSTOMER', 'ADD_TO_CART', 'PRODUCT', prod_map['ACC-SLEEVE-16'].id, 'Added recommended ArmorShield Sleeve (INR 999) to cart', 'SUCCESS'),
            ('SYSTEM', 'PAYMENT_ORDER_CREATED', 'PAYMENT', 'order_rzp_demo123', 'Created Razorpay test order INR 65,998', 'SUCCESS'),
            ('RAZORPAY', 'PAYMENT_SUCCESS', 'PAYMENT', 'pay_rzp_demo456', 'Server-side HMAC verification confirmed INR 65,998 captured', 'SUCCESS'),
            ('AI_AGENT', 'GUARDRAIL_ENFORCED', 'PRODUCT', prod_map['KB-KEYCHRON-K2'].id, 'Blocked upsell exceeding merchant limit INR 2,000', 'BLOCKED_BY_GUARDRAIL'),
            ('AI_BUYER', 'PROTOCOL_SEARCH', 'CATALOG', 'CAT-001', 'Autonomous AI buyer agent queried /api/ai/search', 'SUCCESS'),
            ('RAZORPAY', 'PAYMENT_FAILED', 'PAYMENT', 'order_rzp_fail_demo', 'Payment declined: Card limit exceeded', 'FAILED'),
            ('AI_AGENT', 'PAYMENT_RECOVERY_OFFERED', 'CART', 'cart_demo_recovery', 'Preserved customer cart and offered 1-click retry modal', 'SUCCESS')
        ]
        
        for actor, action, ref_type, ref_id, decision, res in audit_events:
            entry = AuditLog(
                merchant_id=merchant.id,
                actor=actor,
                action=action,
                reference_type=ref_type,
                reference_id=ref_id,
                decision=decision,
                result=res,
                metadata_info={'source': 'seed_initialization'},
                timestamp=now - timedelta(minutes=random.randint(5, 120))
            )
            db.add(entry)
            
        esc = SupportEscalation(
            merchant_id=merchant.id,
            customer_email='student.buyer@college.edu',
            customer_query='I have an old trade-in laptop from 2018 with a damaged motherboard. Can I get immediate creditINR ',
            ai_confidence_score=0.25,
            reason='Trade-in policy evaluation requires merchant human appraisal.',
            status='OPEN',
            created_at=now - timedelta(hours=2)
        )
        db.add(esc)
        
        db.commit()
        print('Database seeded successfully with complete TechNest ecosystem!')
        
    finally:
        db.close()

if __name__ == '__main__':
    seed_database()
