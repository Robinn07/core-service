const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/campaign/:id/devices', analyticsController.getDeviceStats);
router.get('/campaign/:id/geo', analyticsController.getGeoStats);
router.get('/campaign/:id/timeline', analyticsController.getEngagementTimeline);
router.get('/overall', analyticsController.getOverallOrgStats);

module.exports = router;
