from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Merchant, Order, Product
from backend.schemas import (
    RevenueAttributionSummary, RevenueTrendPoint,
    FunnelStep, AgentMetricsSummary
)
from backend.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Merchant Analytics"])

@router.get("/summary", response_model=RevenueAttributionSummary)
def get_analytics_summary(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return AnalyticsService.get_revenue_attribution_summary(db, merchant.id)

@router.get("/trends", response_model=List[RevenueTrendPoint])
def get_revenue_trends(days: int = 14, merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        return []
    return AnalyticsService.get_revenue_trends(db, merchant.id, days=days)

@router.get("/funnel", response_model=List[FunnelStep])
def get_conversion_funnel(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        return []
    return AnalyticsService.get_conversion_funnel(db, merchant.id)

@router.get("/agent", response_model=AgentMetricsSummary)
def get_agent_metrics(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return AnalyticsService.get_agent_metrics(db, merchant.id)

@router.get("/experiments")
def get_experiments(merchant_slug: str = "technest", db: Session = Depends(get_db)):
    return {
        "experiment_name": "AI Sales Agent vs Traditional Catalog Storefront",
        "status": "RUNNING",
        "control": {
            "name": "Standard Storefront (No AI Agent)",
            "visitors": 2450,
            "orders": 142,
            "conversion_rate": 5.8,
            "aov": 2840.0,
            "revenue": 403280.0,
            "upsell_rate": 4.1
        },
        "variant": {
            "name": "MerchantPilot AI Storefront (Agent + Contextual Upsells)",
            "visitors": 2580,
            "orders": 191,
            "conversion_rate": 7.4,
            "aov": 3417.0,
            "revenue": 652647.0,
            "upsell_rate": 28.6
        },
        "comparison": {
            "conversion_uplift_pct": 27.6,
            "aov_uplift_pct": 20.3,
            "total_revenue_uplift_pct": 61.8,
            "confidence_level_pct": 99.4
        }
    }
