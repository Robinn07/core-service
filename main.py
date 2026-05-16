from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routers import typeform, razorpay, webhooks
from routers import woocommerce, wordpress, facebook
from routers import stripe_payment
from routers import calendly
from routers import zapier, google_forms
from dotenv import load_dotenv
import os

# ─── Load correct .env file ───────────────────────────────
environment = os.getenv("ENV", "development")

if environment == "production":
    load_dotenv(".env.production")
else:
    load_dotenv(".env.development")

# ─── Rate limiter setup ───────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Register all routers ─────────────────────────────────
app.include_router(typeform.router)
app.include_router(razorpay.router)
app.include_router(webhooks.router)
app.include_router(woocommerce.router)
app.include_router(wordpress.router)
app.include_router(facebook.router)
app.include_router(zapier.router)
app.include_router(google_forms.router)
app.include_router(stripe_payment.router)
app.include_router(calendly.router)
