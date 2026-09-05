from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        merchant_id: str,
        actor: str,  # AI_AGENT, CUSTOMER, SYSTEM, RAZORPAY, AI_BUYER, MERCHANT_ADMIN
        action: str,  # PRODUCT_RECOMMENDATION, ADD_TO_CART, PAYMENT_CREATED, PAYMENT_SUCCESS, PAYMENT_FAILED, GUARDRAIL_ENFORCED, HUMAN_ESCALATION
        reference_type: Optional[str] = None,
        reference_id: Optional[str] = None,
        decision: Optional[str] = None,
        result: str = "SUCCESS",  # SUCCESS, FAILED, BLOCKED_BY_GUARDRAIL, WARNING
        metadata_info: Optional[Dict[str, Any]] = None,
        order_id: Optional[str] = None,
        payment_id: Optional[str] = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            merchant_id=merchant_id,
            actor=actor,
            action=action,
            reference_type=reference_type,
            reference_id=reference_id,
            decision=decision,
            result=result,
            metadata_info=metadata_info or {},
            order_id=order_id,
            payment_id=payment_id
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @staticmethod
    def get_logs(
        db: Session,
        merchant_id: str,
        actor: Optional[str] = None,
        action: Optional[str] = None,
        result: Optional[str] = None,
        order_id: Optional[str] = None,
        limit: int = 100
    ) -> list[AuditLog]:
        query = db.query(AuditLog).filter(AuditLog.merchant_id == merchant_id)
        if actor:
            query = query.filter(AuditLog.actor == actor)
        if action:
            query = query.filter(AuditLog.action == action)
        if result:
            query = query.filter(AuditLog.result == result)
        if order_id:
            query = query.filter(AuditLog.order_id == order_id)
        return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
