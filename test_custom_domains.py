
import asyncio
import uuid
from datetime import datetime, timezone
from verification_engine import (
    register_custom_domain_endpoint, 
    poll_domain_verification, 
    check_domain_status_endpoint,
    _CUSTOM_DOMAINS_DB
)
import verification_engine

# Set polling interval to 0 for immediate return in test
verification_engine.POLLING_INTERVAL_SECONDS = 0

async def test_workflow():
    print("--- Testing Custom Domain Workflow ---")
    
    tenant_id = str(uuid.uuid4())
    domain_name = "example.com" # This will likely fail DNS check unless we mock DNS
    
    print(f"\n1. Registering domain: {domain_name}")
    reg_res = await register_custom_domain_endpoint(tenant_id, domain_name)
    print("Result:", reg_res)
    
    print("\n2. Running verification (one iteration)...")
    # We need to monkeypatch poll_domain_verification to run once
    # or just manually do what it does.
    
    pending_domains = verification_engine.get_pending_domains_from_db()
    for domain_entry in pending_domains:
        domain_id = domain_entry['id']
        # Mocking the DNS check to succeed for 'verified.com'
        if domain_entry['domain_name'] == 'verified.com':
            verification_results = {'txt_verified': True, 'cname_verified': True, 'error': None, 'details': []}
        else:
            verification_results = await verification_engine.verify_domain_dns(
                domain_entry['domain_name'],
                domain_entry['txt_record_value'],
                verification_engine.PLATFORM_CNAME_TARGET
            )
            
        if verification_results['txt_verified'] and verification_results['cname_verified']:
            verification_engine.update_domain_verification_status(domain_id, 'VERIFIED', datetime.now(timezone.utc), is_active=True)
        else:
            verification_engine.update_domain_verification_status(domain_id, 'FAILED', is_active=False)

    print("\n3. Checking status of example.com")
    status = await check_domain_status_endpoint(domain_name)
    print("Status:", status)
    
    print("\n4. Testing a domain that should pass (mocked)")
    await register_custom_domain_endpoint(tenant_id, "verified.com")
    # Re-run verification logic
    pending_domains = verification_engine.get_pending_domains_from_db()
    for domain_entry in pending_domains:
        if domain_entry['domain_name'] == 'verified.com':
            verification_engine.update_domain_verification_status(domain_entry['id'], 'VERIFIED', datetime.now(timezone.utc), is_active=True)
            
    status_verified = await check_domain_status_endpoint("verified.com")
    print("Status (verified.com):", status_verified)

if __name__ == "__main__":
    asyncio.run(test_workflow())
