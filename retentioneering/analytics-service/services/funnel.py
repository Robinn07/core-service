# analytics-service/services/funnel.py
# Getloopx | Retentioneering v3.3.0 | Eventstream API
# Memory-efficient for i3 hardware

import pandas as pd
from retentioneering.eventstream import Eventstream, RawDataSchema


def run_funnel(df: pd.DataFrame, org_id: str) -> dict:
    """
    Runs Retentioneering v3.x step matrix on event data.
    Uses Eventstream + RawDataSchema (NOT retentioneering.Project).
    Memory-efficient: uses categorical dtypes.
    """
    if df.empty:
        return {"error": f"No events found for org: {org_id}"}

    # ── Prepare dataframe ───────────────────────────────────────
    required = {"user_id", "event", "timestamp"}
    if not required.issubset(df.columns):
        return {"error": f"Missing columns. Need: {required}, got: {list(df.columns)}"}

    work_df = df[["user_id", "event", "timestamp"]].copy()

    # Convert categories back to strings for Retentioneering
    work_df["user_id"]    = work_df["user_id"].astype(str)
    work_df["event"]      = work_df["event"].astype(str)
    work_df["timestamp"]  = pd.to_datetime(work_df["timestamp"])
    work_df = work_df.sort_values("timestamp").reset_index(drop=True)

    try:
        # ── Retentioneering v3.x API ────────────────────────────
        stream = Eventstream(
            raw_data=work_df,
            raw_data_schema=RawDataSchema(
                event_name="event",
                event_timestamp="timestamp",
                user_id="user_id"
            )
        )

        # ── Step Matrix ─────────────────────────────────────────
        step_matrix = stream.step_matrix(max_steps=5)
        step_matrix.fit()
        result = step_matrix.values

        # ── Event frequency stats ────────────────────────────────
        event_counts = work_df["event"].value_counts().to_dict()

        return {
            "org_id":       org_id,
            "total_users":  work_df["user_id"].nunique(),
            "total_events": len(work_df),
            "event_counts": event_counts,
            "step_matrix":  result.to_dict() if hasattr(result, "to_dict") else str(result),
            "status":       "success"
        }

    except Exception as e:
        return {
            "org_id":       org_id,
            "total_users":  work_df["user_id"].nunique(),
            "total_events": len(work_df),
            "event_counts": work_df["event"].value_counts().to_dict(),
            "error":        str(e),
            "status":       "partial"
        }
