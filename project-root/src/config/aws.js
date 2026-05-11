const { SESClient } = require("@aws-sdk/client-ses");

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AKIATI76RCOGU7GVJRHL,
    secretAccessKey: process.env.RFxdTUHUBmSXUqr2FA7yR5l86x1YjnYnUHUiOg1h,
  },
});

module.exports = sesClient;