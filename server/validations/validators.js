const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};
const registerOwnerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit mobile number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('businessName').trim().notEmpty().withMessage('Business name is required'),
  body('businessType').trim().notEmpty().withMessage('Business type is required'),
  body('businessAddress').trim().notEmpty().withMessage('Business address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').matches(/^[0-9]{6}$/).withMessage('Valid 6-digit pincode is required'),
  body('businessContact').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit contact number is required'),
  validate
  ];
  const registerCustomerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit mobile number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('stockQuantity').isFloat({ min: 0 }).withMessage('Valid stock quantity is required'),
  body('minStockLevel').isFloat({ min: 0 }).withMessage('Valid minimum stock level is required'),
  validate
];

const supplierValidation = [
  body('name').trim().notEmpty().withMessage('Supplier name is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  validate
];
const orderValidation = [
  body('businessId').isInt().withMessage('Valid business ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Valid product ID is required'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Quantity must be greater than 0'),
  body('paymentMethod').isIn(['online', 'cod']).withMessage('Valid payment method is required'),
  body('shippingAddressId').isInt().withMessage('Valid shipping address is required'),
  validate
];
const purchaseOrderValidation = [
  body('supplierId').isInt().withMessage('Valid supplier ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Valid product ID is required'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Valid unit price is required'),
  body('expectedDeliveryDate').isISO8601().withMessage('Valid delivery date is required'),
  validate
];
module.exports = {
  registerOwnerValidation,
  registerCustomerValidation,
  loginValidation,
  productValidation,
  supplierValidation,
  orderValidation,
  purchaseOrderValidation
};