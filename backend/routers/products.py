from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Merchant, Product
from backend.schemas import ProductResponse, ProductDetailResponse
from backend.services.catalog_service import CatalogService

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    merchant_slug: str = "technest",
    category: Optional[str] = None,
    query: Optional[str] = None,
    max_price: Optional[float] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    merchant = db.query(Merchant).filter(Merchant.slug == merchant_slug).first()
    if not merchant:
        merchant = db.query(Merchant).first()
    if not merchant:
        return []
        
    products = CatalogService.get_products(
        db=db,
        merchant_id=merchant.id,
        category=category,
        query=query,
        max_price=max_price,
        limit=limit,
        offset=offset
    )
    return [CatalogService.to_response(p) for p in products]

@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    detail = CatalogService.get_product_detail(db, product_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Product not found")
    return detail
