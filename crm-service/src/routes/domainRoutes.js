const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domainController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', domainController.addDomain);
router.get('/', domainController.getDomains);
router.get('/dashboard', domainController.getDeliverabilityDashboard);
router.get('/:id/dns', domainController.getDomainDns);
router.post('/:id/verify', domainController.verifyDomain);

module.exports = router;
