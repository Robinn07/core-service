// email-service/src/server.js
// Getloopx Email Automation Service

require('dotenv').config();
const express = require('express');
const admin   = require('firebase-admin');
const logger = require('pino')();
const pinoHttp = require('pino-http')({ logger });

// ── Firebase Init ───────────────────────────────────────────────
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const app = express();
app.use(express.json());
app.use(pinoHttp);

// ── Mount Routes ────────────────────────────────────────────────
const webhookRoutes = require('./routes/webhook');
app.use('/api/v1', webhookRoutes);

// ── Keep your existing auth routes ─────────────────────────────
const authRoutes = require('./auth');
app.use('/auth', authRoutes);

// ── Health Check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'getloopx-email-service',
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled Global Error');
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 3001; // Default to 3001 to avoid conflict with ingestion
app.listen(PORT, () => {
  logger.info(`✅ Getloopx Email Service running on port ${PORT}`);
});
