const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const apiKeyController = require('../controllers/apiKeyController');
const { authenticate } = require('../middleware/auth');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: 'Too many API key requests, please try again after 15 minutes'
});

router.use(authenticate);

router.post('/', apiLimiter, apiKeyController.generateKey);
router.get('/', apiKeyController.getKeys);
router.delete('/:id', apiLimiter, apiKeyController.revokeKey);

module.exports = router;
