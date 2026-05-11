# analytics-service/utils/config/loader.py
import os
import json
import base64
from dotenv import load_dotenv

load_dotenv()

def get_firebase_credentials():
    # Priority 1: FIREBASE_SERVICE_ACCOUNT_JSON (Base64 or Raw String)
    # Priority 2: FIREBASE_SERVICE_ACCOUNT (Path)
    
    creds_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if creds_json:
        try:
            # Try to decode if it's base64
            decoded = base64.b64decode(creds_json).decode('utf-8')
            return json.loads(decoded)
        except Exception:
            # If not base64, assume it's raw JSON
            return json.loads(creds_json)
    
    # Legacy path support
    path = os.getenv("FIREBASE_SERVICE_ACCOUNT", "serviceAccountKey.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
            
    raise ValueError("Firebase credentials not found in environment or file.")

def get_clickhouse_config():
    return {
        'host': os.getenv('CLICKHOUSE_HOST', 'localhost'),
        'port': int(os.getenv('CLICKHOUSE_PORT', 8123)),
        'username': os.getenv('CLICKHOUSE_USER', 'default'),
        'password': os.getenv('CLICKHOUSE_PASSWORD', ''),
        'secure': os.getenv('CLICKHOUSE_SECURE', 'False').lower() == 'true'
    }
