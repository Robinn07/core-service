require('dotenv').config();
const { Queue } = require('bullmq');
const connection = require('./src/config/redis');

// 1. Initialize the Queue (Must match the name in emailWorker.js)
const emailQueue = new Queue('email-queue', { connection });

async function addEmailJob() {
  console.log("Adding job to queue...");
  
  // 2. Add a test job
  await emailQueue.add('send-test-email', {
    to: 'abutalhasolanki@gmail.com', // Replace with your email
    subject: 'LoopX Test Campaign',
    body: '<h1>It Works!</h1><p>This is an automated email sent through SES.</p>'
  });

  console.log("✅ Job added! Check your Worker terminal.");
  process.exit(0);
}

addEmailJob();