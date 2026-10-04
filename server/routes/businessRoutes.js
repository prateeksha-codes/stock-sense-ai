const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');

// Public routes
router.get('/', businessController.getAllBusinesses);
router.get('/:id', businessController.getBusinessById);

// Owner routes
router.put('/:id', auth, roleAuth('owner'), businessAuth, businessController.updateBusiness);

module.exports = router;