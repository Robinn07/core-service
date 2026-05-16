from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import httpx
import os

from utils.logger import get_logger, limiter
from utils.retry import post_with_retry
from utils.validator import clean_data

router = APIRouter()
logger = get_logger("zapier")

class ZapierPayload(BaseModel):
    email: str
    name: Optional[str] = None
    event: Optional[str] = None

# ─── Auth check ───────────────────────────────────────────
@router.get("/zapier/auth")
async def zapier_auth(x_api_key: str = Header(None)):
    expected_key = os.getenv("ZAPIER_API_KEY")

    if x_api_key != expected_key:
        logger.warning("Zapier invalid API key on auth check")
        raise HTTPException(status_code=401, detail="Invalid API key")

    logger.info("Zapier auth check passed")
    return {"status": "authenticated"}


# ─── Sample data ──────────────────────────────────────────
@router.get("/zapier/sample")
async def zapier_sample(x_api_key: str = Header(None)):
    expected_key = os.getenv("ZAPIER_API_KEY")

    if x_api_key != expected_key:
        logger.warning("Zapier invalid API key on sample request")
        raise HTTPException(status_code=401, detail="Invalid API key")

    logger.info("Zapier sample data requested")
    return [
        {
            "email": "sample@example.com",
            "name": "Sample User",
            "event": "new_contact",
            "source": "zapier"
        }
    ]


# ─── Receive real data ────────────────────────────────────
@router.post("/zapier")
@limiter.limit("20/minute")
async def receive_zapier(
    request: Request,
    payload: ZapierPayload,
    x_api_key: str = Header(None)
):
    logger.info("Received Zapier webhook")

    try:
        expected_key = os.getenv("ZAPIER_API_KEY")

        if x_api_key != expected_key:
            logger.warning("Zapier invalid API key")
            raise HTTPException(status_code=401, detail="Invalid API key")

        data = clean_data({
            "email": payload.email,
            "name": payload.name,
            "event": payload.event,
            "source": "zapier"
        })

        if not data["email"]:
            logger.warning("Zapier webhook missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", data)

        logger.info(f"Zapier contact forwarded: {data['email']}")
        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Zapier error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")