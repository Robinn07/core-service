import re
import time
import functools
from typing import Callable, Dict, Any, Optional

# --- Configuration ---
# A list of your main platform domains. Requests to these domains
# will typically not have an associated tenant ID, or will use a default one.
PLATFORM_DOMAINS = [
    "your-platform.com",
    "www.your-platform.com",
    "app.your-platform.com",
    "api.your-platform.com",
]

# Cache settings
# For a production environment, replace functools.lru_cache with a distributed cache like Redis.
CACHE_MAX_SIZE = 128  # Max number of tenant IDs to cache in memory
CACHE_TTL_SECONDS = 300 # 5 minutes TTL for cache entries (not directly used by lru_cache, but good practice)

# --- Database Simulation (Replace with actual ORM/DB client) ---
# This is a simulation of your database table and the verification engine's data.
# In a real application, this would interact with your `custom_domains` table.

# Example data for _CUSTOM_DOMAINS_DB from verification_engine.py
_CUSTOM_DOMAINS_DB_SIMULATION = {
    "domain_id_1": {
        'id': "domain_id_1",
        'tenant_id': "tenant-uuid-123-abc",
        'domain_name': "app.customer-one.com",
        'verification_status': 'VERIFIED',
        'is_active': True
    },
    "domain_id_2": {
        'id': "domain_id_2",
        'tenant_id': "tenant-uuid-456-def",
        'domain_name': "app.customer-two.com",
        'verification_status': 'VERIFIED',
        'is_active': True
    },
    # Another pending domain (won't be resolved by middleware until verified)
    "domain_id_3": {
        'id': "domain_id_3",
        'tenant_id': "tenant-uuid-789-ghi",
        'domain_name': "pending.customer-three.com",
        'verification_status': 'PENDING',
        'is_active': False
    }
}

def get_tenant_id_from_db(domain_name: str) -> Optional[str]:
    """
    Simulates querying the database for the tenant ID associated with a verified, active custom domain.

    Args:
        domain_name (str): The custom domain to look up.

    Returns:
        Optional[str]: The tenant ID if found, otherwise None.
    """
    print(f"[{time.time()}] DB Query: Looking up tenant ID for domain '{domain_name}'")
    for domain_entry in _CUSTOM_DOMAINS_DB_SIMULATION.values():
        if domain_entry['domain_name'] == domain_name and 
           domain_entry['verification_status'] == 'VERIFIED' and 
           domain_entry['is_active']:
            return domain_entry['tenant_id']
    return None

# --- Caching Strategy ---
# Using `functools.lru_cache` for a simple in-memory cache.
# For a production system, consider a dedicated cache server like Redis
# with proper TTL management and invalidation strategies.
@functools.lru_cache(maxsize=CACHE_MAX_SIZE)
def _cached_get_tenant_id(domain_name: str) -> Optional[str]:
    """
    Memoized version of get_tenant_id_from_db to cache results.
    """
    print(f"[{time.time()}] Cache Miss/DB Query for domain '{domain_name}'")
    return get_tenant_id_from_db(domain_name)

# A more robust cache with explicit TTL could be implemented using a dictionary
# and storing (value, expiry_timestamp), then checking expiry before returning.
# For example:
# _CUSTOM_DOMAIN_CACHE = {}
# def get_tenant_id_with_ttl_cache(domain_name: str) -> Optional[str]:
#     now = time.time()
#     if domain_name in _CUSTOM_DOMAIN_CACHE:
#         tenant_id, expiry = _CUSTOM_DOMAIN_CACHE[domain_name]
#         if now < expiry:
#             print(f"[{now}] Cache Hit for domain '{domain_name}'")
#             return tenant_id
#         else:
#             print(f"[{now}] Cache Expired for domain '{domain_name}'")
#             del _CUSTOM_DOMAIN_CACHE[domain_name]
#     
#     tenant_id = get_tenant_id_from_db(domain_name)
#     if tenant_id:
#         _CUSTOM_DOMAIN_CACHE[domain_name] = (tenant_id, now + CACHE_TTL_SECONDS)
#     return tenant_id


# --- Tenant Resolution Logic ---
def resolve_tenant_id(hostname: str) -> Optional[str]:
    """
    Resolves the tenant ID from an incoming hostname (Host header).
    Handles platform domains and queries for custom domains using caching.

    Args:
        hostname (str): The hostname from the HTTP Host header.

    Returns:
        Optional[str]: The resolved tenant ID, or None if it's a platform domain
                       or an unrecognized custom domain.
    """
    # 1. Normalize hostname: Convert to lowercase and strip port if present.
    normalized_hostname = hostname.lower().split(':')[0]

    # 2. Validate hostname format (basic check to prevent malformed host headers)
    if not re.match(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$", normalized_hostname):
        print(f"[{time.time()}] Security Warning: Invalid hostname format: '{hostname}'")
        return None # Deny invalid hostnames immediately

    # 3. Check against platform domains
    if normalized_hostname in PLATFORM_DOMAINS:
        print(f"[{time.time()}] Host '{normalized_hostname}' is a platform domain. No tenant ID assigned.")
        return None # Or return a default tenant ID for platform, if applicable

    # 4. Look up in cache, then database for custom domains
    tenant_id = _cached_get_tenant_id(normalized_hostname)
    
    if tenant_id:
        print(f"[{time.time()}] Resolved tenant ID '{tenant_id}' for custom domain '{normalized_hostname}'")
    else:
        print(f"[{time.time()}] No active/verified tenant ID found for custom domain '{normalized_hostname}'")
        
    return tenant_id


# --- Middleware Implementation ---
class RequestContext:
    """
    A simple class to simulate a request context where tenant_id can be stored.
    In real frameworks, this might be `request.tenant_id` (Flask/Django),
    `request.state.tenant_id` (FastAPI), or `req.tenantId` (Node.js Express).
    """
    def __init__(self):
        self.tenant_id = None
        self.hostname = None
        self.is_custom_domain = False
        # Add other request-specific attributes here


def tenant_middleware(request_handler: Callable[[RequestContext], Any]) -> Callable[[Dict[str, str]], Any]:
    """
    A generic middleware function (decorator style) that intercepts incoming requests.
    It extracts the Host header, resolves the tenant ID, and attaches it to the
    request context before passing control to the actual request handler.

    Args:
        request_handler (Callable): The function that processes the actual request logic.
                                    It should accept a RequestContext object.

    Returns:
        Callable: A wrapped request handler that includes tenant identification logic.
    """
    @functools.wraps(request_handler)
    def wrapper(headers: Dict[str, str]) -> Any:
        request_context = RequestContext()

        # 1. Extract Host header securely
        host_header = headers.get('Host')
        if not host_header:
            print(f"[{time.time()}] Error: Missing Host header.")
            # In a real app, you might return an HTTP 400 Bad Request here.
            request_context.tenant_id = "ERROR_NO_HOST"
            return request_handler(request_context)
        
        request_context.hostname = host_header
        print(f"[{time.time()}] Middleware: Processing request for Host: {host_header}")

        # 2. Resolve Tenant ID
        tenant_id = resolve_tenant_id(host_header)
        
        if tenant_id:
            request_context.tenant_id = tenant_id
            request_context.is_custom_domain = True
        else:
            # If no tenant ID is found, it's either a platform domain or an unverified/inactive custom domain.
            # You might assign a default tenant ID for platform requests if your system requires it.
            print(f"[{time.time()}] Middleware: No specific tenant ID resolved for {host_header}.")
        
        # 3. Pass control to the actual request handler with the enriched context
        return request_handler(request_context)
    return wrapper


# --- Example Usage with a Simulated Web Request ---

def my_application_request_handler(request_context: RequestContext):
    """
    This simulates your actual application logic that receives the request context.
    """
    print(f"
[{time.time()}] Application Handler: Received request.")
    print(f"  Hostname: {request_context.hostname}")
    print(f"  Is Custom Domain: {request_context.is_custom_domain}")
    if request_context.tenant_id:
        print(f"  Processing for Tenant ID: {request_context.tenant_id}")
        return f"Hello Tenant {request_context.tenant_id} from {request_context.hostname}!"
    else:
        print("  Processing for Platform (or unmapped) request.")
        return f"Hello Platform user from {request_context.hostname}!"


@tenant_middleware
def wrapped_app_handler(request_context: RequestContext):
    """
    This is how your main application handler would be wrapped by the middleware.
    """
    return my_application_request_handler(request_context)


if __name__ == "__main__":
    print("--- Tenant Identification Middleware Demo ---")

    # Simulate incoming requests
    print("
--- Request 1: Custom Domain (Customer One) ---")
    response_1 = wrapped_app_handler({"Host": "app.customer-one.com"})
    print(f"Response: {response_1}")

    print("
--- Request 2: Custom Domain (Customer Two) ---")
    response_2 = wrapped_app_handler({"Host": "app.customer-two.com"})
    print(f"Response: {response_2}")

    print("
--- Request 3: Platform Domain ---")
    response_3 = wrapped_app_handler({"Host": "app.your-platform.com"})
    print(f"Response: {response_3}")

    print("
--- Request 4: Unknown/Unverified Custom Domain ---")
    response_4 = wrapped_app_handler({"Host": "unknown.customer.com"})
    print(f"Response: {response_4}")

    print("
--- Request 5: Malformed Host Header ---")
    response_5 = wrapped_app_handler({"Host": "invalid_domain!@#"})
    print(f"Response: {response_5}")

    print("
--- Request 6: Missing Host Header ---")
    response_6 = wrapped_app_handler({"User-Agent": "test"})
    print(f"Response: {response_6}")

    print("
--- Request 7: Cached Custom Domain (Customer One) ---")
    # This should be a cache hit for app.customer-one.com
    response_7 = wrapped_app_handler({"Host": "app.customer-one.com"})
    print(f"Response: {response_7}")

    print("
--- End of Demo ---")
