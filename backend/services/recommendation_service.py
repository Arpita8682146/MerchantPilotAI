from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from backend.models import Product, ProductRelation, MerchantRule, Cart, CartItem
from backend.schemas import AIRecommendationCard, WhyRecommendedFactor, ProductResponse
from backend.services.audit_service import AuditService

class RecommendationEngine:
    @staticmethod
    def calculate_recommendation_score(
        product: Product,
        intent_keywords: List[str],
        max_budget: Optional[float] = None,
        source_product_ids: Optional[List[str]] = None,
        relations_map: Optional[Dict[str, List[ProductRelation]]] = None,
        mode: str = "BALANCED"
    ) -> Tuple[float, List[WhyRecommendedFactor], str]:
        factors: List[WhyRecommendedFactor] = []
        
        # 1. Intent Match (Weight: 0.30)
        matched_tags = 0
        searchable_text = f"{product.name} {product.description} {product.category} {' '.join(product.use_cases or [])} {' '.join(product.tags or [])}".lower()
        if intent_keywords:
            for kw in intent_keywords:
                if kw.lower() in searchable_text:
                    matched_tags += 1
            intent_ratio = min(1.0, matched_tags / max(1, len(intent_keywords)))
        else:
            intent_ratio = 0.8
        
        intent_passed = intent_ratio >= 0.4
        factors.append(WhyRecommendedFactor(
            factor_name="Intent & Use-Case Fit",
            passed=intent_passed,
            description=f"Matches {product.use_cases[0] if product.use_cases else 'requirements'} and target workflow",
            weight=0.30
        ))
        
        # 2. Compatibility / Relation (Weight: 0.20)
        is_compatible = False
        compat_reason = "Universal compatibility"
        if source_product_ids and relations_map:
            for src_id in source_product_ids:
                if src_id in relations_map:
                    for rel in relations_map[src_id]:
                        if rel.target_product_id == product.id:
                            is_compatible = True
                            compat_reason = rel.reason
                            break
        else:
            is_compatible = True
            
        factors.append(WhyRecommendedFactor(
            factor_name="Hardware & Ecosystem Compatibility",
            passed=is_compatible,
            description=compat_reason if is_compatible else "Standard accessory compatibility",
            weight=0.20
        ))
        
        # 3. Budget Fit (Weight: 0.15)
        effective_price = product.price * (1 - (product.discount_percent or 0.0) / 100.0)
        budget_ratio = 1.0
        if max_budget and max_budget > 0:
            if effective_price <= max_budget:
                budget_ratio = 1.0
                budget_passed = True
                budget_desc = f"₹{effective_price:,.0f} is within budget of ₹{max_budget:,.0f}"
            elif effective_price <= max_budget * 1.1:
                budget_ratio = 0.7
                budget_passed = True
                budget_desc = f"₹{effective_price:,.0f} slightly stretches budget for significantly better specs"
            else:
                budget_ratio = 0.2
                budget_passed = False
                budget_desc = f"Exceeds target budget of ₹{max_budget:,.0f}"
        else:
            budget_passed = True
            budget_desc = f"Competitively priced at ₹{effective_price:,.0f}"
            
        factors.append(WhyRecommendedFactor(
            factor_name="Budget & Pricing Fit",
            passed=budget_passed,
            description=budget_desc,
            weight=0.15
        ))
        
        # 4. Popularity & Rating (Weight: 0.15)
        pop_score = (product.popularity_score or 0.8) * ((product.rating or 4.5) / 5.0)
        pop_passed = (product.rating or 4.5) >= 4.0
        factors.append(WhyRecommendedFactor(
            factor_name="Community Rating & Popularity",
            passed=pop_passed,
            description=f"Rated {product.rating}★ with high verified customer satisfaction",
            weight=0.15
        ))
        
        # 5. Purchase Affinity / Frequently Bought (Weight: 0.10)
        affinity_score = 0.9 if is_compatible else 0.6
        factors.append(WhyRecommendedFactor(
            factor_name="Purchase Affinity",
            passed=affinity_score > 0.7,
            description="Frequently purchased together by tech professionals and students",
            weight=0.10
        ))
        
        # 6. Inventory & Merchant Margin (Weight: 0.10)
        stock_passed = (product.stock or 0) > 5
        factors.append(WhyRecommendedFactor(
            factor_name="Stock & Availability",
            passed=stock_passed,
            description=f"In Stock ({product.stock} units available) with {product.return_policy}",
            weight=0.10
        ))
        
        # Mode adjustments
        w_intent, w_compat, w_budget, w_pop, w_aff, w_margin = 0.30, 0.20, 0.15, 0.15, 0.10, 0.10
        if mode == "CONSERVATIVE":
            w_budget = 0.25
            w_intent = 0.35
            w_compat = 0.20
            w_pop = 0.10
            w_aff = 0.05
            w_margin = 0.05
        elif mode == "AGGRESSIVE":
            w_aff = 0.20
            w_margin = 0.15
            w_pop = 0.20
            w_intent = 0.25
            w_compat = 0.10
            w_budget = 0.10
            
        total_score = (
            (intent_ratio * w_intent) +
            ((1.0 if is_compatible else 0.5) * w_compat) +
            (budget_ratio * w_budget) +
            (pop_score * w_pop) +
            (affinity_score * w_aff) +
            (min(1.0, (product.merchant_margin or 0.25) * 3) * w_margin)
        )
        
        # Headline reason
        if is_compatible and source_product_ids:
            headline = f"Highly compatible with your chosen system ({compat_reason})"
        elif intent_keywords:
            headline = f"Engineered for {product.use_cases[0] if product.use_cases else 'productivity'} with top-tier performance per rupee"
        else:
            headline = f"Top-rated {product.category.lower()} offering superior reliability"
            
        return round(total_score, 2), factors, headline

    @staticmethod
    def get_product_upsells(
        db: Session,
        merchant_id: str,
        base_product_id: str,
        current_cart_ids: Optional[List[str]] = None,
        max_results: int = 3
    ) -> List[AIRecommendationCard]:
        rule = db.query(MerchantRule).filter(MerchantRule.merchant_id == merchant_id).first()
        max_upsell_limit = rule.max_upsell_amount if rule else 2000.0
        blacklisted = set(rule.blacklisted_products or []) if rule else set()
        mode = rule.recommendation_mode if rule else "BALANCED"
        
        current_cart_ids = current_cart_ids or []
        
        relations = db.query(ProductRelation).filter(
            ProductRelation.source_product_id == base_product_id,
            ProductRelation.relation_type.in_(["COMPATIBLE", "COMPLEMENTARY", "UPGRADE"])
        ).order_by(ProductRelation.relevance_score.desc()).all()
        
        recommendations: List[AIRecommendationCard] = []
        relations_map = {base_product_id: relations}
        
        base_product = db.query(Product).filter(Product.id == base_product_id).first()
        
        for rel in relations:
            target_prod = db.query(Product).filter(
                Product.id == rel.target_product_id,
                Product.is_active == True,
                Product.stock > 0
            ).first()
            
            if not target_prod or target_prod.id in current_cart_ids or target_prod.id in blacklisted:
                continue
                
            effective_price = target_prod.price * (1 - (target_prod.discount_percent or 0.0) / 100.0)
            
            # Merchant Guardrail Check
            if effective_price > max_upsell_limit:
                # Log bounded autonomy guardrail block
                AuditService.log_event(
                    db=db,
                    merchant_id=merchant_id,
                    actor="AI_AGENT",
                    action="GUARDRAIL_ENFORCED",
                    reference_type="PRODUCT",
                    reference_id=target_prod.id,
                    decision=f"Blocked upsell for {target_prod.name} (₹{effective_price:,.0f}) exceeding merchant max cap ₹{max_upsell_limit:,.0f}",
                    result="BLOCKED_BY_GUARDRAIL",
                    metadata_info={"product_id": target_prod.id, "price": effective_price, "max_upsell_limit": max_upsell_limit}
                )
                continue
                
            score, factors, headline = RecommendationEngine.calculate_recommendation_score(
                product=target_prod,
                intent_keywords=base_product.use_cases if base_product else [],
                source_product_ids=[base_product_id],
                relations_map=relations_map,
                mode=mode
            )
            
            # Format product response
            prod_resp = ProductResponse(
                id=target_prod.id,
                merchant_id=target_prod.merchant_id,
                sku=target_prod.sku,
                name=target_prod.name,
                description=target_prod.description,
                category=target_prod.category,
                price=target_prod.price,
                discount_percent=target_prod.discount_percent or 0.0,
                discounted_price=effective_price,
                stock=target_prod.stock,
                specifications=target_prod.specifications or {},
                use_cases=target_prod.use_cases or [],
                target_customer=target_prod.target_customer,
                tags=target_prod.tags or [],
                popularity_score=target_prod.popularity_score or 0.8,
                rating=target_prod.rating or 4.5,
                merchant_margin=target_prod.merchant_margin or 0.25,
                return_policy=target_prod.return_policy or "7-day replacement",
                image_url=target_prod.image_url,
                is_active=target_prod.is_active
            )
            
            recommendations.append(AIRecommendationCard(
                product=prod_resp,
                recommendation_type="UPSELL" if rel.relation_type == "UPGRADE" else "CROSS_SELL",
                confidence_score=round(score, 2),
                headline_reason=f"Recommended for {base_product.name if base_product else 'your order'}: {rel.reason}",
                factors=factors,
                estimated_aov_impact=effective_price
            ))
            
            if len(recommendations) >= max_results:
                break
                
        return recommendations
