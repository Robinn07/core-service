# analytics-service/services/health.py
import pandas as pd
from datetime import datetime, timedelta, timezone

def calculate_health_scores(df: pd.DataFrame, org_id: str) -> dict:
    if df.empty:
        return {"error": "No events found"}

    now = datetime.now(timezone.utc)
    churn_threshold = now - timedelta(days=14)

    # Group by user
    user_stats = df.groupby('user_id').agg(
        total_events=('event', 'count'),
        last_event=('timestamp', 'max')
    ).reset_index()

    # Calculate Engagement Score
    # Threshold for 100 score = 20 events (adjustable)
    user_stats['engagement_score'] = user_stats['total_events'].apply(lambda x: min(100, round((x / 20) * 100)))

    # Identify Churned/At-Risk Users
    # Churned = last_event < 14 days ago
    user_stats['is_at_risk'] = user_stats['last_event'] < churn_threshold

    at_risk_users = user_stats[user_stats['is_at_risk'] == True]
    
    # Format results
    scores = user_stats[['user_id', 'engagement_score', 'total_events', 'is_at_risk']].to_dict('records')
    
    return {
        "org_id": org_id,
        "summary": {
            "total_users": len(user_stats),
            "at_risk_count": len(at_risk_users),
            "avg_engagement": round(user_stats['engagement_score'].mean(), 2)
        },
        "users": scores
    }

def get_at_risk_users(df: pd.DataFrame, org_id: str) -> dict:
    health_data = calculate_health_scores(df, org_id)
    if "error" in health_data:
        return health_data
    
    at_risk = [u for u in health_data['users'] if u['is_at_risk']]
    return {
        "org_id": org_id,
        "at_risk_users": at_risk,
        "count": len(at_risk)
    }
