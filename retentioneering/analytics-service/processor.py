import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from retentioneering.eventstream import Eventstream, RawDataSchema
from IPython.core.display import HTML
import os

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def generate_retention_report():
    print("Fetching data from Firebase...")

    docs = db.collection("user_events").stream()

    events_list = []
    for doc in docs:
        data = doc.to_dict()
        ts = data.get("timestamp")
        events_list.append({
            "user_id": data.get("user_id"),
            "event": data.get("event"),
            "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S") if ts else None
        })

    if not events_list:
        print("No data found in Firebase. Log some events first!")
        return

    print(f"Fetched {len(events_list)} events from Firebase.")

    df = pd.DataFrame(events_list)

    # Drop rows where timestamp or user_id is missing
    df.dropna(subset=["user_id", "event", "timestamp"], inplace=True)

    if df.empty:
        print("All rows had missing data. Check your Firebase documents.")
        return

    print(f"Building Eventstream from {len(df)} valid events...")

    stream = Eventstream(
        raw_data=df,
        raw_data_schema=RawDataSchema(
            event_name="event",
            event_timestamp="timestamp",
            user_id="user_id"
        )
    )

    if not os.path.exists("reports"):
        os.makedirs("reports")

    print("Generating Transition Graph...")

    try:
        tg = stream.transition_graph()
        result = tg.plot()

        # Method 1: Result is an IPython HTML object
        if isinstance(result, HTML):
            with open("reports/user_journey.html", "w", encoding="utf-8") as f:
                f.write(result.data)
            print("SUCCESS: Report saved to reports/user_journey.html")

        # Method 2: Result is a plain string
        elif isinstance(result, str):
            with open("reports/user_journey.html", "w", encoding="utf-8") as f:
                f.write(result)
            print("SUCCESS: Report saved to reports/user_journey.html")

        # Method 3: Try internal _render method
        else:
            print(f"plot() returned: {type(result)} — trying _render()...")
            html_content = tg._render()
            with open("reports/user_journey.html", "w", encoding="utf-8") as f:
                f.write(html_content)
            print("SUCCESS: Report saved to reports/user_journey.html")

    except Exception as e:
        print(f"ERROR generating graph: {e}")
        print("Saving raw event data as CSV fallback...")
        df.to_csv("reports/raw_events.csv", index=False)
        print("Fallback saved to reports/raw_events.csv")

if __name__ == "__main__":
    generate_retention_report()