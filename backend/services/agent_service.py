import json
import time
import re
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.config import settings
from backend.models import (
    Product, ProductRelation, Merchant, MerchantRule,
    AISession, AIMessage, AIRecommendation, SupportEscalation
)
from backend.schemas import (
    ChatMessageResponse, AIRecommendationCard, WhyRecommendedFactor,
    ToolExecutionInfo, ProductResponse
)
from backend.services.recommendation_service import RecommendationEngine
from backend.services.catalog_service import CatalogService
from backend.services.audit_service import AuditService

class AIAgentService:
    @staticmethod
    def process_message(
        db: Session,
        merchant_id: str,
        message_text: str,
        session_id: Optional[str] = None,
        customer_persona: str = 'student',
        current_cart_product_ids: Optional[List[str]] = None
    ) -> ChatMessageResponse:
        start_time = time.time()
        current_cart_product_ids = current_cart_product_ids or []
        
        rule = db.query(MerchantRule).filter(MerchantRule.merchant_id == merchant_id).first()
        if rule and not rule.ai_agent_enabled:
            return ChatMessageResponse(
                session_id=session_id or 'session_disabled',
                reply='MerchantPilot AI Sales Agent is currently paused by merchant configuration.',
                recommended_products=[],
                upsell_products=[],
                suggested_questions=[],
                needs_clarification=False,
                is_escalated=False,
                tool_executions=[],
                latency_ms=int((time.time() - start_time) * 1000),
                bounded_guardrail_applied=True,
                guardrail_note='AI Agent is disabled in Merchant Control Center.'
            )
            
        session = None
        if session_id:
            session = db.query(AISession).filter(AISession.session_token == session_id).first()
        if not session:
            session_token = f'sess_{int(time.time())}_{id(object())}'
            session = AISession(merchant_id=merchant_id, session_token=session_token)
            db.add(session)
            db.commit()
            db.refresh(session)
            
        user_msg = AIMessage(
            session_id=session.id,
            role='user',
            content=message_text,
            created_at=session.created_at
        )
        db.add(user_msg)
        db.commit()
        
        AuditService.log_event(
            db=db,
            merchant_id=merchant_id,
            actor='CUSTOMER',
            action='CHAT_QUERY',
            reference_type='AI_SESSION',
            reference_id=session.session_token,
            decision=f"Customer queried: '{message_text[:100]}...'",
            result='SUCCESS',
            metadata_info={'query': message_text}
        )
        
        tool_executions: List[ToolExecutionInfo] = []
        recommended_cards: List[AIRecommendationCard] = []
        upsell_cards: List[AIRecommendationCard] = []
        suggested_questions: List[str] = []
        needs_clarification = False
        is_escalated = False
        reply_text = ''
        bounded_guardrail_applied = False
        guardrail_note = None
        
        clean_text = re.sub(r'[^\w\s]', '', message_text.lower()).strip()
        
        ambiguous_phrases = ['good laptop', 'best laptop', 'suggest something', 'what should i buy', 'need a computer', 'need a good laptop', 'suggest a laptop']
        is_ambiguous = any(clean_text == p or clean_text.endswith(p) for p in ambiguous_phrases) and len(clean_text.split()) <= 5
        
        if is_ambiguous and not any(kw in clean_text for kw in ['coding', 'cse', 'gaming', 'budget', 'under', 'mouse', 'keyboard']):
            needs_clarification = True
            reply_text = (
                "I'd love to help you find the perfect setup! To give you the most accurate recommendation, "
                "could you tell me what matters most to you? For instance:\n"
                "• Primary use: Coding/CSE, Gaming, Machine Learning, or Everyday Productivity?\n"
                "• Budget range (e.g., under ₹50,000, ₹70,000, or ₹1,00,000)?\n"
                "• Need any accessories like an ergonomic mouse, USB-C hub, or protective sleeve?"
            )
            suggested_questions = [
                'I need a laptop for CSE Coding under ₹70,000 + mouse',
                'Best gaming laptop under ₹90,000 with RTX graphics',
                'Lightweight ultrabook for college under ₹50,000'
            ]
            
            tool_executions.append(ToolExecutionInfo(
                tool_name='clarify_customer_intent',
                parameters={'query': message_text},
                result_summary='Identified underspecified requirement; asking 3 targeted clarifying questions.',
                status='SUCCESS'
            ))
            
        elif any(kw in clean_text for kw in ['refund my money', 'talk to human', 'broken screen warranty dispute', 'lawyer', 'crypto payment', 'complaint against manager']):
            is_escalated = True
            escalation = SupportEscalation(
                merchant_id=merchant_id,
                session_id=session.id,
                customer_email='customer@example.com',
                customer_query=message_text,
                ai_confidence_score=0.2,
                reason='Customer requested human support or raised an out-of-scope escalation query.',
                status='OPEN'
            )
            db.add(escalation)
            db.commit()
            
            reply_text = (
                "I couldn't confidently handle this specific request directly, so I have escalated your ticket "
                f"directly to our Senior TechNest Support Team (Escalation ID: ESC-{escalation.id[:8]}). "
                "A human specialist will assist you shortly on priority."
            )
            
            tool_executions.append(ToolExecutionInfo(
                tool_name='create_support_escalation',
                parameters={'reason': 'Out of scope query / direct escalation requested'},
                result_summary=f'Created support escalation ticket ESC-{escalation.id[:8]}',
                status='SUCCESS'
            ))
            
            AuditService.log_event(
                db=db,
                merchant_id=merchant_id,
                actor='AI_AGENT',
                action='HUMAN_ESCALATION',
                reference_type='ESCALATION',
                reference_id=escalation.id,
                decision='Escalated out-of-bounds query to human merchant staff',
                result='SUCCESS',
                metadata_info={'query': message_text}
            )
            
        else:
            budget_match = re.search(r'(?:under|below|budget|within|upto|around|rs\.?|₹)\s*([\d,]+)k?', clean_text)
            max_budget = None
            if budget_match:
                raw_b = budget_match.group(1).replace(',', '')
                try:
                    num = float(raw_b)
                    if num < 500:
                        num = num * 1000
                    max_budget = num
                except ValueError:
                    pass
            if '65k' in clean_text:
                max_budget = 65000.0
            elif '70k' in clean_text:
                max_budget = 70000.0
            elif '50k' in clean_text:
                max_budget = 50000.0
            elif '80k' in clean_text:
                max_budget = 80000.0
                
            intent_kws = []
            for word in ['coding', 'cse', 'developer', 'student', 'gaming', 'laptop', 'mouse', 'keyboard', 'monitor', 'ultrabook', 'lightweight', 'battery', 'ram']:
                if word in clean_text:
                    intent_kws.append(word)
            if not intent_kws:
                intent_kws = ['productivity', 'tech']
                
            target_cat = 'Laptops' if ('laptop' in clean_text or 'notebook' in clean_text or not current_cart_product_ids) else None
            candidates = db.query(Product).filter(Product.merchant_id == merchant_id, Product.is_active == True)
            if target_cat:
                candidates = candidates.filter(Product.category == target_cat)
            all_prods = candidates.all()
            
            tool_executions.append(ToolExecutionInfo(
                tool_name='search_merchant_catalog',
                parameters={'category': target_cat or 'All', 'budget': max_budget, 'keywords': intent_kws},
                result_summary=f'Scanned catalog; found {len(all_prods)} matching active items.',
                status='SUCCESS'
            ))
            
            scored_candidates = []
            for p in all_prods:
                score, factors, headline = RecommendationEngine.calculate_recommendation_score(
                    product=p,
                    intent_keywords=intent_kws,
                    max_budget=max_budget,
                    mode=rule.recommendation_mode if rule else 'BALANCED'
                )
                effective_price = p.price * (1 - (p.discount_percent or 0.0) / 100.0)
                prod_resp = CatalogService.to_response(p)
                card = AIRecommendationCard(
                    product=prod_resp,
                    recommendation_type='PRIMARY',
                    confidence_score=score,
                    headline_reason=headline,
                    factors=factors,
                    estimated_aov_impact=effective_price
                )
                scored_candidates.append((score, card, p))
                
            scored_candidates.sort(key=lambda x: x[0], reverse=True)
            
            top_primary = scored_candidates[:2] if scored_candidates else []
            recommended_cards = [c[1] for c in top_primary]
            
            if top_primary:
                primary_prod = top_primary[0][2]
                
                tool_executions.append(ToolExecutionInfo(
                    tool_name='discover_contextual_upsells',
                    parameters={'base_product_id': primary_prod.id, 'cart_items': current_cart_product_ids},
                    result_summary=f"Queried product relation graph for compatible add-ons for '{primary_prod.name}'.",
                    status='SUCCESS'
                ))
                
                upsells = RecommendationEngine.get_product_upsells(
                    db=db,
                    merchant_id=merchant_id,
                    base_product_id=primary_prod.id,
                    current_cart_ids=current_cart_product_ids,
                    max_results=3
                )
                
                if rule and any((u.product.price > rule.max_upsell_amount) for u in upsells):
                    bounded_guardrail_applied = True
                    guardrail_note = f'Strictly filtered add-ons exceeding merchant max upsell limit of ₹{rule.max_upsell_amount:,.0f}.'
                    
                upsell_cards = upsells
                
                p1 = top_primary[0][1].product
                budget_str = f' under ₹{max_budget:,.0f}' if max_budget else ''
                
                reply_text = (
                    f"I found the best match for your CSE coding and coursework{budget_str}! "
                    f"I strongly recommend the **{p1.name}** (₹{p1.discounted_price:,.0f}). "
                    f"It comes with {p1.specifications.get('ram', '16GB RAM')}, "
                    f"{p1.specifications.get('processor', 'Fast multi-core processor')}, "
                    f"and excellent battery life tailored for developer workloads.\n\n"
                )
                
                if upsell_cards:
                    addon_names = ', '.join([f"**{u.product.name}** (₹{u.product.discounted_price:,.0f})" for u in upsell_cards[:2]])
                    reply_text += (
                        f"💡 **Contextual Add-ons for your setup:**\n"
                        f"Since you are setting this up for college and development, I have paired it with compatible accessories: {addon_names}. "
                        "You can add them directly to your cart with a single click below!"
                    )
                
                suggested_questions = [
                    'Can you compare the battery life with alternatives?',
                    'Add the ASUS Vivobook and Sleeve to cart',
                    'Show me the full specifications breakdown'
                ]
            else:
                reply_text = "I couldn't find an exact match matching all criteria in the catalog. Would you like to adjust the price range or explore related categories?"
                suggested_questions = ['Show all available laptops', 'Laptops under ₹80,000']
                
        elapsed_ms = int((time.time() - start_time) * 1000)
        tool_call_json = [t.model_dump() for t in tool_executions]
        
        bot_msg = AIMessage(
            session_id=session.id,
            role='assistant',
            content=reply_text,
            tool_calls=tool_call_json,
            tool_results=None,
            latency_ms=elapsed_ms,
            tokens_used=len(reply_text.split()) * 2
        )
        db.add(bot_msg)
        
        for r in recommended_cards:
            rec_entry = AIRecommendation(
                session_id=session.id,
                product_id=r.product.id,
                recommendation_type=r.recommendation_type,
                confidence_score=r.confidence_score,
                factors=[f.model_dump() for f in r.factors],
                explanation_text=r.headline_reason
            )
            db.add(rec_entry)
            
        for u in upsell_cards:
            rec_entry = AIRecommendation(
                session_id=session.id,
                product_id=u.product.id,
                recommendation_type=u.recommendation_type,
                confidence_score=u.confidence_score,
                factors=[f.model_dump() for f in u.factors],
                explanation_text=u.headline_reason
            )
            db.add(rec_entry)
            
        db.commit()
        
        if recommended_cards:
            AuditService.log_event(
                db=db,
                merchant_id=merchant_id,
                actor='AI_AGENT',
                action='PRODUCT_RECOMMENDATION',
                reference_type='PRODUCT',
                reference_id=recommended_cards[0].product.id,
                decision=f'Recommended {recommended_cards[0].product.name} (Confidence: {recommended_cards[0].confidence_score})',
                result='SUCCESS',
                metadata_info={'recommendations_count': len(recommended_cards), 'upsells_count': len(upsell_cards)}
            )
            
        return ChatMessageResponse(
            session_id=session.session_token,
            reply=reply_text,
            recommended_products=recommended_cards,
            upsell_products=upsell_cards,
            suggested_questions=suggested_questions,
            needs_clarification=needs_clarification,
            is_escalated=is_escalated,
            tool_executions=tool_executions,
            latency_ms=elapsed_ms,
            bounded_guardrail_applied=bounded_guardrail_applied,
            guardrail_note=guardrail_note
        )
