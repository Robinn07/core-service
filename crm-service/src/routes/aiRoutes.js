const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * @swagger
 * /api/ai/churn/predict:
 *   post:
 *     summary: Predict churn probability for a subscriber or an entire organization
 *     tags: [AI]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriberId:
 *                 type: string
 *                 format: uuid
 *               batch:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Prediction result or queue confirmation
 */
router.post('/churn/predict', aiController.predictChurn);

/**
 * @swagger
 * /api/ai/sto/calculate:
 *   post:
 *     summary: Calculate optimal send time for a subscriber or organization
 *     tags: [AI]
 */
router.post('/sto/calculate', aiController.calculateSTO);

/**
 * @swagger
 * /api/ai/sto/recommendation/{campaignId}:
 *   get:
 *     summary: Get recommended send time for a specific campaign segment
 *     tags: [AI]
 */
router.get('/sto/recommendation/:campaignId', aiController.getCampaignRecommendation);

/**
 * @swagger
 * /api/ai/leads/score:
 *   post:
 *     summary: Generate lead score and temperature for a subscriber or organization
 *     tags: [AI]
 */
router.post('/leads/score', aiController.calculateLeadScore);

/**
 * @swagger
 * /api/ai/segmentation/cluster:
 *   post:
 *     summary: Cluster audience into AI segments for an organization
 *     tags: [AI]
 */
router.post('/segmentation/cluster', aiController.clusterAudience);

/**
 * @swagger
 * /api/ai/profile/update:
 *   post:
 *     summary: Run full AI profile update for a subscriber
 *     tags: [AI]
 */
router.post('/profile/update', aiController.updateProfile);

module.exports = router;



