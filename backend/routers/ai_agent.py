from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Merchant
from backend.schemas import ChatMessageRequest, ChatMessageResponse, AIRecommendationCard
from backend.services.agent_service import AIAgentService
from backend.services.recommendation_service import RecommendationEngine

router = APIRouter(prefix="/ai", tags=["AI Sales Agent"])

@router.post("/chat", response_model=ChatMessageResponse)
def chat_with_sales_agent(
    req: ChatMessageRequest,
    merchant_slug: str = "technest",
    db: Session = Depends(get_db)
):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    return AIAgentService.process_message(
        db=db,
        merchant_id=merchant.id,
        message_text=req.message,
        session_id=req.session_id,
        customer_persona=req.customer_persona or "student",
        current_cart_product_ids=req.current_cart_product_ids or []
    )

@router.get("/recommendations/{product_id}/upsells", response_model=List[AIRecommendationCard])
def get_product_upsells(
    product_id: str,
    merchant_slug: str = "technest",
    db: Session = Depends(get_db)
):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    return RecommendationEngine.get_product_upsells(
        db=db,
        merchant_id=merchant.id,
        base_product_id=product_id,
        current_cart_ids=[],
        max_results=3
    )
