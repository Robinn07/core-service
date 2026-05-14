require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const campaignRoutes = require('./routes/campaigns');
const tenantRoutes = require('./routes/tenantRoutes');
const analyticsRoutes = require('./routes/analytics');
const sesWebhookController = require('./controllers/sesWebhookController');

const app = express();

// 1. Global Middleware
app.use(cors());
app.use(express.json());

// SES Webhook (Specific parsing for SNS)
app.post('/api/ses/webhook', express.json({ type: '*/*' }), sesWebhookController.handleWebhook);

// 2. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Routes
app.use('/api/v1/campaigns', apiLimiter, campaignRoutes);
app.use('/api/v1/tenants', apiLimiter, tenantRoutes);
app.use('/api/v1/analytics', apiLimiter, analyticsRoutes);

// 4. Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

module.exports = app;