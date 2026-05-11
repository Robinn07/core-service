# retentioneering/ingestion-service/worker.py
import pika
import json
import os
import time
import clickhouse_connect
from dotenv import load_dotenv
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
    
    try:
        with tracer.start_as_current_span("flush_to_clickhouse", attributes={"batch_size": len(batch)}):
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
    except Exception as e:
        print(f"❌ ClickHouse Insert Error: {e}")
        for tag in delivery_tags:
            ch.basic_nack(delivery_tag=tag, requeue=True)
        batch = []
        delivery_tags = []

import requests

# ... (rest of imports)

CRM_SERVICE_URL = os.getenv('CRM_SERVICE_URL', 'http://localhost:4000')
CRM_API_KEY = os.getenv('CRM_API_KEY', '')

# ... (rest of config)

def notify_crm(org_id, user_id, event_type):
    if not CRM_API_KEY:
        return
    
    url = f"{CRM_SERVICE_URL}/api/automations/trigger"
    payload = {
        "eventName": event_type,
        "subscriberId": user_id
    }
    headers = {
        "x-api-key": CRM_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=2)
        if response.status_code == 200:
            print(f"🔔 Automation triggered for {user_id}: {event_type}")
        else:
            print(f"⚠️ CRM Notification failed: {response.status_code}")
    except Exception as e:
        print(f"❌ CRM Notification Error: {e}")

def callback(ch, method, properties, body):
    global batch, delivery_tags
    
    # ... (OTel context extraction)
    
    with tracer.start_as_current_span("process_event", context=ctx) as span:
        try:
            data = json.loads(body)
            # ... (Span attributes and row creation)
            
            # Notify CRM for behavioral triggers
            notify_crm(data['orgId'], data['userId'], data['event_type'])
            
            batch.append(row)
            # ... (Rest of callback)

# ── RabbitMQ Consumer ───────────────────────────────────────────
def run_worker():
    connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
    channel = connection.channel()
    
    DLX_NAME = 'event_ingestion_dlx'
    FAILED_QUEUE = 'failed_events_queue'
    
    channel.exchange_declare(exchange=DLX_NAME, exchange_type='direct', durable=True)
    channel.queue_declare(queue=FAILED_QUEUE, durable=True)
    channel.queue_bind(queue=FAILED_QUEUE, exchange=DLX_NAME, routing_key='failed')
    
    channel.queue_declare(queue=QUEUE_NAME, durable=True, arguments={
        'x-dead-letter-exchange': DLX_NAME,
        'x-dead-letter-routing-key': 'failed'
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
