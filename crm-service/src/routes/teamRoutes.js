const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', teamController.getTeamMembers);
router.post('/invite', authorize(['ADMIN']), teamController.inviteMember);
router.delete('/:id', authorize(['ADMIN']), teamController.removeMember);

module.exports = router;
