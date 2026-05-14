const axios = require('axios');

async function testSesWebhook() {
  const webhookUrl = 'http://localhost:4000/api/ses/webhook';

  const mockBounceMessage = {
    notificationType: 'Bounce',
    mail: {
      timestamp: '2024-05-14T10:00:00.000Z',
      source: 'sender@mail.getloopx.com',
      destination: ['bounced-user@example.com'],
      tags: {
        orgId: ['org_123'],
        campaignId: ['camp_456'],
        logId: ['log_789']
      }
    },
    bounce: {
      bounceType: 'Permanent',
      bounceSubType: 'General',
      bouncedRecipients: [
        {
          emailAddress: 'bounced-user@example.com',
          action: 'failed',
          status: '5.1.1',
          diagnosticCode: 'smtp; 550 5.1.1 The email account that you tried to reach does not exist.'
        }
      ]
    }
  };

  const snsPayload = {
    Type: 'Notification',
    MessageId: 'mock-sns-id',
    TopicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
    Message: JSON.stringify(mockBounceMessage),
    Timestamp: '2024-05-14T10:00:01.000Z'
  };

  console.log('🚀 Sending mock SES Bounce notification to webhook...');

  try {
    const response = await axios.post(webhookUrl, JSON.stringify(snsPayload), {
      headers: { 'Content-Type': 'text/plain' }
    });

    console.log(`✅ Webhook responded with: ${response.status} ${response.data}`);
    console.log('\nNow check your suppression_list and event_logs tables for org_123.');
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response ? error.response.data : error.message);
  }
}

testSesWebhook();
