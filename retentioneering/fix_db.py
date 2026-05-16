import clickhouse_connect

# Connect to your Cloud instance
client = clickhouse_connect.get_client(
    host='f8acr998lg.ap-south-1.aws.clickhouse.cloud', 
    port=8443,
    username='default',
    password='7l0J.N~332DM7',
    secure=True
)

print("Dropping old 'events' table...")
client.command("DROP TABLE IF EXISTS events")
print("Cleanup complete! You can now run the worker.")