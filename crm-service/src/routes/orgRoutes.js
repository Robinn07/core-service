const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/settings', orgController.getSettings);
router.put('/settings', authorize(['ADMIN', 'EDITOR']), orgController.updateSettings);

module.exports = router;
