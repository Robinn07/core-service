const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// SES/SNS might not send application/json, it might send text/plain
// We'll use express.text() for this route if needed, or handle it in the controller
router.post('/ses', express.text(), webhookController.handleSESWebhook);
router.post('/stripe', webhookController.handleStripeWebhook);
router.post('/churn-alert', webhookController.handleChurnAlert);

module.exports = router;
