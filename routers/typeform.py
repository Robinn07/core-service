from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
import httpx
import os

from utils.logger import get_logger, limiter
from utils.retry import post_with_retry
from utils.validator import clean_data

router = APIRouter()
logger = get_logger("typeform")

class TypeformPayload(BaseModel):
    form_response: Dict[str, Any]

@router.post("/typeform")
@limiter.limit("20/minute")  # max 20 requests per minute
async def receive_typeform(request: Request, payload: TypeformPayload):
    logger.info("Received Typeform submission")

    try:
        answers = payload.form_response.get("answers", [])

        email = None
        name  = None

        for answer in answers:
            if answer.get("type") == "email":
                email = answer.get("email")
            if answer.get("type") == "text":
                name = answer.get("text")

        data = clean_data({
            "email": email,
            "name": name,
            "source": "typeform"
        })

        if not data["email"]:
            logger.warning("Typeform submission missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", data)

        logger.info(f"Typeform contact forwarded: {data['email']}")
        return {"status": "received"}

    except Exception as e:
        logger.error(f"Typeform error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")