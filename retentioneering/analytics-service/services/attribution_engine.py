# analytics-service/services/attribution_engine.py
import pandas as pd
import json

def calculate_campaign_impact(ch_client, org_id: str, campaign_id: str, target_event: str, window_hours: int = 48) -> dict:
    """
    Calculates the 'Success Rate' of a campaign by tracking users who clicked an email
    and then performed a specific product action within the attribution window.
    """
    assert org_id is not None, "org_id required for all analytics queries"
    
    # 1. Fetch all clicks for this campaign
    click_query = """
    SELECT user_id, timestamp as click_time
    FROM events 
    WHERE org_id = {org:String} 
      AND campaign_id = {camp:String} 
      AND event_type = 'link_clicked'
    """
    clicks_df = ch_client.query_df(click_query, parameters={'org': org_id, 'camp': campaign_id})
    
    if clicks_df.empty:
        return {
            "campaign_id": campaign_id,
            "clicks": 0,
            "successes": 0,
            "activation_rate": 0
        }

    unique_clickers = clicks_df['user_id'].unique().tolist()
    
    # 2. Fetch target product events for these specific users after their click time
    # We join in memory or via a complex SQL query. For large scale, SQL is better.
    # Here we use a robust SQL approach.
    
    success_query = """
    SELECT count(DISTINCT user_id) as success_count
    FROM events
    WHERE org_id = {org:String}
      AND event_type = {target:String}
      AND user_id IN {users:Array(String)}
      AND timestamp > (
          SELECT min(timestamp) FROM events 
          WHERE org_id = {org:String} 
            AND campaign_id = {camp:String} 
            AND event_type = 'link_clicked' 
            AND user_id = events.user_id
      )
      AND timestamp <= (
          SELECT min(timestamp) + INTERVAL {window:Int32} HOUR FROM events 
          WHERE org_id = {org:String} 
            AND campaign_id = {camp:String} 
            AND event_type = 'link_clicked' 
            AND user_id = events.user_id
      )
    """
    
    # Note: The above subquery approach might be slow on ClickHouse for massive datasets.
    # An alternative is to fetch the product events and join in Pandas.
    
    product_query = """
    SELECT user_id, timestamp as event_time
    FROM events
    WHERE org_id = {org:String}
      AND event_type = {target:String}
      AND user_id IN {users:Array(String)}
    """
    product_df = ch_client.query_df(product_query, parameters={
        'org': org_id, 
        'target': target_event, 
        'users': unique_clickers
    })
    
    if product_df.empty:
        return {
            "campaign_id": campaign_id,
            "clicks": len(unique_clickers),
            "successes": 0,
            "activation_rate": 0
        }

    # 3. Perform the time-window join
    merged = pd.merge(clicks_df, product_df, on='user_id')
    
    # Filter where event_time is within the window after click_time
    merged['click_time'] = pd.to_datetime(merged['click_time'])
    merged['event_time'] = pd.to_datetime(merged['event_time'])
    
    success_mask = (merged['event_time'] > merged['click_time']) & \
                   (merged['event_time'] <= merged['click_time'] + pd.Timedelta(hours=window_hours))
    
    successful_users = merged[success_mask]['user_id'].nunique()
    
    return {
        "org_id": org_id,
        "campaign_id": campaign_id,
        "target_event": target_event,
        "window_hours": window_hours,
        "total_clicks": len(unique_clickers),
        "successful_conversions": successful_users,
        "activation_rate": round((successful_users / len(unique_clickers) * 100), 2) if len(unique_clickers) > 0 else 0
    }
