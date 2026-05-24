import re
from utils.logger import get_logger

logger = get_logger("validator")

def is_valid_email(email: str) -> bool:
    """Check if email looks real"""
    if not email:
        return False
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def clean_data(data: dict) -> dict:
    """Clean and validate incoming data"""
    email = data.get("email")
    
    if not is_valid_email(email):
        logger.warning(f"Invalid email received: {email}")
        data["email"] = None
    
    # Strip whitespace from name
    if data.get("name"):
        data["name"] = data["name"].strip()
    
    return data