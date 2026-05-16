# analytics-service/services/segmentation.py
# Getloopx User Segmentation | K-Means | Memory-efficient for i3

import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


SEGMENT_LABELS = {
    0: "Cold Users",
    1: "Engaged Users",
    2: "High Intent Users",
}

OPEN_EVENTS  = {"email_opened", "whatsapp_read"}
CLICK_EVENTS = {"link_clicked", "push_clicked"}
UNSUB_EVENTS = {"unsubscribed"}


def run_segmentation(df: pd.DataFrame, org_id: str) -> dict:
    """
    K-Means segmentation based on per-user behavior.
    Returns segment summary + per-user labels.
    Memory-efficient: only loads required columns.
    """
    if df.empty:
        return {"error": "No data to segment"}

    work_df = df[["user_id", "event"]].copy()
    work_df["user_id"] = work_df["user_id"].astype(str)
    work_df["event"]   = work_df["event"].astype(str)

    # ── Build user feature matrix ───────────────────────────────
    features = work_df.groupby("user_id").agg(
        total_events = ("event", "count"),
        opened       = ("event", lambda x: x.isin(OPEN_EVENTS).sum()),
        clicked      = ("event", lambda x: x.isin(CLICK_EVENTS).sum()),
        unsubscribed = ("event", lambda x: x.isin(UNSUB_EVENTS).sum()),
    ).reset_index()

    if len(features) < 3:
        return {
            "error": f"Need at least 3 users to segment, found {len(features)}",
            "org_id": org_id
        }

    # ── Scale + Cluster ─────────────────────────────────────────
    X = features[["total_events", "opened", "clicked", "unsubscribed"]].values
    X_scaled = StandardScaler().fit_transform(X)

    n_clusters = min(3, len(features))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    features["segment"]       = kmeans.fit_predict(X_scaled)
    features["segment_label"] = features["segment"].map(SEGMENT_LABELS)

    # ── Summary per segment ─────────────────────────────────────
    summary = (
        features.groupby("segment_label")
        .agg(
            user_count  = ("user_id",  "count"),
            avg_opens   = ("opened",   "mean"),
            avg_clicks  = ("clicked",  "mean"),
        )
        .round(2)
        .to_dict(orient="index")
    )

    return {
        "org_id":    org_id,
        "total_users": len(features),
        "segments":  summary,
        "per_user":  features[["user_id", "segment_label"]].to_dict(orient="records"),
        "status":    "success"
    }
