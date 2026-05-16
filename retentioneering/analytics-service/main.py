# analytics-service/main.py
# Getloopx Analytics Engine | FastAPI | Retentioneering v3.3.0
 
import os
import json
import clickhouse_connect
import structlog
from fastapi import FastAPI, HTTPException, Security, Request, Depends, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from dotenv import load_dotenv

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor

from services.funnel import run_funnel
from services.abtest import run_ab_test
from services.segmentation import run_segmentation
from services.retention import run_retention_analysis
from services.journey import run_journey_mapping
from services.sankey import run_sankey_data
from services.attribution import run_attribution_analysis
from services.health import calculate_health_scores, get_at_risk_users
from services.path_discovery import discover_toxic_paths
from services.evaluator import check_user_for_toxic_path
from services.attribution_engine import calculate_campaign_impact
from auth import verify_token, require_role
from utils.config.loader import get_clickhouse_config

load_dotenv()

# ── OpenTelemetry Setup ──────────────────────────────────────────
resource = Resource(attributes={"service.name": "getloopx-analytics"})
provider = TracerProvider(resource=resource)
# For production, you'd use OTLPSpanExporter, here Console for visibility
processor = BatchSpanProcessor(ConsoleSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

LoggingInstrumentor().instrument(set_logging_format=True)

# ── Logging Setup ─────────────────────────────────────────────
def add_trace_id(logger, method_name, event_dict):
    span = trace.get_current_span()
    if span:
        ctx = span.get_span_context()
        if ctx.is_valid:
            event_dict["trace_id"] = hex(ctx.trace_id)
            event_dict["span_id"] = hex(ctx.span_id)
    return event_dict

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        add_trace_id,
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

# ── ClickHouse Init ─────────────────────────────────────────────
ch_config = get_clickhouse_config()
ch_client = clickhouse_connect.get_client(**ch_config)

# ── Background Task: Health Scoring ─────────────────────────────
def update_health_scores(org_id: str):
    logger.info("background_health_score_start", org_id=org_id)
    df = fetch_events(org_id)
    if not df.empty:
        result = calculate_health_scores(df, org_id)
        set_cached_analytics(org_id, "health_scores", result)
    logger.info("background_health_score_complete", org_id=org_id)

app = FastAPI(title="Getloopx Analytics Engine", version="3.0.0")
FastAPIInstrumentor.instrument_app(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security Middleware: ClickHouse RLS ──────────────────────────
def enforce_rls(org_id: str, request_org_id: str):
    if org_id != request_org_id:
        logger.error("security_violation_rls", jwt_org=org_id, requested_org=request_org_id)
        raise HTTPException(status_code=403, detail="Access denied: Organizational isolation violation")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    log = logger.bind(method=request.method, path=request.url.path)
    response = await call_next(request)
    log.info("request_processed", status_code=response.status_code)
    return response

@app.get("/health")
def health_check():
    health = {
        "status": "ok",
        "service": "getloopx-analytics",
        "timestamp": pd.Timestamp.now(tz='UTC').isoformat(),
        "dependencies": {"clickhouse": "unknown"}
    }
    try:
        ch_client.command("SELECT 1")
        health["dependencies"]["clickhouse"] = "connected"
    except Exception as e:
        health["status"] = "error"
        health["dependencies"]["clickhouse"] = f"disconnected: {str(e)}"
    if health["status"] == "error":
        raise HTTPException(status_code=503, detail=health)
    return health

# ── Query Helpers (Strictly filtered by org_id) ───────────────────
def get_cached_analytics(org_id: str, analytics_type: str, campaign_id: str = "GLOBAL"):
    query = """
    SELECT result FROM processed_analytics 
    WHERE org_id = {org:String} AND analytics_type = {type:String} AND campaign_id = {camp:String}
    ORDER BY updated_at DESC LIMIT 1
    """
    result = ch_client.query(query, parameters={'org': org_id, 'type': analytics_type, 'camp': campaign_id})
    if result.result_rows:
        return json.loads(result.result_rows[0][0])
    return None

def set_cached_analytics(org_id: str, analytics_type: str, result: any, campaign_id: str = "GLOBAL"):
    row = [org_id, analytics_type, campaign_id, json.dumps(result)]
    ch_client.insert('processed_analytics', [row], column_names=['org_id', 'analytics_type', 'campaign_id', 'result'])

def fetch_events(org_id: str) -> pd.DataFrame:
    query = """
    SELECT user_id, event_type as event, timestamp, channel, campaign_id, ab_variant
    FROM events WHERE org_id = {org:String} ORDER BY timestamp ASC
    """
    df = ch_client.query_df(query, parameters={'org': org_id})
    if df.empty: return pd.DataFrame()
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    return df

# ── Analytics Endpoints ──────────────────────────────────────────

@app.get("/analytics/{org_id}/journey")
def journey_mapping(org_id: str, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    cached = get_cached_analytics(org_id, "journey")
    if cached: return cached

    df = fetch_events(org_id)
    if df.empty: raise HTTPException(status_code=404, detail="No events found")
    
    result = run_journey_mapping(df, org_id)
    set_cached_analytics(org_id, "journey", result)
    return result

@app.get("/analytics/{org_id}/journey/sankey")
def journey_sankey(org_id: str, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    cached = get_cached_analytics(org_id, "sankey")
    if cached: return cached

    df = fetch_events(org_id)
    if df.empty: raise HTTPException(status_code=404, detail="No events found")
    
    result = run_sankey_data(df, org_id)
    set_cached_analytics(org_id, "sankey", result)
    return result

@app.get("/analytics/{org_id}/attribution")
def channel_attribution(org_id: str, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    df = fetch_events(org_id)
    if df.empty: raise HTTPException(status_code=404, detail="No events found")
    
    return run_attribution_analysis(df, org_id)

@app.get("/analytics/{org_id}/at-risk")
def at_risk_users(org_id: str, background_tasks: BackgroundTasks, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    
    background_tasks.add_task(update_health_scores, org_id)
    
    cached = get_cached_analytics(org_id, "health_scores")
    if cached:
        at_risk = [u for u in cached.get('users', []) if u.get('is_at_risk')]
        return {"org_id": org_id, "at_risk_users": at_risk, "count": len(at_risk), "source": "cache"}

    df = fetch_events(org_id)
    if df.empty: raise HTTPException(status_code=404, detail="No events found")
    return get_at_risk_users(df, org_id)

@app.get("/analytics/{org_id}/summary/{campaign_id}")
def campaign_summary(org_id: str, campaign_id: str, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    
    query = """
    SELECT event_type, countMerge(count) as total
    FROM daily_campaign_stats
    WHERE org_id = {org:String} AND campaign_id = {camp:String}
    GROUP BY event_type
    """
    result = ch_client.query(query, parameters={'org': org_id, 'camp': campaign_id})
    rows = result.result_rows
    counts = {row[0]: row[1] for row in rows}
    
    sent = sum(counts.get(et, 0) for et in ['email_sent', 'sms_sent', 'whatsapp_sent', 'push_sent'])
    opened = sum(counts.get(et, 0) for et in ['email_opened', 'whatsapp_read'])
    clicked = sum(counts.get(et, 0) for et in ['link_clicked', 'push_clicked'])
    
    return {
        "sent": sent, "opened": opened, "clicked": clicked,
        "open_rate": round(opened / sent * 100, 2) if sent else 0,
        "click_rate": round(clicked / sent * 100, 2) if sent else 0
    }

@app.get("/analytics/{org_id}/funnel")
def funnel_analysis(org_id: str, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    cached = get_cached_analytics(org_id, "funnel")
    if cached: return cached
    df = fetch_events(org_id)
    if df.empty: raise HTTPException(status_code=404, detail="No events found")
    result = run_funnel(df, org_id)
    set_cached_analytics(org_id, "funnel", result)
    return result

@app.get("/analytics/{org_id}/toxic-paths")
def toxic_paths(org_id: str, threshold: float = 0.5, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    df = fetch_events(org_id)
    if df.empty: raise HTTPException(status_code=404, detail="No events found")
    return discover_toxic_paths(df, org_id, threshold)

@app.get("/analytics/{org_id}/check-user/{user_id}")
def check_user_path(org_id: str, user_id: str, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    return check_user_for_toxic_path(ch_client, org_id, user_id)

@app.get("/analytics/{org_id}/campaign-impact/{campaign_id}")
def campaign_impact(org_id: str, campaign_id: str, target_event: str, window_hours: int = 0, fallback_hours: int = 48, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    return calculate_campaign_impact(ch_client, org_id, campaign_id, target_event, window_hours, fallback_hours)

@app.post("/analytics/{org_id}/refresh")
def refresh_analytics(org_id: str, token: dict = Depends(require_role(["admin"]))):
    enforce_rls(token['uid'], org_id)
    return {"status": "refresh_queued"}

@app.get("/analytics/{org_id}/dashboard/{campaign_id}")
def dashboard(org_id: str, campaign_id: str, token: dict = Security(verify_token)):
    enforce_rls(token['uid'], org_id)
    return {
        "org_id": org_id,
        "campaign_id": campaign_id,
        "summary": campaign_summary(org_id, campaign_id, token),
        "funnel": funnel_analysis(org_id, token),
    }
