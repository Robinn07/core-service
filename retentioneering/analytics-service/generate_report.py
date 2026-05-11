# generate_report.py
import pandas as pd
import retentioneering
import firebase_admin
from firebase_admin import credentials, firestore
from scipy import stats
import matplotlib.pyplot as plt

# ── Firebase Init ──────────────────────────────────────────────
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ── Fetch Events from Firestore ────────────────────────────────
def fetch_events(org_id: str) -> pd.DataFrame:
    docs = db.collection("organizations").document(org_id).collection("events").stream()
    
    records = []
    for doc in docs:
        data = doc.to_dict()
        records.append({
            "user_id":   data.get("user_id"),
            "event":     data.get("event_type"),   # e.g. "email_opened", "link_clicked"
            "timestamp": data.get("timestamp"),
            "campaign":  data.get("campaign_id"),
            "variant":   data.get("ab_variant"),   # "A" or "B"
            "channel":   data.get("channel"),      # email / sms / whatsapp / push
        })
    
    df = pd.DataFrame(records)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp")
    return df


# ── 1. FUNNEL ANALYSIS (Retentioneering) ──────────────────────
def run_funnel_analysis(df: pd.DataFrame):
    rete = retentioneering.Project(
        df,
        user_col="user_id",
        event_col="event",
        event_time_col="timestamp"
    )
    
    rete.data_processor.step_matrix(
        max_steps=5,
        targets=["link_clicked", "unsubscribed"]
    )
    rete.data_processor.plot()


# ── 2. OPEN & CLICK RATES ─────────────────────────────────────
def run_engagement_rates(df: pd.DataFrame):
    total_sent    = len(df[df["event"] == "email_sent"])
    total_opened  = len(df[df["event"] == "email_opened"])
    total_clicked = len(df[df["event"] == "link_clicked"])

    open_rate  = (total_opened  / total_sent * 100) if total_sent else 0
    click_rate = (total_clicked / total_sent * 100) if total_sent else 0

    print(f"📧 Open Rate:  {open_rate:.2f}%")
    print(f"🖱️  Click Rate: {click_rate:.2f}%")
    return {"open_rate": open_rate, "click_rate": click_rate}


# ── 3. A/B TEST ANALYSIS ──────────────────────────────────────
def run_ab_test(df: pd.DataFrame):
    variant_a = df[df["variant"] == "A"]["event"].apply(lambda x: 1 if x == "link_clicked" else 0)
    variant_b = df[df["variant"] == "B"]["event"].apply(lambda x: 1 if x == "link_clicked" else 0)

    t_stat, p_value = stats.ttest_ind(variant_a, variant_b)

    winner = "A" if variant_a.mean() > variant_b.mean() else "B"
    significant = "✅ Statistically Significant" if p_value < 0.05 else "❌ Not Significant Yet"

    print(f"\n📊 A/B Test Results:")
    print(f"   Variant A CTR: {variant_a.mean()*100:.2f}%")
    print(f"   Variant B CTR: {variant_b.mean()*100:.2f}%")
    print(f"   Winner: Variant {winner} | {significant} (p={p_value:.4f})")


# ── 4. SEGMENTATION ───────────────────────────────────────────
def run_segmentation(df: pd.DataFrame):
    from sklearn.cluster import KMeans

    user_features = df.groupby("user_id").agg(
        total_events=("event", "count"),
        opened=("event", lambda x: (x == "email_opened").sum()),
        clicked=("event", lambda x: (x == "link_clicked").sum()),
    ).fillna(0)

    kmeans = KMeans(n_clusters=3, random_state=42)
    user_features["segment"] = kmeans.fit_predict(user_features)

    segment_labels = {0: "Cold Users", 1: "Engaged Users", 2: "High Intent Users"}
    user_features["segment_label"] = user_features["segment"].map(segment_labels)

    print("\n👥 User Segments:")
    print(user_features["segment_label"].value_counts())
    return user_features


# ── MAIN ──────────────────────────────────────────────────────
if __name__ == "__main__":
    ORG_ID = "A_M_Fashion_Hub"   # swap per client
    df = fetch_events(ORG_ID)

    print(f"✅ Loaded {len(df)} events for {ORG_ID}\n")

    run_engagement_rates(df)
    run_ab_test(df)
    run_segmentation(df)
    run_funnel_analysis(df)  # renders visual chart