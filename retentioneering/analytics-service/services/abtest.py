# analytics-service/services/abtest.py
# Getloopx Multi-Tenant A/B Test Engine | Bayesian A/B Testing

import pandas as pd
import numpy as np
from scipy.stats import beta

SENT_EVENTS = {
    "email_sent", "sms_sent", "whatsapp_sent", "push_sent"
}

def calculate_bayesian_stats(sent_a, clicked_a, sent_b, clicked_b, samples=100000):
    """
    Uses Monte Carlo simulation to calculate Bayesian A/B stats.
    Assumes Beta(1,1) prior (uniform).
    """
    # Alpha = successes + 1, Beta = failures + 1
    a_samples = np.random.beta(clicked_a + 1, (sent_a - clicked_a) + 1, samples)
    b_samples = np.random.beta(clicked_b + 1, (sent_b - clicked_b) + 1, samples)

    # Probability that B is better than A
    prob_b_beats_a = np.mean(b_samples > a_samples)

    # Expected uplift
    uplift = (b_samples - a_samples) / a_samples
    expected_uplift = np.mean(uplift)

    return float(prob_b_beats_a), float(expected_uplift)

def run_ab_test(df: pd.DataFrame, org_id: str, campaign_id: str) -> dict:

    # Convert all categoricals to str FIRST
    for col in ["campaign_id", "ab_variant", "event", "channel"]:
        if col in df.columns:
            df[col] = df[col].astype(str)

    # Filter to campaign
    if "campaign_id" in df.columns:
        camp_df = df[df["campaign_id"] == campaign_id].copy()
    else:
        camp_df = df.copy()

    if camp_df.empty:
        return {"error": f"No data found for campaign: {campaign_id}"}

    if "ab_variant" not in camp_df.columns:
        return {"error": "No ab_variant column found"}

    has_variants = camp_df["ab_variant"].isin(["A", "B"]).any()
    if not has_variants:
        return {"error": "No A/B variant data found — all events have null variant"}

    def get_stats(variant: str) -> dict:
        v = camp_df[camp_df["ab_variant"] == variant]
        # Convert to int to avoid numpy int64 serialization issues
        sent    = int(len(v[v["event"].isin(SENT_EVENTS)]))
        clicked = int(len(v[v["event"] == "link_clicked"]))
        opened  = int(len(v[v["event"].isin(["email_opened", "whatsapp_read"])]))
        ctr     = round(clicked / sent * 100, 2) if sent > 0 else 0.0
        open_r  = round(opened  / sent * 100, 2) if sent > 0 else 0.0
        return {"sent": sent, "clicked": clicked, "opened": opened, "ctr": ctr, "open_rate": open_r}

    a = get_stats("A")
    b = get_stats("B")

    if a["sent"] < 10 or b["sent"] < 10:
        return {
            "org_id": org_id, "campaign_id": campaign_id,
            "variant_a": a, "variant_b": b,
            "error": "Insufficient data — need at least 10 sent events per variant"
        }

    # Calculate Bayesian Probability
    prob_b_beats_a, expected_uplift = calculate_bayesian_stats(
        a["sent"], a["clicked"], b["sent"], b["clicked"]
    )

    winner = "B" if prob_b_beats_a > 0.5 else "A"
    confidence = prob_b_beats_a if winner == "B" else (1 - prob_b_beats_a)
    significant = confidence > 0.95

    return {
        "org_id":      org_id,
        "campaign_id": campaign_id,
        "variant_a":   a,
        "variant_b":   b,
        "winner":      winner,
        "prob_b_beats_a": round(prob_b_beats_a * 100, 2),
        "expected_uplift": round(expected_uplift * 100, 2),
        "confidence":  f"{round(confidence * 100, 1)}%",
        "significant": significant,
        "conclusion": (
            f"Variant {winner} wins with {round(confidence * 100, 1)}% probability"
            if significant else
            f"Variant {winner} is leading but collect more data ({round(confidence * 100, 1)}% probability)"
        ),
        "status": "success",
        "engine": "Bayesian Monte Carlo"
    }