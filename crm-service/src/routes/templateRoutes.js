const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', templateController.createTemplate);
router.get('/', templateController.getAllTemplates);

module.exports = router;
