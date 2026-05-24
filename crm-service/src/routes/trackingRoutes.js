const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

router.get('/open/:logId', trackingController.trackOpen);
router.get('/click/:logId', trackingController.trackClick);
router.post('/consent', trackingController.handleConsent);

module.exports = router;
