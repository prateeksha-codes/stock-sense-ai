const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Customer profile
router.get('/profile', auth, roleAuth('customer'), customerController.getProfile);
router.put('/profile', auth, roleAuth('customer'), customerController.updateProfile);

// Addresses
router.get('/addresses', auth, roleAuth('customer'), customerController.getAddresses);
router.post('/addresses', auth, roleAuth('customer'), customerController.addAddress);
router.put('/addresses/:id', auth, roleAuth('customer'), customerController.updateAddress);
router.delete('/addresses/:id', auth, roleAuth('customer'), customerController.deleteAddress);

// Discovery Location (for Nearby)
router.get('/discovery-location', auth, roleAuth('customer'), customerController.getDiscoveryLocation);
router.put('/discovery-location', auth, roleAuth('customer'), customerController.updateDiscoveryLocation);

module.exports = router;