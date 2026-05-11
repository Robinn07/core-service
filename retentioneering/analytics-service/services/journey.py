# analytics-service/services/journey.py
import pandas as pd
from retentioneering.eventstream import Eventstream, RawDataSchema

def run_journey_mapping(df: pd.DataFrame, org_id: str) -> dict:
    if df.empty:
        return {"error": "No events found"}

    # Prep dataframe
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

    # Generate Step Matrix
    sm = stream.step_matrix(max_steps=5)
    sm.fit()
    matrix_df = sm.values

    # Identify Drop-offs
    # Calculation: (Users at step N) - (Users at step N+1)
    # We look for the largest drops across all event types at each step transition
    drop_offs = []
    
    # matrix_df usually has events as index and steps as columns (1, 2, 3...)
    # We want to find which event sequence has the highest churn
    steps = matrix_df.columns.tolist()
    for i in range(len(steps) - 1):
        step_n = steps[i]
        step_n_plus_1 = steps[i+1]
        
        for event in matrix_df.index:
            count_n = matrix_df.loc[event, step_n]
            count_n1 = matrix_df.loc[event, step_n_plus_1]
            drop = count_n - count_n1
            if drop > 0:
                drop_offs.append({
                    "event": event,
                    "from_step": step_n,
                    "to_step": step_n_plus_1,
                    "drop_count": int(drop),
                    "drop_pct": round((drop / count_n * 100), 2) if count_n > 0 else 0
                })

    # Sort by drop count and take top 3
    top_drop_offs = sorted(drop_offs, key=lambda x: x['drop_count'], reverse=True)[:3]

    return {
        "org_id": org_id,
        "step_matrix": matrix_df.to_dict(),
        "top_drop_offs": top_drop_offs
    }
