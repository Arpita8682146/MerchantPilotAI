from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routers import (
    products, cart, checkout, payments, ai_agent,
    ai_protocol, merchant, analytics, audit, demo
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description='AI-native Merchant Commerce Platform for Razorpay AI Builder Buildathon 2026 (Track 01)',
    docs_url='/docs',
    redoc_url='/redoc'
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Register API Routers
app.include_router(products.router, prefix=settings.API_PREFIX)
app.include_router(cart.router, prefix=settings.API_PREFIX)
app.include_router(checkout.router, prefix=settings.API_PREFIX)
app.include_router(payments.router, prefix=settings.API_PREFIX)
app.include_router(ai_agent.router, prefix=settings.API_PREFIX)
app.include_router(ai_protocol.router, prefix=settings.API_PREFIX)
app.include_router(merchant.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(audit.router, prefix=settings.API_PREFIX)
app.include_router(demo.router, prefix=settings.API_PREFIX)

@app.get('/')
def root():
    return {
        'name': settings.PROJECT_NAME,
        'version': settings.VERSION,
        'track': 'Track 01 — AI Growth & Agentic Commerce (Razorpay Buildathon 2026)',
        'status': 'OPERATIONAL',
        'endpoints': {
            'ai_sales_agent': f'{settings.API_PREFIX}/ai/chat',
            'ai_commerce_protocol': f'{settings.API_PREFIX}/ai-protocol/catalog',
            'merchant_dashboard_analytics': f'{settings.API_PREFIX}/analytics/summary',
            'audit_trail': f'{settings.API_PREFIX}/audit/logs',
            'smart_cart': f'{settings.API_PREFIX}/cart',
            'razorpay_checkout': f'{settings.API_PREFIX}/checkout/create-order',
            'api_documentation': '/docs'
        }
    }

@app.get('/health')
def health_check():
    return {'status': 'healthy', 'service': 'MerchantPilot-AI-Engine'}
