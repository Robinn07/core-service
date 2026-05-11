require('dotenv').config();
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const sesClient = require('./src/config/ses');

async function testSend() {
  const recipient = 'abutalhasolanki@gmail.com';
  const sender = process.env.SES_FROM_EMAIL || 'no-reply@getloopx.com';

  console.log(`Attempting to send email from ${sender} to ${recipient}...`);

  const command = new SendEmailCommand({
    Destination: { ToAddresses: [recipient] },
    Message: {
      Body: { 
        Text: { Data: "This is a test email from GetLoopX backend verification." },
        Html: { Data: "<h1>GetLoopX Verification</h1><p>The backend integration is working correctly.</p>" }
      },
      Subject: { Data: "GetLoopX Backend Test" },
    },
    Source: sender,
  });

  try {
    const response = await sesClient.send(command);
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", response.MessageId);
  } catch (error) {
    console.error("❌ Failed to send email:");
    console.error(error.message);
    if (error.message.includes('not verified')) {
        console.log("\nTIP: Since you are in the SES Sandbox, the SENDER email must also be verified in the AWS Console.");
    }
  }
}

testSend();
