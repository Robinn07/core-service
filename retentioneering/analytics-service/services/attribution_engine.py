# analytics-service/services/attribution_engine.py
import pandas as pd
import json

def calculate_adaptive_window(ch_client, org_id: str, target_event: str, fallback_hours: int = 48) -> int:
    """
    Calculates the 80th percentile of conversion time (in hours) between click and target_event
    for historical data in the org. If insufficient data, returns the provided fallback.
    """
    query = """
    WITH click_events AS (
        SELECT user_id, timestamp as click_time
        FROM events
        WHERE org_id = {org:String} AND event_type = 'link_clicked'
    ),
    target_events AS (
        SELECT user_id, timestamp as target_time
        FROM events
        WHERE org_id = {org:String} AND event_type = {target:String}
    )
    SELECT quantile(0.8)(dateDiff('hour', click_time, target_time)) as adaptive_window
    FROM click_events c
    JOIN target_events t ON c.user_id = t.user_id
    WHERE t.target_time > c.click_time
    """
    try:
        df = ch_client.query_df(query, parameters={'org': org_id, 'target': target_event})
        
        if df.empty or pd.isna(df.iloc[0]['adaptive_window']):
            return fallback_hours
            
        window = int(df.iloc[0]['adaptive_window'])
        return max(1, min(720, window))
    except Exception as e:
        return fallback_hours

def calculate_campaign_impact(ch_client, org_id: str, campaign_id: str, target_event: str, window_hours: int = 0, fallback_hours: int = 48) -> dict:
    """
    Calculates the 'Success Rate' of a campaign by tracking users who clicked an email
    and then performed a specific product action within the attribution window.
    Uses ClickHouse native ASOF joins for performance.
    """
    is_adaptive = False
    if window_hours is None or window_hours <= 0:
        window_hours = calculate_adaptive_window(ch_client, org_id, target_event, fallback_hours)
        is_adaptive = True

    # ClickHouse-Native Attribution logic
    # We find first click per user for this campaign, then check if target_event happened within the window
    query = """
    WITH clicks AS (
        SELECT user_id, min(timestamp) as click_time
        FROM events 
        WHERE org_id = {org:String} 
          AND campaign_id = {camp:String} 
          AND event_type = 'link_clicked'
          AND JSONExtractBool(metadata, 'is_bot') = false
        GROUP BY user_id
    ),
    conversions AS (
        SELECT c.user_id
        FROM clicks c
        JOIN events e ON c.user_id = e.user_id
        WHERE e.org_id = {org:String}
          AND e.event_type = {target:String}
          AND e.timestamp > c.click_time
          AND e.timestamp <= c.click_time + INTERVAL {window:Int32} HOUR
        GROUP BY c.user_id
    )
    SELECT 
        (SELECT count(*) FROM clicks) as total_clicks,
        (SELECT count(*) FROM conversions) as successful_conversions
    """
    
    try:
        df = ch_client.query_df(query, parameters={
            'org': org_id, 
            'camp': campaign_id, 
            'target': target_event, 
            'window': window_hours
        })
        
        total_clicks = 0
        successful_conversions = 0
        
        if not df.empty:
            total_clicks = int(df.iloc[0]['total_clicks'])
            successful_conversions = int(df.iloc[0]['successful_conversions'])

        activation_rate = round((successful_conversions / total_clicks * 100), 2) if total_clicks > 0 else 0

        return {
            "org_id": org_id,
            "campaign_id": campaign_id,
            "target_event": target_event,
            "window_hours": window_hours,
            "is_adaptive_window": is_adaptive,
            "total_clicks": total_clicks,
            "successful_conversions": successful_conversions,
            "activation_rate": activation_rate
        }
    except Exception as e:
        # Graceful fallback on error
        return {
            "org_id": org_id,
            "campaign_id": campaign_id,
            "target_event": target_event,
            "window_hours": window_hours,
            "is_adaptive_window": is_adaptive,
            "total_clicks": 0,
            "successful_conversions": 0,
            "activation_rate": 0,
            "error": str(e)
        }
