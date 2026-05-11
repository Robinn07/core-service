const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const formPublicController = require('../controllers/formPublicController');
const preferenceController = require('../controllers/preferenceController');

// No authentication needed for these routes
router.get('/confirm', publicController.confirmSubscription);
router.post('/forms/:formId/submit', formPublicController.submitForm);
router.get('/preferences/:id', preferenceController.getPreferences);
router.post('/preferences/:id', preferenceController.updatePreferences);

module.exports = router;
