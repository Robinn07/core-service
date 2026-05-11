const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', campaignController.createCampaign);
router.post('/:id/send', campaignController.sendCampaign);
router.get('/:id/status', campaignController.getCampaignStatus);
router.get('/:id/analytics', campaignController.getCampaignAnalytics);

module.exports = router;
