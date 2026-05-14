const express = require('express');
const router = express.Router();
const sesWebhookController = require('../controllers/sesWebhookController');

// AWS SES SNS Webhook (Publicly accessible)
router.post('/webhook', sesWebhookController.handleSesEvent);

module.exports = router;
