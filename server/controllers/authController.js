const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Register Owner
const registerOwner = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { 
      fullName, email, mobile, password,
      businessName, businessType, businessDescription,
      businessAddress, city, state, pincode, businessContact,
      gstNumber, regNumber,latitude, longitude
    } = req.body;

        // Location is mandatory for owner registration
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Business location (latitude, longitude) is required',
      });
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid location coordinates',
      });
    }

    await connection.beginTransaction();

    // Check if user already exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const [userResult] = await connection.query(
      'INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, passwordHash, mobile, 'owner']
    );

    // Create business
        const [businessResult] = await connection.query(
      `INSERT INTO businesses (name, type, description, address, city, state, pincode, contact, gst_number, reg_number, owner_id, latitude, longitude) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        businessName, businessType, businessDescription, businessAddress,
        city, state, pincode, businessContact,
        gstNumber || null, regNumber || null,
        userResult.insertId, latNum, lngNum,
      ]
    );

    await connection.commit();

    const user = {
      id: userResult.insertId,
      email,
      role: 'owner',
      businessId: businessResult.insertId
    };

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Owner registered successfully',
      data: { token, user }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Register Customer
const registerCustomer = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      fullName, email, mobile, password,
      address, city, state, pincode,
      latitude, longitude,
    } = req.body;

    // Optional location
    const latNum =
      latitude !== undefined && latitude !== null && latitude !== ''
        ? parseFloat(latitude)
        : null;
    const lngNum =
      longitude !== undefined && longitude !== null && longitude !== ''
        ? parseFloat(longitude)
        : null;

    await connection.beginTransaction();

    // Check if user already exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const [userResult] = await connection.query(
      'INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, passwordHash, mobile, 'customer']
    );

        // Create customer profile (with optional location)
    await connection.query(
      'INSERT INTO customer_profiles (user_id, city, state, pincode, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [userResult.insertId, city, state, pincode, latNum, lngNum]
    );

    // Create address if provided
    if (address) {
      await connection.query(
        'INSERT INTO addresses (user_id, address_line, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?)',
        [userResult.insertId, address, city, state, pincode, true]
      );
    }

    await connection.commit();

    const user = {
      id: userResult.insertId,
      email,
      role: 'customer'
    };

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: { token, user }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const [users] = await pool.query(
      'SELECT id, full_name, email, password_hash, mobile, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get business ID for owners
    let businessId = null;
    if (user.role === 'owner') {
      const [businesses] = await pool.query(
        'SELECT id FROM businesses WHERE owner_id = ?',
        [user.id]
      );
      if (businesses.length > 0) {
        businessId = businesses[0].id;
      }
    }

    const tokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId
    };

    const token = generateToken(tokenUser);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          businessId
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, mobile, role, is_active FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    let businessId = null;
    let businessName = null;

    if (user.role === 'owner') {
      const [businesses] = await pool.query(
        'SELECT id, name FROM businesses WHERE owner_id = ?',
        [user.id]
      );
      if (businesses.length > 0) {
        businessId = businesses[0].id;
        businessName = businesses[0].name;
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        businessId,
        businessName
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
};

module.exports = {
  registerOwner,
  registerCustomer,
  login,
  getMe
};