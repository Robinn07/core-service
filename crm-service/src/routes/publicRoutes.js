const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const formPublicController = require('../controllers/formPublicController');
const preferenceController = require('../controllers/preferenceController');

// No authentication needed for these routes
router.get('/confirm', publicController.confirmSubscription);
router.all('/unsubscribe/one-click', publicController.oneClickUnsubscribe);
router.get('/p/:slug', formPublicController.renderLandingPage);
router.get('/popups/:orgId', formPublicController.getActivePopups);
router.post('/forms/:formId/submit', formPublicController.submitForm);
router.post('/forms/:formId/impression', formPublicController.trackImpression);
router.get('/preferences/:id', preferenceController.getPreferences);
router.post('/preferences/:id', preferenceController.updatePreferences);

module.exports = router;
