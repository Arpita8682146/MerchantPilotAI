import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.payment_service import PaymentService

client = TestClient(app)

def test_root_endpoint():
    response = client.get('/')
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'MerchantPilot AI'
    assert data['status'] == 'OPERATIONAL'

def test_list_products():
    response = client.get('/api/products')
    assert response.status_code == 200
    products = response.json()
    assert len(products) >= 25
    assert any('ASUS' in p['name'] for p in products)

def test_filter_products_by_category():
    response = client.get('/api/products?category=Laptops')
    assert response.status_code == 200
    products = response.json()
    assert len(products) >= 5
    for p in products:
        assert p['category'] == 'Laptops'

def test_ai_agent_chat_laptop_coding():
    payload = {
        'message': 'I need a laptop for coding under 70000. I am a CSE student and I also need a mouse.',
        'customer_persona': 'student'
    }
    response = client.post('/api/ai/chat', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data['recommended_products']) > 0
    assert len(data['upsell_products']) > 0
    assert data['recommended_products'][0]['product']['category'] == 'Laptops'
    assert len(data['tool_executions']) > 0

def test_ai_agent_ambiguous_clarification():
    payload = {
        'message': 'I need a good laptop.',
        'customer_persona': 'student'
    }
    response = client.post('/api/ai/chat', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['needs_clarification'] is True
    assert len(data['suggested_questions']) >= 2

def test_ai_protocol_catalog():
    response = client.get('/api/ai-protocol/catalog')
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 25
    assert 'product_id' in items[0]
    assert 'compatible_products' in items[0]

def test_ai_protocol_search():
    payload = {
        'query': 'laptop 16gb ram coding',
        'category': 'Laptops',
        'max_price': 70000
    }
    response = client.post('/api/ai-protocol/search', json=payload)
    assert response.status_code == 200
    items = response.json()
    assert len(items) > 0
    assert all(i['price'] <= 70000 for i in items)

def test_cart_lifecycle_and_calculations():
    session_id = f'test_session_cart_{uuid.uuid4().hex[:8]}'
    res = client.get(f'/api/cart?session_id={session_id}')
    assert res.status_code == 200
    cart_data = res.json()
    assert cart_data['item_count'] == 0
    
    prods = client.get('/api/products?category=Laptops').json()
    prod_id = prods[0]['id']
    
    add_payload = {
        'product_id': prod_id,
        'quantity': 1,
        'is_upsell': False,
        'added_via': 'ORGANIC'
    }
    res_add = client.post(f'/api/cart/items?session_id={session_id}', json=add_payload)
    assert res_add.status_code == 200
    updated_cart = res_add.json()
    assert updated_cart['item_count'] == 1
    assert updated_cart['total_amount'] > 0
    assert updated_cart['tax_amount'] > 0

def test_razorpay_signature_verification():
    order_id = 'order_test_123'
    payment_id = 'pay_test_456'
    secret = 'secret_test_buildathon2026'
    
    import hmac, hashlib
    valid_sig = hmac.new(
        secret.encode(),
        f'{order_id}|{payment_id}'.encode(),
        hashlib.sha256
    ).hexdigest()
    
    assert PaymentService.verify_payment_signature(order_id, payment_id, valid_sig, secret) is True
    assert PaymentService.verify_payment_signature(order_id, payment_id, 'fake_invalid_sig', secret) is False

def test_merchant_guardrails_retrieval_and_update():
    res = client.get('/api/merchant/rules')
    assert res.status_code == 200
    rules = res.json()
    assert 'max_upsell_amount' in rules
    
    res_update = client.put('/api/merchant/rules', json={'max_upsell_amount': 1500.0})
    assert res_update.status_code == 200
    assert res_update.json()['max_upsell_amount'] == 1500.0

def test_analytics_summary():
    res = client.get('/api/analytics/summary')
    assert res.status_code == 200
    summary = res.json()
    assert summary['total_revenue'] > 0
    assert summary['ai_assisted_revenue'] >= 0
    assert summary['aov_overall'] > 0
    assert 'ai_revenue_share_pct' in summary

def test_audit_logs():
    res = client.get('/api/audit/logs')
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0
    assert 'actor' in logs[0]
    assert 'action' in logs[0]
