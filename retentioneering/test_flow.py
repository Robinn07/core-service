import requests
import time
import json

# Configuration
INGESTION_URL = "http://localhost:3000"
ANALYTICS_URL = "http://localhost:8080"
API_KEY = "test-api-key"
ORG_ID = "test-org"
CAMPAIGN_ID = "camp-123"

def test_system():
    print("🔐 1. Logging in to Analytics...")
    login_res = requests.post(f"{ANALYTICS_URL}/login", json={"username": "admin", "password": "admin"})
    if login_res.status_code != 200:
        print("❌ Login failed. Is the Analytics API running on 8080?")
        return
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("📡 2. Sending events to Ingestion...")
    events = [
        {"orgId": ORG_ID, "userId": "user_1", "event_type": "email_sent", "channel": "EMAIL", "campaignId": CAMPAIGN_ID},
        {"orgId": ORG_ID, "userId": "user_1", "event_type": "email_opened", "channel": "EMAIL", "campaignId": CAMPAIGN_ID},
        {"orgId": ORG_ID, "userId": "user_1", "event_type": "link_clicked", "channel": "EMAIL", "campaignId": CAMPAIGN_ID},
    ]

    for ev in events:
        res = requests.post(f"{INGESTION_URL}/track-event", json=ev, headers={"X-API-Key": API_KEY})
        print(f"   - Sent {ev['event_type']}: {res.status_code}")

    print("⏳ 3. Waiting 7 seconds for Worker to flush to ClickHouse...")
    time.sleep(7)

    print("📊 4. Fetching Analytics Summary...")
    res = requests.get(f"{ANALYTICS_URL}/analytics/{ORG_ID}/summary/{CAMPAIGN_ID}", headers=headers)
    if res.status_code == 200:
        print("\n✅ Success! Current Stats:")
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"❌ Failed to fetch summary: {res.text}")

if __name__ == "__main__":
    test_system()
