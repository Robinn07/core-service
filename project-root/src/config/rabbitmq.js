const amqp = require('amqplib');

let channel;
const QUEUE_NAME = 'event_ingestion';

async function connectRabbitMQ() {
  if (channel) return channel;
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('✅ Connected to RabbitMQ for Event Publishing');
    return channel;
  } catch (error) {
    console.error('❌ RabbitMQ Connection Error:', error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

async function publishEvent(event) {
  if (!channel) await connectRabbitMQ();
  if (channel) {
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(event)), {
      persistent: true,
    });
    console.log(`📤 Event Published: ${event.event_type} - ${event.event_id || ''}`);
  }
}

module.exports = { connectRabbitMQ, publishEvent };
