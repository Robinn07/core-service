const express = require('express');
const router = express.Router();
const multer = require('multer');
const subscriberController = require('../controllers/subscriberController');
const { authenticate, authorize } = require('../middleware/auth');
const path = require('path');

// Configure Multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// Apply auth middleware to all routes
router.use(authenticate);

// Standard CRUD
router.post('/', authorize(['ADMIN', 'EDITOR']), subscriberController.createSubscriber);
router.post('/verify', subscriberController.verifyEmail);
router.post('/batch-verify', authorize(['ADMIN', 'EDITOR']), subscriberController.batchVerify);
router.get('/', subscriberController.getAllSubscribers);
router.get('/:id/export', subscriberController.exportData);
router.get('/:id/events', subscriberController.getSubscriberEvents);
router.get('/:id', subscriberController.getSubscriberById);
router.post('/:id/tags', authorize(['ADMIN', 'EDITOR']), subscriberController.addTagToSubscriber);
router.delete('/:id/tags/:tagId', authorize(['ADMIN', 'EDITOR']), subscriberController.removeTagFromSubscriber);
router.put('/:id', authorize(['ADMIN', 'EDITOR']), subscriberController.updateSubscriber);
router.delete('/:id', authorize(['ADMIN']), subscriberController.deleteSubscriber);

// Advanced Features
router.post('/import', authorize(['ADMIN', 'EDITOR']), upload.single('file'), subscriberController.importCSV);
router.post('/segment', subscriberController.segmentSubscribers);
router.post('/merge', authorize(['ADMIN']), subscriberController.mergeSubscribers);
router.post('/convert-segment', authorize(['ADMIN', 'EDITOR']), subscriberController.convertSegmentToStatic);

module.exports = router;
