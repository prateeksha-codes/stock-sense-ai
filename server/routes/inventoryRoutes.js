const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');

// Owner routes
router.get('/', auth, roleAuth('owner'), businessAuth, inventoryController.getInventoryOverview);
router.get('/transactions', auth, roleAuth('owner'), businessAuth, inventoryController.getTransactions);
router.get('/alerts', auth, roleAuth('owner'), businessAuth, inventoryController.getAlerts);
router.post('/transactions', auth, roleAuth('owner'), businessAuth, inventoryController.addTransaction);

module.exports = router;