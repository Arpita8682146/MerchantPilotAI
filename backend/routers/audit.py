from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Merchant
from backend.schemas import AuditLogResponse
from backend.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    actor: Optional[str] = None,
    action: Optional[str] = None,
    result: Optional[str] = None,
    order_id: Optional[str] = None,
    limit: int = 100,
    merchant_slug: str = "technest",
    db: Session = Depends(get_db)
):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        return []
        
    logs = AuditService.get_logs(
        db=db,
        merchant_id=merchant.id,
        actor=actor,
        action=action,
        result=result,
        order_id=order_id,
        limit=limit
    )
    return logs
