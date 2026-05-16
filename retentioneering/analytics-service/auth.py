# analytics-service/auth.py
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security, Request, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from functools import wraps
from utils.config.loader import get_firebase_credentials

security = HTTPBearer()

# ── Firebase Initialization ─────────────────────────────────────
creds_dict = get_firebase_credentials()

if not firebase_admin._apps:
    cred = credentials.Certificate(creds_dict)
    firebase_admin.initialize_app(cred)

def verify_token(http_auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifies the Firebase ID Token and extracts custom claims (role).
    """
    if not http_auth:
        raise HTTPException(status_code=401, detail="Missing authentication credentials")
    
    token = http_auth.credentials
    try:
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        # Standardize 'sub' and ensure 'role' exists
        decoded_token['sub'] = decoded_token['uid']
        if 'role' not in decoded_token:
            decoded_token['role'] = 'viewer' # Default role
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def require_role(allowed_roles: list):
    """
    RBAC Decorator/Dependency
    """
    def role_checker(token: dict = Depends(verify_token)):
        if token.get('role') not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Role '{token.get('role')}' does not have permission for this action"
            )
        return token
    return role_checker

def get_current_org_id(token: dict = Security(verify_token)):
    return token.get('uid')
