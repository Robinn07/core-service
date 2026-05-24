from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import httpx
import os


from utils.logger import get_logger
from utils.retry import post_with_retry
from utils.validator import clean_data
from utils.logger import get_logger, limiter

router = APIRouter()
logger = get_logger("webhooks")

class WebhookPayload(BaseModel):
    email: str
    name: Optional[str] = None
    event: Optional[str] = None

@router.post("/webhook")
@limiter.limit("20/minute")
async def receive_webhook(
    request: Request,
    payload: WebhookPayload,
    x_api_key: str = Header(None)
):
    logger.info("Received webhook")

    try:
        expected_key = os.getenv("WEBHOOK_API_KEY")

        if x_api_key != expected_key:
            logger.warning("Webhook invalid API key")
            raise HTTPException(status_code=401, detail="Invalid API key")

        data = clean_data({
            "email": payload.email,
            "name": payload.name,
            "event": payload.event,
            "source": "webhook"
        })

        if not data["email"]:
            logger.warning("Webhook missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", data)

        logger.info(f"Webhook contact forwarded: {data['email']}")
        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")