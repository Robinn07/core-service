const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', automationController.createAutomation);
router.get('/', automationController.getAllAutomations);
router.post('/trigger', automationController.triggerAutomation);

module.exports = router;
