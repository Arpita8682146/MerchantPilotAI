from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Order, Payment
from backend.schemas import (
    PaymentVerifyRequest, PaymentVerifyResponse,
    PaymentFailureReportRequest, PaymentRecoveryResponse
)
from backend.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/verify", response_model=PaymentVerifyResponse)
def verify_payment(req: PaymentVerifyRequest, db: Session = Depends(get_db)):
    success, msg, breakdown = PaymentService.process_payment_verification(
        db=db,
        order_id=req.order_id,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature
    )
    
    order = db.query(Order).filter(Order.id == req.order_id).first()
    order_num = order.order_number if order else "N/A"
    
    if not success:
        return PaymentVerifyResponse(
            success=False,
            status="FAILED",
            order_id=req.order_id,
            order_number=order_num,
            payment_id=req.razorpay_payment_id,
            message=msg,
            revenue_breakdown=None
        )
        
    return PaymentVerifyResponse(
        success=True,
        status="SUCCESS",
        order_id=req.order_id,
        order_number=order_num,
        payment_id=req.razorpay_payment_id,
        message=msg,
        revenue_breakdown=breakdown
    )

@router.post("/report-failure", response_model=PaymentRecoveryResponse)
def report_payment_failure(req: PaymentFailureReportRequest, db: Session = Depends(get_db)):
    return PaymentService.handle_payment_failure(
        db=db,
        order_id=req.order_id,
        razorpay_order_id=req.razorpay_order_id,
        error_code=req.error_code,
        error_description=req.error_description,
        customer_action=req.customer_action
    )
