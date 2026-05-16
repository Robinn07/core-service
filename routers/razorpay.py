from fastapi import APIRouter, Request, HTTPException
import httpx
import hmac
import hashlib
import os

from utils.logger import get_logger
from utils.retry import post_with_retry
from utils.validator import clean_data
from utils.logger import get_logger, limiter

router = APIRouter()
logger = get_logger("razorpay")

@router.post("/razorpay")
@limiter.limit("20/minute")
async def receive_razorpay(request: Request):
    logger.info("Received Razorpay webhook")

    try:
        body = await request.body()
        data = await request.json()

        # Verify signature
        razorpay_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
        signature = request.headers.get("x-razorpay-signature")

        expected_signature = hmac.new(
            razorpay_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()

        if signature != expected_signature:
            logger.warning("Razorpay signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Extract payment details
        payment = data.get("payload", {}).get("payment", {}).get("entity", {})

        data = clean_data({
            "email": payment.get("email"),
            "name": payment.get("notes", {}).get("name"),
            "amount": payment.get("amount", 0) / 100,
            "source": "razorpay"
        })

        if not data["email"]:
            logger.warning("Razorpay webhook missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", data)

        logger.info(f"Razorpay contact forwarded: {data['email']}")
        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Razorpay error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")