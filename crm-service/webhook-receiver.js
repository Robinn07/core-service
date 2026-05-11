const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = 8080;
const WEBHOOK_SECRET = 'getloopx_test_secret_123'; // This would be the secret from the subscription

// Middleware to capture raw body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Verification Middleware
const verifyGetLoopXSignature = (req, res, next) => {
  const signature = req.headers['x-getloopx-signature'];
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing X-GetLoopX-Signature header' });
  }

  if (!req.rawBody) {
    return res.status(400).json({ error: 'Raw body not captured' });
  }

  // Calculate HMAC-SHA256
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(req.rawBody);
  const calculatedSignature = hmac.digest('hex');

  // Securely compare signatures to prevent timing attacks
  try {
    const trusted = Buffer.from(calculatedSignature, 'ascii');
    const provided = Buffer.from(signature, 'ascii');
    
    if (trusted.length === provided.length && crypto.timingSafeEqual(trusted, provided)) {
      return next();
    }
  } catch (err) {
    // Length mismatch or other error
  }

  return res.status(401).json({ error: 'Invalid webhook signature' });
};

// Test Route
app.post('/webhook-receive', verifyGetLoopXSignature, (req, res) => {
  console.log('✅ Webhook verified and received:', req.body.event);
  res.status(200).json({ status: 'success' });
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook receiver listening on port ${PORT}`);
});
