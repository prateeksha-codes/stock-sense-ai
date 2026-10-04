const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const businessAuth = require('../middleware/businessAuth');
const { supplierValidation } = require('../validations/validators');

// Owner routes
router.get('/', auth, roleAuth('owner'), businessAuth, supplierController.getSuppliers);
router.post('/', auth, roleAuth('owner'), businessAuth, supplierValidation, supplierController.createSupplier);
router.get('/:id', auth, roleAuth('owner'), businessAuth, supplierController.getSupplierById);
router.put('/:id', auth, roleAuth('owner'), businessAuth, supplierController.updateSupplier);
router.delete('/:id', auth, roleAuth('owner'), businessAuth, supplierController.deleteSupplier);

module.exports = router;