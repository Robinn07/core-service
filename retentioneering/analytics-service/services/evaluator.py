# analytics-service/services/evaluator.py
import pandas as pd
from services.path_discovery import discover_toxic_paths

def check_user_for_toxic_path(ch_client, org_id: str, user_id: str) -> dict:
    """
    Checks if the user's recent event sequence matches any discovered toxic paths.
    """
    # 1. Fetch user's recent history from ClickHouse
    query = """
    SELECT event_type as event FROM events 
    WHERE org_id = {org:String} AND user_id = {user:String}
    ORDER BY timestamp DESC LIMIT 5
    """
    result = ch_client.query(query, parameters={'org': org_id, 'user': user_id})
    user_events = [row[0] for row in result.result_rows][::-1] # Reverse to get chronological order
    
    if not user_events:
        return {"match": False}

    # 2. Get discovered toxic paths for this org
    # (In production, these should be cached)
    query_events = """
    SELECT user_id, event_type as event, timestamp, channel, campaign_id, ab_variant
    FROM events WHERE org_id = {org:String} ORDER BY timestamp ASC
    """
    df = ch_client.query_df(query_events, parameters={'org': org_id})
    if df.empty: return {"match": False}
    
    discovery_result = discover_toxic_paths(df, org_id)
    toxic_paths = discovery_result.get("toxic_paths", [])

    # 3. Match user sequence against toxic paths
    # Simple matching: Does the user's last event match the 'event_pattern' of a toxic path?
    last_event = user_events[-1]
    for path in toxic_paths:
        if last_event in path["event_pattern"]:
            return {
                "match": True,
                "path_id": path["path_id"],
                "description": path["description"]
            }

    return {"match": False}
