const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
  registerOwnerValidation, 
  registerCustomerValidation, 
  loginValidation 
} = require('../validations/validators');
const auth = require('../middleware/auth');

// Public routes
router.post('/register/owner', registerOwnerValidation, authController.registerOwner);
router.post('/register/customer', registerCustomerValidation, authController.registerCustomer);
router.post('/login', loginValidation, authController.login);

// Protected routes
router.get('/me', auth, authController.getMe);

module.exports = router;