import asyncio
from utils.logger import get_logger

logger = get_logger("retry")

async def post_with_retry(client, url: str, data: dict, retries: int = 3):
    """
    Try to POST data to backend.
    If it fails, wait 2 seconds and try again.
    After 3 tries give up and log the error.
    """
    for attempt in range(1, retries + 1):
        try:
            response = await client.post(url, json=data)
            response.raise_for_status()
            logger.info(f"Successfully forwarded to backend on attempt {attempt}")
            return response
        except Exception as e:
            logger.error(f"Attempt {attempt} failed: {str(e)}")
            if attempt < retries:
                await asyncio.sleep(2)  # wait 2 seconds before retrying
            else:
                logger.error(f"All {retries} attempts failed. Data lost: {data}")
                raise