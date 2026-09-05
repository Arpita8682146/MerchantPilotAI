from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from backend.models import Product, ProductRelation, Merchant
from backend.schemas import ProductResponse, ProductDetailResponse, AIProtocolCatalogProduct

class CatalogService:
    @staticmethod
    def get_products(
        db: Session,
        merchant_id: str,
        category: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
        target_customer: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Product]:
        q = db.query(Product).filter(Product.merchant_id == merchant_id, Product.is_active == True)
        
        if category and category.lower() != 'all':
            q = q.filter(Product.category.ilike(f'%{category}%'))
            
        if query:
            words = [w.strip() for w in query.split() if len(w.strip()) > 2]
            if words:
                word_clauses = []
                for word in words:
                    search = f'%{word}%'
                    word_clauses.append(
                        or_(
                            Product.name.ilike(search),
                            Product.description.ilike(search),
                            Product.sku.ilike(search),
                            Product.category.ilike(search),
                            Product.target_customer.ilike(search)
                        )
                    )
                q = q.filter(or_(*word_clauses))
            
        if max_price:
            q = q.filter(Product.price <= max_price)
            
        if target_customer:
            q = q.filter(Product.target_customer.ilike(f'%{target_customer}%'))
            
        return q.order_by(Product.popularity_score.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_product_detail(db: Session, product_id: str) -> Optional[ProductDetailResponse]:
        prod = db.query(Product).filter(Product.id == product_id).first()
        if not prod:
            return None
            
        effective_price = prod.price * (1 - (prod.discount_percent or 0.0) / 100.0)
        
        relations = db.query(ProductRelation).filter(ProductRelation.source_product_id == prod.id).all()
        
        compatibles = []
        complementaries = []
        alternatives = []
        upgrades = []
        
        for rel in relations:
            target = db.query(Product).filter(Product.id == rel.target_product_id, Product.is_active == True).first()
            if not target:
                continue
            target_resp = CatalogService.to_response(target)
            if rel.relation_type == 'COMPATIBLE':
                compatibles.append(target_resp)
            elif rel.relation_type == 'COMPLEMENTARY':
                complementaries.append(target_resp)
            elif rel.relation_type in ['ALTERNATIVE', 'BUDGET_ALTERNATIVE']:
                alternatives.append(target_resp)
            elif rel.relation_type in ['UPGRADE', 'PREMIUM_ALTERNATIVE']:
                upgrades.append(target_resp)
                
        base_resp = CatalogService.to_response(prod)
        return ProductDetailResponse(
            **base_resp.model_dump(),
            compatible_products=compatibles,
            complementary_products=complementaries,
            alternatives=alternatives,
            upgrades=upgrades
        )

    @staticmethod
    def to_response(product: Product) -> ProductResponse:
        effective_price = product.price * (1 - (product.discount_percent or 0.0) / 100.0)
        return ProductResponse(
            id=product.id,
            merchant_id=product.merchant_id,
            sku=product.sku,
            name=product.name,
            description=product.description,
            category=product.category,
            price=product.price,
            discount_percent=product.discount_percent or 0.0,
            discounted_price=effective_price,
            stock=product.stock,
            specifications=product.specifications or {},
            use_cases=product.use_cases or [],
            target_customer=product.target_customer,
            tags=product.tags or [],
            popularity_score=product.popularity_score or 0.8,
            rating=product.rating or 4.5,
            merchant_margin=product.merchant_margin or 0.25,
            return_policy=product.return_policy or '7-day replacement',
            image_url=product.image_url,
            is_active=product.is_active
        )

    @staticmethod
    def to_protocol_schema(db: Session, product: Product) -> AIProtocolCatalogProduct:
        relations = db.query(ProductRelation).filter(ProductRelation.source_product_id == product.id).all()
        compat = [r.target_product_id for r in relations if r.relation_type == 'COMPATIBLE']
        comp = [r.target_product_id for r in relations if r.relation_type == 'COMPLEMENTARY']
        alt = [r.target_product_id for r in relations if r.relation_type in ['ALTERNATIVE', 'PREMIUM_ALTERNATIVE', 'BUDGET_ALTERNATIVE', 'UPGRADE']]
        
        return AIProtocolCatalogProduct(
            product_id=product.id,
            sku=product.sku,
            name=product.name,
            description=product.description,
            category=product.category,
            price=product.price,
            currency='INR',
            availability='in_stock' if product.stock > 0 else 'out_of_stock',
            stock_count=product.stock,
            specifications=product.specifications or {},
            use_cases=product.use_cases or [],
            target_customer=product.target_customer,
            compatible_products=compat,
            complementary_products=comp,
            alternatives=alt,
            tags=product.tags or [],
            rating=product.rating or 4.5,
            return_policy=product.return_policy or '7-day replacement'
        )
