from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import httpx
import os

from utils.logger import get_logger, limiter
from utils.retry import post_with_retry
from utils.validator import clean_data

router = APIRouter()
logger = get_logger("google_forms")

class GoogleFormPayload(BaseModel):
    email: str
    name: Optional[str] = None
    message: Optional[str] = None

@router.post("/google-forms")
@limiter.limit("20/minute")
async def receive_google_form(
    request: Request,
    payload: GoogleFormPayload,
    x_api_key: str = Header(None)
):
    logger.info("Received Google Forms submission")

    try:
        expected_key = os.getenv("GOOGLE_FORMS_API_KEY")

        if x_api_key != expected_key:
            logger.warning("Google Forms invalid API key")
            raise HTTPException(status_code=401, detail="Invalid API key")

        data = clean_data({
            "email": payload.email,
            "name": payload.name,
            "message": payload.message,
            "source": "google_forms"
        })

        if not data["email"]:
            logger.warning("Google Forms missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", data)

        logger.info(f"Google Forms contact forwarded: {data['email']}")
        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google Forms error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")