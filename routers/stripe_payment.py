from fastapi import APIRouter, Request, HTTPException
import httpx
import hmac
import hashlib
import os

from utils.logger import get_logger, limiter
from utils.retry import post_with_retry
from utils.validator import clean_data

router = APIRouter()
logger = get_logger("stripe")

@router.post("/stripe")
@limiter.limit("20/minute")
async def receive_stripe(request: Request):
    logger.info("Received Stripe webhook")

    try:
        body = await request.body()
        data = await request.json()

        # Step 1 — Verify Stripe signature
        stripe_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        signature_header = request.headers.get("stripe-signature")

        if not signature_header:
            logger.warning("Stripe webhook missing signature")
            raise HTTPException(status_code=400, detail="Missing signature")

        # Extract timestamp and signature from header
        # Header looks like: t=123456,v1=abc123
        parts = dict(item.split("=", 1) for item in signature_header.split(","))
        timestamp = parts.get("t")
        signature = parts.get("v1")

        # Build the signed payload
        signed_payload = f"{timestamp}.{body.decode()}"

        # Compute expected signature
        expected_signature = hmac.new(
            stripe_secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()

        if signature != expected_signature:
            logger.warning("Stripe signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Step 2 — Extract payment details
        event_type = data.get("type")
        logger.info(f"Stripe event type: {event_type}")

        # Only process successful payments
        if event_type != "payment_intent.succeeded":
            logger.info(f"Ignoring Stripe event: {event_type}")
            return {"status": "ignored"}

        payment = data.get("data", {}).get("object", {})

        email  = payment.get("receipt_email")
        amount = payment.get("amount", 0) / 100  # convert cents to dollars
        name   = payment.get("shipping", {}).get("name") if payment.get("shipping") else None

        # Step 3 — Clean and validate
        contact = clean_data({
            "email": email,
            "name": name,
            "amount": amount,
            "currency": payment.get("currency"),
            "source": "stripe"
        })

        if not contact["email"]:
            logger.warning("Stripe webhook missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        # Step 4 — Forward to backend teammate
        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", contact)

        logger.info(f"Stripe contact forwarded: {contact['email']}")
        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")