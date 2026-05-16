# analytics-service/services/retention.py
# Getloopx | Retentioneering v3.3.0 | Cohort Analysis

import pandas as pd
from retentioneering.eventstream import Eventstream, RawDataSchema


def run_retention_analysis(df: pd.DataFrame, org_id: str) -> dict:
    """
    Runs Retentioneering v3.x cohort analysis on event data.
    """
    if df.empty:
        return {"error": f"No events found for org: {org_id}"}

    # ── Prepare dataframe ───────────────────────────────────────
    required = {"user_id", "event", "timestamp"}
    if not required.issubset(df.columns):
        return {"error": f"Missing columns. Need: {required}, got: {list(df.columns)}"}

    work_df = df[["user_id", "event", "timestamp"]].copy()
    work_df["user_id"]    = work_df["user_id"].astype(str)
    work_df["event"]      = work_df["event"].astype(str)
    work_df["timestamp"]  = pd.to_datetime(work_df["timestamp"]).dt.tz_localize(None)
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

        # ── Cohort Analysis ─────────────────────────────────────
        # Calculate daily retention for the last 30 days
        cohorts = stream.cohorts(cohort_start_unit='D', cohort_period=(30, 'D'))
        result = cohorts.values

        # Convert index (Period) to string for JSON serialization
        if hasattr(result, "index"):
            result.index = result.index.map(str)

        return {
            "org_id":       org_id,
            "total_users":  work_df["user_id"].nunique(),
            "total_events": len(work_df),
            "retention_matrix": result.to_dict() if hasattr(result, "to_dict") else str(result),
            "status":       "success"
        }

    except Exception as e:
        return {
            "org_id":       org_id,
            "total_users":  work_df["user_id"].nunique(),
            "error":        str(e),
            "status":       "partial"
        }
