from fastapi import APIRouter, Request, HTTPException
import httpx
import os

from utils.logger import get_logger, limiter
from utils.retry import post_with_retry
from utils.validator import clean_data

router = APIRouter()
logger = get_logger("calendly")

@router.post("/calendly")
@limiter.limit("20/minute")
async def receive_calendly(request: Request):
    logger.info("Received Calendly webhook")

    try:
        data = await request.json()

        # Check event type
        event = data.get("event")
        logger.info(f"Calendly event type: {event}")

        if event != "invitee.created":
            logger.info(f"Ignoring Calendly event: {event}")
            return {"status": "ignored"}

        # Extract details directly from payload
        payload      = data.get("payload", {})
        email        = payload.get("email")
        name         = payload.get("name")

        # Get meeting details from scheduled_event
        scheduled_event = payload.get("scheduled_event", {})
        meeting_time    = scheduled_event.get("start_time")

        # Clean and validate
        contact = clean_data({
            "email": email,
            "name": name,
            "meeting_time": meeting_time,
            "source": "calendly"
        })

        if not contact["email"]:
            logger.warning("Calendly webhook missing valid email — skipping")
            return {"status": "skipped", "reason": "invalid email"}

        # Forward to backend teammate
        backend_url = os.getenv("BACKEND_URL")

        async with httpx.AsyncClient() as client:
            await post_with_retry(client, f"{backend_url}/contacts", contact)

        logger.info(f"Calendly booking forwarded: {contact['email']}")
        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Calendly error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")