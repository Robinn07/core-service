const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', listController.createList);
router.get('/', listController.getAllLists);
router.get('/:id', listController.getListById);
router.delete('/:id', listController.deleteList);

module.exports = router;
