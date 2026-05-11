import pandas as pd
from retentioneering.eventstream import Eventstream, RawDataSchema

def run_sankey_data(df: pd.DataFrame, org_id: str) -> dict:
    """
    Prepares data for a Sankey diagram visualization.
    Calculates transitions between events.
    """
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

    # Retentioneering doesn't have a direct 'to_sankey_json' in v3.x, 
    # but we can build it from the transition matrix.
    
    # Get transitions
    transitions = stream.transition_matrix()
    matrix = transitions.values
    
    nodes = [{"name": str(event)} for event in transitions.index]
    links = []
    
    event_list = transitions.index.tolist()
    for i, source_event in enumerate(event_list):
        for j, target_event in enumerate(event_list):
            value = matrix[i][j]
            if value > 0:
                links.append({
                    "source": i,
                    "target": j,
                    "value": float(value)
                })

    return {
        "org_id": org_id,
        "nodes": nodes,
        "links": links
    }
