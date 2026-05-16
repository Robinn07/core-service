import os
import clickhouse_connect
from dotenv import load_dotenv

load_dotenv()

# Connect using the details from your .env
client = clickhouse_connect.get_client(
    host=os.getenv('CLICKHOUSE_HOST', 'localhost'),
    port=int(os.getenv('CLICKHOUSE_PORT', 8123)),
    username=os.getenv('CLICKHOUSE_USER', 'default'),
    password=os.getenv('CLICKHOUSE_PASSWORD', ''),
    secure=os.getenv('CLICKHOUSE_SECURE', 'False').lower() == 'true'
)

# SQL to create your events table
remote_table_sql = """
CREATE TABLE IF NOT EXISTS events (
    event_id UUID,
    event_type String,
    user_id String,
    timestamp DateTime64(3),
    metadata String
) ENGINE = MergeTree()
ORDER BY (timestamp, event_type)
"""

client.command(remote_table_sql)
print("Table created successfully!")