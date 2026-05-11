# analytics-service/services/attribution.py
import pandas as pd

def run_attribution_analysis(df: pd.DataFrame, org_id: str) -> dict:
    if df.empty:
        return {"error": "No events found"}

    # Define conversion metrics per channel
    channels = ['EMAIL', 'SMS', 'WHATSAPP']
    results = {}

    for channel in channels:
        channel_data = df[df['channel'] == channel]
        if channel_data.empty:
            results[channel] = {"sent": 0, "converted": 0, "ratio": 0}
            continue

        # Sent events
        sent_events = ['email_sent', 'sms_sent', 'whatsapp_sent']
        sent_count = channel_data[channel_data['event'].isin(sent_events)].shape[0]

        # Conversion events (e.g., clicks)
        conv_events = ['link_clicked', 'whatsapp_read', 'email_opened']
        conv_count = channel_data[channel_data['event'].isin(conv_events)].shape[0]

        ratio = round((conv_count / sent_count * 100), 2) if sent_count > 0 else 0
        
        results[channel] = {
            "sent": sent_count,
            "converted": conv_count,
            "ratio": ratio
        }

    # Identify top performing channel
    best_channel = max(results, key=lambda x: results[x]['ratio']) if results else None

    return {
        "org_id": org_id,
        "channel_performance": results,
        "best_performing_medium": best_channel,
        "metric": "click-to-conversion ratio"
    }
