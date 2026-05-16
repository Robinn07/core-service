from fastapi import APIRouter, Request, Query, HTTPException
import httpx
import os

from utils.logger import get_logger, limiter
from utils.retry import post_with_retry
from utils.validator import clean_data

router = APIRouter()
logger = get_logger("facebook")

# ─── Step 1: Verification ────────────────────────────────
@router.get("/facebook")
@limiter.limit("20/minute")
async def verify_facebook(
    request: Request,
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    logger.info("Received Facebook verification request")

    expected_token = os.getenv("FACEBOOK_VERIFY_TOKEN")

    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        logger.info("Facebook verification passed")
        return int(hub_challenge)

    logger.warning("Facebook verification failed")
    raise HTTPException(status_code=403, detail="Verification failed")


# ─── Step 2: Receive leads ────────────────────────────────
@router.post("/facebook")
@limiter.limit("20/minute")
async def receive_facebook_lead(request: Request):
    logger.info("Received Facebook lead")

    try:
        data = await request.json()
        entries = data.get("entry", [])

        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                lead_data = change.get("value", {})
                lead_id   = lead_data.get("leadgen_id")

                if not lead_id:
                    logger.warning("Facebook lead missing lead_id — skipping")
                    continue

                access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")

                async with httpx.AsyncClient() as client:
                    # Fetch lead details from Facebook
                    response = await client.get(
                        f"https://graph.facebook.com/v18.0/{lead_id}",
                        params={"access_token": access_token}
                    )
                    lead = response.json()

                    email = None
                    name  = None

                    for field in lead.get("field_data", []):
                        if field["name"] == "email":
                            email = field["values"][0]
                        if field["name"] == "full_name":
                            name = field["values"][0]

                    contact = clean_data({
                        "email": email,
                        "name": name,
                        "source": "facebook"
                    })

                    if not contact["email"]:
                        logger.warning("Facebook lead missing valid email — skipping")
                        continue

                    backend_url = os.getenv("BACKEND_URL")
                    await post_with_retry(client, f"{backend_url}/contacts", contact)
                    logger.info(f"Facebook lead forwarded: {contact['email']}")

        return {"status": "received"}

    except Exception as e:
        logger.error(f"Facebook error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")