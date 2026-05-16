import logging
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

# ─── Rate limiter ─────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── Logger setup ─────────────────────────────────────────
os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/integrations.log")
    ]
)

def get_logger(name: str):
    return logging.getLogger(name)