const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize(['ADMIN', 'EDITOR']), templateController.createTemplate);
router.get('/', templateController.getAllTemplates);
router.get('/gallery', templateController.getGalleryTemplates);
router.get('/:id', templateController.getTemplateById);
router.get('/:id/check-links', templateController.checkLinks);
router.put('/:id', authorize(['ADMIN', 'EDITOR']), templateController.updateTemplate);
router.post('/:id/clone', templateController.cloneTemplate);

module.exports = router;
