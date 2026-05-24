const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize(['ADMIN', 'EDITOR']), campaignController.createCampaign);
router.get('/', campaignController.getAllCampaigns);
router.post('/:id/send', authorize(['ADMIN', 'EDITOR']), campaignController.sendCampaign);
router.get('/:id/status', campaignController.getCampaignStatus);
router.get('/:id/analytics', campaignController.getCampaignAnalytics);

module.exports = router;
