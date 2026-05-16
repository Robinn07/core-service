const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
require('dotenv').config();

// Explicitly pass credentials to the client
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const command = new SendEmailCommand({
    Destination: { ToAddresses: [to] },
    Message: {
      Body: { Html: { Data: html } },
      Subject: { Data: subject },
    },
    Source: process.env.SES_FROM_EMAIL,
  });

  try {
    return await sesClient.send(command);
  } catch (error) {
    console.error("SES Send Error:", error.message);
    throw error;
  }
};

module.exports = sendEmail;