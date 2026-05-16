import pandas as pd
import matplotlib.pyplot as plt
import firebase_admin
from firebase_admin import credentials, firestore

# 1. Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# 2. Fetch data from Firebase
print("Fetching sneaker hub events from Firebase...")
docs = db.collection("user_events").stream()

data = []
for doc in docs:
    d = doc.to_dict()
    data.append({
        'user_id': d.get('user_id'),
        'event': d.get('event'),
        'timestamp': d.get('timestamp')
    })

# 3. Create DataFrame
df = pd.DataFrame(data)

# 4. Generate the Business Report
if not df.empty:
    print(f"Success! Found {len(df)} events in your database.")
    
    # Create a bar chart of events
    event_counts = df['event'].value_counts()
    
    plt.figure(figsize=(10, 6))
    event_counts.plot(kind='bar', color='skyblue')
    
    plt.title("A&M Fashion Clothing & Comfort Hub: Analytics Report")
    plt.xlabel("Event Type")
    plt.ylabel("Number of Occurrences")
    plt.xticks(rotation=45)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    print("Opening the visual report...")
    plt.tight_layout()
    plt.show()
else:
    print("No data found in Firebase user_events collection.")