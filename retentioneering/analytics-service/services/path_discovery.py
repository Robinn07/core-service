# analytics-service/services/path_discovery.py
import pandas as pd
import numpy as np
from retentioneering.eventstream import Eventstream, RawDataSchema

def discover_toxic_paths(df: pd.DataFrame, org_id: str, threshold: float = 0.5) -> dict:
    """
    Identifies event sequences (paths) that have a high drop-off rate.
    threshold: Minimum drop-off percentage to consider a path 'toxic'.
    """
    assert org_id is not None, "org_id required for all analytics queries"
    if df.empty:
        return {"error": "No events found"}

    # Prep dataframe for Retentioneering
    work_df = df[["user_id", "event", "timestamp"]].copy()
    work_df["user_id"] = work_df["user_id"].astype(str)
    work_df["event"] = work_df["event"].astype(str)
    work_df["timestamp"] = pd.to_datetime(work_df["timestamp"])
    
    stream = Eventstream(
        raw_data=work_df,
        raw_data_schema=RawDataSchema(
            event_name="event",
            event_timestamp="timestamp",
            user_id="user_id"
        )
    )

    # Use Step Matrix to find where users drop off at specific steps
    sm = stream.step_matrix(max_steps=5)
    sm.fit()
    matrix_df = sm.values

    toxic_paths = []
    steps = matrix_df.columns.tolist()
    
    # We iterate through steps to find significant drops
    for i in range(len(steps) - 1):
        step_n = steps[i]
        step_n_plus_1 = steps[i+1]
        
        for event in matrix_df.index:
            count_n = matrix_df.loc[event, step_n]
            count_n1 = matrix_df.loc[event, step_n_plus_1]
            
            if count_n > 0:
                drop_pct = (count_n - count_n1) / count_n
                if drop_pct >= threshold:
                    toxic_paths.append({
                        "path_id": f"toxic_{event}_{step_n}",
                        "event_pattern": [event], # In a real implementation, we'd extract the full preceding sequence
                        "step": step_n,
                        "drop_off_rate": round(drop_pct * 100, 2),
                        "affected_users": int(count_n - count_n1),
                        "description": f"High drop-off after '{event}' at step {step_n}"
                    })

    # Sort by impact (number of affected users)
    toxic_paths = sorted(toxic_paths, key=lambda x: x['affected_users'], reverse=True)

    return {
        "org_id": org_id,
        "toxic_paths": toxic_paths[:5] # Top 5 toxic paths
    }
