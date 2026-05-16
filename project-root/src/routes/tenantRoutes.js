const express = require('express');
const router = express.Router();
const authenticateTenant = require('../middleware/auth');
const tenantController = require('../controllers/tenantController');

/**
 * REGENERATE API KEY
 */
router.post('/regenerate-key', authenticateTenant, tenantController.regenerateApiKey);

module.exports = router;