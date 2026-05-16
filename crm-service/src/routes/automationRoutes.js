const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authenticate, authorize } = require('../middleware/auth');

// Internal / Service-to-Service routes
router.post('/internal/path-trigger', automationController.triggerPathAutomation);

router.use(authenticate);

router.post('/', authorize(['ADMIN', 'EDITOR']), automationController.createAutomation);
router.get('/', automationController.getAllAutomations);
router.put('/:id/canvas', authorize(['ADMIN', 'EDITOR']), automationController.updateCanvas);
router.post('/trigger', automationController.triggerAutomation);

module.exports = router;
