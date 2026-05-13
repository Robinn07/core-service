const express = require('express');
const router = express.Router();
const multer = require('multer');
const subscriberController = require('../controllers/subscriberController');
const { authenticate } = require('../middleware/auth');
const path = require('path');

// Configure Multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// Apply auth middleware to all routes
router.use(authenticate);

// Standard CRUD
router.post('/', subscriberController.createSubscriber);
router.get('/', subscriberController.getAllSubscribers);
router.get('/:id/export', subscriberController.exportData);
router.get('/:id', subscriberController.getSubscriberById);
router.put('/:id', subscriberController.updateSubscriber);
router.delete('/:id', subscriberController.deleteSubscriber);

// Advanced Features
router.post('/import', upload.single('file'), subscriberController.importCSV);
router.post('/segment', subscriberController.segmentSubscribers);

module.exports = router;
