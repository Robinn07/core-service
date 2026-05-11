require('dotenv').config();
const { Subscriber } = require('./src/models');
const doiService = require('./src/services/doiService');

async function testDOI() {
  const orgId = 'test-org-doi';
  const email = 'abutalhasolanki@gmail.com'; // Verified in user's SES sandbox

  console.log(`Testing Double Opt-In for ${email}...`);

  try {
    // 1. Clean up old test data if exists
    await Subscriber.destroy({ where: { email, orgId } });

    // 2. Create a pending subscriber
    const subscriber = await Subscriber.create({
      email,
      firstName: 'Test',
      orgId,
      status: 'pending'
    });
    console.log("✅ Subscriber created with status 'pending'");

    // 3. Send DOI Email
    console.log("Sending confirmation email...");
    const sent = await doiService.sendConfirmationEmail(subscriber);
    
    if (sent) {
        console.log("✅ Confirmation email sent! Check your inbox.");
        console.log("Confirmation Token:", subscriber.confirmationToken);
        console.log(`\nTo verify locally, go to: http://localhost:4000/api/public/confirm?token=${subscriber.confirmationToken}`);
    } else {
        throw new Error("Failed to send email.");
    }

  } catch (error) {
    console.error("❌ DOI Test Failed:", error.message);
  } finally {
    process.exit();
  }
}

testDOI();
