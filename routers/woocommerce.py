from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import hmac
import hashlib
import base64
import os

from utils.logger import get_logger, limiter
from utils.retry import post_with_retry
from utils.validator import clean_data

router = APIRouter()
logger = get_logger("woocommerce")

class BillingAddress(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

class WooCommercePayload(BaseModel):
    id: Optional[int] = None
    status: Optional[str] = None
    billing: Optional[BillingAddress] = None
    total: Optional[str] = None

@router.post("/woocommerce")
@limiter.limit("20/minute")
async def receive_woocommerce(request: Request, payload: WooCommercePayload):
    logger.info("Received WooCommerce webhook")

    try:
        # Verify signature
        secret = os.getenv("WOOCOMMERCE_WEBHOOK_SECRET")
        signature = request.headers.get("x-wc-webhook-signature")
        body = await request.body()

        expected_signature = base64.b64encode(
            hmac.new(secret.encode(), body, hashlib.sha256).digest()
        ).decode()

        if signature != expected_signature:
            logger.warning("WooCommerce signature verification failed")
            raise HTTPException(status_code=401, detail="Invalid signature")

        # Extract order details
        billing = payload.billing
        name    = f"{billing.first_name} {billing.last_name}".strip() if billing else None
        email   = billing.email if billing else None

        data = clean_data({
            "email": email,
            "name": name,
            "order_id": payload.id,
            "order_status": payload.status,
            "order_total": payload.total,
            "source": "woocommerce"
        })

        if not data["email"]:
            logger.warning("WooCommerce webhook missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", data)

        logger.info(f"WooCommerce contact forwarded: {data['email']}")
        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WooCommerce error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")