
import uuid
import secrets
import dns.resolver
import dns.exception
import asyncio
from datetime import datetime, timezone

# --- Configuration ---
# Replace with your actual platform's CNAME target.
# This is the domain your tenants' custom domains will CNAME to.
PLATFORM_CNAME_TARGET = "your-platform-app.getloopx.com"

# Interval for polling domain verifications (in seconds)
POLLING_INTERVAL_SECONDS = 300  # Poll every 5 minutes

# Maximum number of retries for DNS queries during verification
MAX_DNS_RETRIES = 3
DNS_RETRY_DELAY_SECONDS = 10

# --- Database Simulation (Replace with actual ORM/DB client) ---
# In a real application, these functions would interact with your database
# (e.g., using SQLAlchemy, Django ORM, raw SQL queries).

# A simple in-memory store to simulate the database table `custom_domains`
# In a production environment, this would be a persistent database.
_CUSTOM_DOMAINS_DB = {}

def get_pending_domains_from_db():
    """
    Simulates fetching domains with 'PENDING' status from the database.
    In a real application, this would query your custom_domains table.
    """
    pending_domains = [
        domain_data for domain_data in _CUSTOM_DOMAINS_DB.values()
        if domain_data['verification_status'] == 'PENDING'
    ]
    return pending_domains

def update_domain_verification_status(domain_id, status, last_verified_at=None, is_active=False):
    """
    Simulates updating a domain's verification status in the database.
    In a real application, this would update your custom_domains table.
    """
    if domain_id in _CUSTOM_DOMAINS_DB:
        _CUSTOM_DOMAINS_DB[domain_id]['verification_status'] = status
        _CUSTOM_DOMAINS_DB[domain_id]['updated_at'] = datetime.now(timezone.utc)
        if last_verified_at:
            _CUSTOM_DOMAINS_DB[domain_id]['last_verified_at'] = last_verified_at
        _CUSTOM_DOMAINS_DB[domain_id]['is_active'] = is_active
        print(f"[{datetime.now().isoformat()}] DB Update: Domain {domain_id} status set to {status}, active={is_active}")
        return True
    return False

def get_domain_by_name_from_db(domain_name):
    """
    Simulates fetching a domain by name from the database.
    Used for the /verify-domain endpoint to get current status.
    """
    for domain_id, domain_data in _CUSTOM_DOMAINS_DB.items():
        if domain_data['domain_name'] == domain_name:
            return domain_data
    return None

def add_custom_domain_to_db(tenant_id, domain_name, txt_record_value, cname_target):
    """
    Simulates adding a new custom domain entry to the database.
    """
    domain_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    _CUSTOM_DOMAINS_DB[domain_id] = {
        'id': domain_id,
        'tenant_id': tenant_id,
        'domain_name': domain_name,
        'txt_record_value': txt_record_value,
        'cname_target': cname_target,
        'verification_status': 'PENDING',
        'last_verified_at': None,
        'is_active': False,
        'created_at': now,
        'updated_at': now,
    }
    print(f"[{datetime.now().isoformat()}] DB Add: Added domain {domain_name} for tenant {tenant_id}")
    return _CUSTOM_DOMAINS_DB[domain_id]


# --- TXT Token Generation ---
def generate_txt_token(length=32):
    """
    Generates a unique, cryptographically secure random string for TXT record verification.
    This token serves as a proof of domain ownership.

    Args:
        length (int): The desired length of the token.

    Returns:
        str: A hexadecimal string representing the unique TXT token.
    """
    return secrets.token_hex(length // 2) # Each byte becomes two hex characters


# --- DNS Verification Logic ---
async def verify_domain_dns(domain_name: str, expected_txt_value: str, expected_cname_target: str) -> dict:
    """
    Performs DNS lookups to verify both TXT record ownership and CNAME alignment.

    Args:
        domain_name (str): The custom domain to verify.
        expected_txt_value (str): The unique token expected in the TXT record.
        expected_cname_target (str): The expected CNAME target (your platform's domain).

    Returns:
        dict: A dictionary containing verification results:
              - 'txt_verified' (bool): True if TXT record matches, False otherwise.
              - 'cname_verified' (bool): True if CNAME record points to target, False otherwise.
              - 'error' (str or None): Error message if any exception occurred.
    """
    results = {
        'txt_verified': False,
        'cname_verified': False,
        'error': None,
        'details': []
    }

    print(f"[{datetime.now().isoformat()}] Verifying DNS for: {domain_name}")

    # Initialize DNS resolver
    resolver = dns.resolver.Resolver()
    resolver.timeout = 5  # 5 seconds timeout for each query
    resolver.lifetime = 10 # 10 seconds lifetime for all queries

    # 1. TXT Record Verification
    txt_found = False
    for attempt in range(MAX_DNS_RETRIES):
        try:
            txt_records = resolver.resolve(domain_name, 'TXT')
            for rdata in txt_records:
                for txt_string in rdata.strings:
                    decoded_txt = txt_string.decode('utf-8')
                    # Check for exact match or a specific prefix if your system uses one
                    if expected_txt_value in decoded_txt:
                        txt_found = True
                        break
                if txt_found:
                    break
            if txt_found:
                results['txt_verified'] = True
                results['details'].append(f"TXT record found and matches expected value: {expected_txt_value}")
                break
        except dns.resolver.NoAnswer:
            results['details'].append(f"TXT record not found for {domain_name} (Attempt {attempt + 1}/{MAX_DNS_RETRIES})")
        except dns.resolver.NXDOMAIN:
            results['error'] = f"Domain {domain_name} does not exist (NXDOMAIN)."
            results['details'].append(results['error'])
            break
        except dns.exception.Timeout:
            results['details'].append(f"DNS query for TXT timed out for {domain_name} (Attempt {attempt + 1}/{MAX_DNS_RETRIES})")
        except Exception as e:
            results['error'] = f"Error querying TXT record for {domain_name}: {e}"
            results['details'].append(results['error'])
            break
        await asyncio.sleep(DNS_RETRY_DELAY_SECONDS) # Wait before retrying

    if not txt_found and not results['error']:
        results['details'].append(f"TXT record with value '{expected_txt_value}' not found after {MAX_DNS_RETRIES} attempts.")

    # 2. CNAME Record Verification (only if TXT is verified or if we still want to check CNAME independently)
    cname_found = False
    if results['error'] is None: # Only proceed if no fundamental domain error
        for attempt in range(MAX_DNS_RETRIES):
            try:
                # Check CNAME for the root domain (or www subdomain)
                cname_records = resolver.resolve(domain_name, 'CNAME')
                for rdata in cname_records:
                    # Compare the target with our platform's expected CNAME target
                    if str(rdata.target).lower().rstrip('.') == expected_cname_target.lower().rstrip('.'):
                        cname_found = True
                        break
                if cname_found:
                    results['cname_verified'] = True
                    results['details'].append(f"CNAME record found and points to target: {expected_cname_target}")
                    break
            except dns.resolver.NoAnswer:
                results['details'].append(f"CNAME record not found for {domain_name} (Attempt {attempt + 1}/{MAX_DNS_RETRIES})")
            except dns.resolver.NXDOMAIN:
                # This case should ideally be caught by TXT verification, but good to have
                results['error'] = f"Domain {domain_name} does not exist (NXDOMAIN)."
                results['details'].append(results['error'])
                break
            except dns.resolver.NoCNAME:
                # A records might exist but no CNAME
                results['details'].append(f"No CNAME record found for {domain_name}, but A/AAAA records might exist. (Attempt {attempt + 1}/{MAX_DNS_RETRIES})")
            except dns.exception.Timeout:
                results['details'].append(f"DNS query for CNAME timed out for {domain_name} (Attempt {attempt + 1}/{MAX_DNS_RETRIES})")
            except Exception as e:
                results['error'] = f"Error querying CNAME record for {domain_name}: {e}"
                results['details'].append(results['error'])
                break
            await asyncio.sleep(DNS_RETRY_DELAY_SECONDS) # Wait before retrying

        if not cname_found and not results['error']:
            results['details'].append(f"CNAME record pointing to '{expected_cname_target}' not found after {MAX_DNS_RETRIES} attempts.")

    print(f"[{datetime.now().isoformat()}] Verification results for {domain_name}: TXT={results['txt_verified']}, CNAME={results['cname_verified']}, Error={results['error']}")
    return results


# --- Asynchronous Polling Routine ---
async def poll_domain_verification():
    """
    An asynchronous routine that periodically checks for pending custom domain
    verifications. It fetches domains from the database, performs DNS lookups,
    and updates their status.
    """
    print(f"[{datetime.now().isoformat()}] Starting custom domain verification poller...")
    while True:
        try:
            pending_domains = get_pending_domains_from_db()
            print(f"[{datetime.now().isoformat()}] Found {len(pending_domains)} pending domains to verify.")

            for domain_entry in pending_domains:
                domain_id = domain_entry['id']
                domain_name = domain_entry['domain_name']
                expected_txt = domain_entry['txt_record_value']
                expected_cname = PLATFORM_CNAME_TARGET # Using the configured platform CNAME target

                print(f"[{datetime.now().isoformat()}] Processing domain {domain_name} (ID: {domain_id})...")

                verification_results = await verify_domain_dns(
                    domain_name,
                    expected_txt,
                    expected_cname
                )

                if verification_results['txt_verified'] and verification_results['cname_verified']:
                    update_domain_verification_status(domain_id, 'VERIFIED', datetime.now(timezone.utc), is_active=True)
                    print(f"[{datetime.now().isoformat()}] Domain {domain_name} successfully VERIFIED and ACTIVATED.")
                else:
                    status = 'FAILED'
                    if verification_results['error']:
                        status = 'ERROR' # DNS resolution error
                    
                    # Log details for failed/error status
                    print(f"[{datetime.now().isoformat()}] Domain {domain_name} verification {status}. Details: {verification_results['details']}")
                    update_domain_verification_status(domain_id, status, is_active=False)

        except Exception as e:
            print(f"[{datetime.now().isoformat()}] An unexpected error occurred in the polling routine: {e}")

        await asyncio.sleep(POLLING_INTERVAL_SECONDS)

# --- API Endpoint Simulation (Example of how to expose verification) ---
# In a real web application (e.g., FastAPI, Flask, Django), you would expose
# endpoints for tenants to initiate domain addition and check status.

async def register_custom_domain_endpoint(tenant_id: str, domain_name: str):
    """
    Simulates an API endpoint for a tenant to register a new custom domain.
    This would typically be called from your frontend/tenant-facing application.
    """
    # Basic validation: Check if domain_name is already registered
    existing_domain = get_domain_by_name_from_db(domain_name)
    if existing_domain:
        return {"status": "error", "message": "Domain already registered.", "domain": existing_domain}

    # Generate token and add to DB
    txt_token = generate_txt_token()
    new_domain_entry = add_custom_domain_to_db(tenant_id, domain_name, txt_token, PLATFORM_CNAME_TARGET)
    
    return {
        "status": "success",
        "message": "Domain registered for verification.",
        "domain": {
            "id": new_domain_entry['id'],
            "domain_name": new_domain_entry['domain_name'],
            "txt_record_value": new_domain_entry['txt_record_value'],
            "cname_target": new_domain_entry['cname_target'],
            "verification_status": new_domain_entry['verification_status']
        }
    }

async def check_domain_status_endpoint(domain_name: str):
    """
    Simulates an API endpoint for a tenant to check the status of their
    custom domain verification.
    """
    domain_data = get_domain_by_name_from_db(domain_name)
    if domain_data:
        return {
            "status": "success",
            "domain": {
                "id": domain_data['id'],
                "domain_name": domain_data['domain_name'],
                "txt_record_value": domain_data['txt_record_value'],
                "cname_target": domain_data['cname_target'],
                "verification_status": domain_data['verification_status'],
                "is_active": domain_data['is_active'],
                "last_verified_at": domain_data['last_verified_at'].isoformat() if domain_data['last_verified_at'] else None
            }
        }
    return {"status": "error", "message": "Domain not found."}


# --- Main execution for testing/demonstration ---
async def main():
    print("--- Custom Domain Verification Engine Demo ---")

    # Example: Register a new custom domain
    tenant_id_1 = str(uuid.uuid4())
    domain_to_verify_1 = "example.getloopx-customer.com"
    print(f"Tenant {tenant_id_1} is registering domain: {domain_to_verify_1}")
    registration_result_1 = await register_custom_domain_endpoint(tenant_id_1, domain_to_verify_1)
    print("Registration Result 1:", registration_result_1)

    # Example: Another domain, assumed to fail CNAME (since it's not a real CNAME to platform)
    tenant_id_2 = str(uuid.uuid4())
    domain_to_verify_2 = "test.another-customer.com"
    print(f"Tenant {tenant_id_2} is registering domain: {domain_to_verify_2}")
    registration_result_2 = await register_custom_domain_endpoint(tenant_id_2, domain_to_verify_2)
    print("Registration Result 2:", registration_result_2)

    # Start the polling routine in the background
    # In a real app, this would run as a separate worker process or a scheduled task.
    # For demo purposes, we'll run it once for immediate feedback.
    print(f"\nRunning domain verification poller once...")
    await poll_domain_verification() # Run once for immediate effect in demo

    print(f"\nChecking status of {domain_to_verify_1} after polling:")
    status_1 = await check_domain_status_endpoint(domain_to_verify_1)
    print(status_1)

    print(f"\nChecking status of {domain_to_verify_2} after polling:")
    status_2 = await check_domain_status_endpoint(domain_to_verify_2)
    print(status_2)

    print("\n--- End of Demo ---")

if __name__ == "__main__":
    # To run this script, you'll need the 'dnspython' library:
    # pip install dnspython
    asyncio.run(main())
