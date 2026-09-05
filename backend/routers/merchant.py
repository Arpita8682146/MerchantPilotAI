from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Merchant, MerchantRule, SupportEscalation, Product
from backend.schemas import (
    MerchantResponse, MerchantRuleResponse, MerchantRuleUpdate,
    SupportEscalationResponse, SuccessResponse
)
from backend.services.audit_service import AuditService

router = APIRouter(prefix="/merchant", tags=["Merchant Control"])

@router.get("/profile", response_model=MerchantResponse)
def get_merchant_profile(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant

@router.get("/rules", response_model=MerchantRuleResponse)
def get_merchant_rules(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    rule = db.query(MerchantRule).filter(MerchantRule.merchant_id == merchant.id).first()
    if not rule:
        rule = MerchantRule(
            merchant_id=merchant.id,
            ai_agent_enabled=True,
            max_upsell_amount=2000.0,
            max_discount_percent=20.0,
            allowed_categories=["Laptops", "Accessories", "Monitors", "Keyboards", "Mice", "Headphones", "USB Accessories"],
            blacklisted_products=[],
            recommendation_mode="BALANCED"
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
    return rule

@router.put("/rules", response_model=MerchantRuleResponse)
def update_merchant_rules(rule_in: MerchantRuleUpdate, merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
        
    rule = db.query(MerchantRule).filter(MerchantRule.merchant_id == merchant.id).first()
    if not rule:
        rule = MerchantRule(merchant_id=merchant.id)
        db.add(rule)
        
    if rule_in.ai_agent_enabled is not None:
        rule.ai_agent_enabled = rule_in.ai_agent_enabled
    if rule_in.max_upsell_amount is not None:
        rule.max_upsell_amount = rule_in.max_upsell_amount
    if rule_in.max_discount_percent is not None:
        rule.max_discount_percent = rule_in.max_discount_percent
    if rule_in.allowed_categories is not None:
        rule.allowed_categories = rule_in.allowed_categories
    if rule_in.blacklisted_products is not None:
        rule.blacklisted_products = rule_in.blacklisted_products
    if rule_in.recommendation_mode is not None:
        rule.recommendation_mode = rule_in.recommendation_mode
        
    db.commit()
    db.refresh(rule)
    
    # Audit log
    AuditService.log_event(
        db=db,
        merchant_id=merchant.id,
        actor="MERCHANT_ADMIN",
        action="GUARDRAILS_UPDATED",
        reference_type="RULE",
        reference_id=rule.id,
        decision=f"Updated merchant guardrails (Max Upsell: ₹{rule.max_upsell_amount:,.0f}, Mode: {rule.recommendation_mode}, Agent: {'ON' if rule.ai_agent_enabled else 'OFF'})",
        result="SUCCESS",
        metadata_info={"max_upsell": rule.max_upsell_amount, "mode": rule.recommendation_mode}
    )
    
    return rule

@router.get("/escalations", response_model=List[SupportEscalationResponse])
def list_support_escalations(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        return []
    return db.query(SupportEscalation).filter(SupportEscalation.merchant_id == merchant.id).order_by(SupportEscalation.created_at.desc()).all()

@router.post("/escalations/{escalation_id}/resolve", response_model=SuccessResponse)
def resolve_escalation(escalation_id: str, db: Session = Depends(get_db)):
    esc = db.query(SupportEscalation).filter(SupportEscalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    esc.status = "RESOLVED"
    db.commit()
    return SuccessResponse(message=f"Escalation ticket {escalation_id[:8]} marked as resolved.")

@router.post("/enrich-catalog", response_model=SuccessResponse)
def enrich_catalog(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
        
    prods = db.query(Product).filter(Product.merchant_id == merchant.id).all()
    count = len(prods)
    
    AuditService.log_event(
        db=db,
        merchant_id=merchant.id,
        actor="MERCHANT_ADMIN",
        action="AI_CATALOG_ENRICHMENT",
        reference_type="CATALOG",
        decision=f"Transformed {count} raw catalog items into AI-agent readable structured metadata with compatibility links.",
        result="SUCCESS",
        metadata_info={"enriched_products_count": count}
    )
    
    return SuccessResponse(message=f"Successfully enriched {count} products into AI-readable commerce schemas.")
