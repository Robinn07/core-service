from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import httpx
import os

from utils.logger import get_logger, limiter
from utils.retry import post_with_retry
from utils.validator import clean_data

router = APIRouter()
logger = get_logger("wordpress")

class WordPressPayload(BaseModel):
    email: str
    name: Optional[str] = None
    event: Optional[str] = None
    website: Optional[str] = None

@router.post("/wordpress")
@limiter.limit("20/minute")
async def receive_wordpress(
    request: Request,
    payload: WordPressPayload,
    x_api_key: str = Header(None)
):
    logger.info("Received WordPress webhook")

    try:
        expected_key = os.getenv("WORDPRESS_API_KEY")

        if x_api_key != expected_key:
            logger.warning("WordPress invalid API key")
            raise HTTPException(status_code=401, detail="Invalid API key")

        data = clean_data({
            "email": payload.email,
            "name": payload.name,
            "event": payload.event,
            "website": payload.website,
            "source": "wordpress"
        })

        if not data["email"]:
            logger.warning("WordPress webhook missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", data)

        logger.info(f"WordPress contact forwarded: {data['email']}")
        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WordPress error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")