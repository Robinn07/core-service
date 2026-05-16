const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', apiKeyController.generateKey);
router.get('/', apiKeyController.getKeys);
router.delete('/:id', apiKeyController.revokeKey);

module.exports = router;
