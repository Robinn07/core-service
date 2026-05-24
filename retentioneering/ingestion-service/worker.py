# retentioneering/ingestion-service/worker.py
import pika
import json
import os
import time
import clickhouse_connect
import sentry_sdk
from dotenv import load_dotenv

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    environment=os.environ.get('APP_ENV', 'production'),
    traces_sample_rate=0.1
)

from opentelemetry import trace, context
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

load_dotenv()

# ── OpenTelemetry Setup ──────────────────────────────────────────
resource = Resource(attributes={"service.name": "getloopx-worker"})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(ConsoleSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)
propagator = TraceContextTextMapPropagator()

# ... (Config and ClickHouse Setup same)
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost')
QUEUE_NAME = 'event_ingestion'

CH_HOST = os.getenv('CLICKHOUSE_HOST', 'localhost')
CH_PORT = int(os.getenv('CLICKHOUSE_PORT', 8123))
CH_USER = os.getenv('CLICKHOUSE_USER', 'default')
CH_PASS = os.getenv('CLICKHOUSE_PASSWORD', '')
CH_SECURE = os.getenv('CLICKHOUSE_SECURE', 'False').lower() == 'true'

client = clickhouse_connect.get_client(
    host=CH_HOST, port=CH_PORT, username=CH_USER, password=CH_PASS, secure=CH_SECURE
)

# ── Processing Logic ─────────────────────────────────────────────
batch = []
delivery_tags = []
BATCH_SIZE = 100
LAST_FLUSH = time.time()

def handle_retry(ch, method, properties, body, error_msg):
    headers = properties.headers or {}
    retry_count = headers.get('x-retry-count', 0)
    
    if retry_count < 3:
        retry_count += 1
        headers['x-retry-count'] = retry_count
        print(f"🔄 [Retry {retry_count}/3] Message {method.delivery_tag}: {error_msg}")
        ch.basic_publish(
            exchange='',
            routing_key=QUEUE_NAME,
            body=body,
            properties=pika.BasicProperties(headers=headers, delivery_mode=2)
        )
        ch.basic_ack(delivery_tag=method.delivery_tag)
    else:
        print(f"💀 [DLX] Max retries reached for message {method.delivery_tag}. Routing to failed_events_queue.")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def flush_batch(ch):
    global batch, delivery_tags, LAST_FLUSH
    if not batch: return
    
    retry_count = 0
    max_retries = 3
    
    while retry_count < max_retries:
        try:
            with tracer.start_as_current_span("flush_to_clickhouse", attributes={"batch_size": len(batch), "retry": retry_count}):
                client.insert('events', batch, column_names=[
                    'event_id', 'org_id', 'user_id', 'event_type', 'channel', 
                    'campaign_id', 'ab_variant', 'timestamp', 'metadata'
                ])
                for tag in delivery_tags:
                    ch.basic_ack(delivery_tag=tag)
                
                batch = []
                delivery_tags = []
                LAST_FLUSH = time.time()
                print(f"✅ Batch flushed and acknowledged at {LAST_FLUSH}")
                return # SUCCESS
        except Exception as e:
            sentry_sdk.capture_exception(e)
            retry_count += 1
            print(f"❌ ClickHouse Insert Error (Attempt {retry_count}/{max_retries}): {e}")
            if retry_count >= max_retries:
                print(f"💀 Batch failed after {max_retries} attempts. Routing to DLX.")
                for tag in delivery_tags:
                    ch.basic_nack(delivery_tag=tag, requeue=False) # Send to DLX
                batch = []
                delivery_tags = []
            else:
                time.sleep(2 ** retry_count) # Exponential backoff

import requests

# ... (rest of imports)

CRM_SERVICE_URL = os.getenv('CRM_SERVICE_URL', 'http://localhost:4000')
CRM_API_KEY = os.getenv('CRM_API_KEY', '')
ANALYTICS_SERVICE_URL = os.getenv('ANALYTICS_SERVICE_URL', 'http://localhost:8000')

# ... (rest of config)

def notify_crm(org_id, user_id, event_type):
    # ... existing notify_crm logic ...
    pass

def check_toxic_paths(org_id, user_id):
    if not CRM_API_KEY: return
    
    url = f"{ANALYTICS_SERVICE_URL}/analytics/{org_id}/check-user/{user_id}"
    headers = { "Authorization": f"Bearer {CRM_API_KEY}" } # Using same key for simplicity
    
    try:
        response = requests.get(url, headers=headers, timeout=2)
        if response.status_code == 200:
            data = response.json()
            if data.get("match"):
                print(f"⚠️ Toxic Path Detected for {user_id}: {data['path_id']}")
                trigger_path_crm(org_id, user_id, data['path_id'])
    except Exception as e:
        print(f"❌ Path Check Error: {e}")

def trigger_path_crm(org_id, user_id, path_id):
    url = f"{CRM_SERVICE_URL}/api/automations/internal/path-trigger"
    payload = {
        "orgId": org_id,
        "subscriberId": user_id,
        "pathId": path_id
    }
    try:
        requests.post(url, json=payload, timeout=2)
    except Exception as e:
        print(f"❌ CRM Path Trigger Error: {e}")

def callback(ch, method, properties, body):
    global batch, delivery_tags
    
    # ... (OTel context extraction)
    
    with tracer.start_as_current_span("process_event", context=ctx) as span:
        try:
            data = json.loads(body)
            # ... (Span attributes and row creation)
            
            # Notify CRM for behavioral triggers
            notify_crm(data['orgId'], data['userId'], data['event_type'])
            
            # Check for toxic paths
            check_toxic_paths(data['orgId'], data['userId'])
            
            batch.append(row)
            # ... (Rest of callback)

# ── RabbitMQ Consumer ───────────────────────────────────────────
def run_worker():
    connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
    channel = connection.channel()
    
    DLX_NAME = 'getloopx.dlx'
    FAILED_QUEUE = 'getloopx.events.dead'
    
    channel.exchange_declare(exchange=DLX_NAME, exchange_type='direct', durable=True)
    channel.queue_declare(queue=FAILED_QUEUE, durable=True)
    channel.queue_bind(queue=FAILED_QUEUE, exchange=DLX_NAME, routing_key='events.dead')
    
    channel.queue_declare(queue=QUEUE_NAME, durable=True, arguments={
        'x-dead-letter-exchange': DLX_NAME,
        'x-dead-letter-routing-key': 'events.dead'
    })
    
    channel.basic_qos(prefetch_count=BATCH_SIZE)
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)
    
    print(f"🚀 Resilient OTel Worker listening on {QUEUE_NAME}...")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        flush_batch(channel)
        channel.stop_consuming()
        connection.close()

if __name__ == "__main__":
    run_worker()
