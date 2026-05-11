const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', formController.createForm);
router.get('/', formController.getForms);
router.put('/:id', formController.updateForm);

module.exports = router;
