const express = require('express');
const router = express.Router();
const outgoingWebhookController = require('../controllers/outgoingWebhookController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', outgoingWebhookController.createSubscription);
router.get('/', outgoingWebhookController.getSubscriptions);
router.delete('/:id', outgoingWebhookController.deleteSubscription);

module.exports = router;
