// ============================================
// Demo Seed: Komarapalayam Region
// Adds 4 owners + 4 businesses + 1 customer
// All with real lat/lng for Nearby demo.
//
// SAFE:
//   - Uses INSERT only
//   - Skips if email already exists (idempotent)
//   - Does NOT touch existing rows
// ============================================

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const OWNER_PASSWORD = 'owner123';
const CUSTOMER_PASSWORD = 'customer123';

const owners = [
  {
    fullName: 'Karthik Raja',
    email: 'karthik@srbalaji.com',
    mobile: '9800000001',
    business: {
      name: 'Sri Balaji Pharmacy',
      type: 'Pharmacy',
      description: 'Trusted neighborhood pharmacy for medicines and health essentials.',
      address: '145 Kovai Main Road, Near Old Bus Stand',
      city: 'Komarapalayam',
      state: 'Tamil Nadu',
      pincode: '638183',
      contact: '9800000001',
      latitude: 11.4462,
      longitude: 77.6910,
    },
  },
  {
    fullName: 'Vignesh Murugan',
    email: 'vignesh@medplus.com',
    mobile: '9800000002',
    business: {
      name: 'MedPlus Pharmacy',
      type: 'Pharmacy',
      description: 'MedPlus chain pharmacy with prescription medicines and wellness products.',
      address: '22 Bazaar Street, Opposite SBI Bank',
      city: 'Komarapalayam',
      state: 'Tamil Nadu',
      pincode: '638183',
      contact: '9800000002',
      latitude: 11.4355,
      longitude: 77.6812,
    },
  },
  {
    fullName: 'Suresh Kumar',
    email: 'suresh@kumarprovision.com',
    mobile: '9800000003',
    business: {
      name: 'Kumar Provision Store',
      type: 'Grocery',
      description: 'Daily grocery essentials, fresh vegetables and household items.',
      address: '78 Gandhi Nagar, 2nd Cross',
      city: 'Komarapalayam',
      state: 'Tamil Nadu',
      pincode: '638183',
      contact: '9800000003',
      latitude: 11.4448,
      longitude: 77.6925,
    },
  },
  {
    fullName: 'Anitha Devi',
    email: 'anitha@greenleaf.com',
    mobile: '9800000004',
    business: {
      name: 'Green Leaf Supermarket',
      type: 'Grocery',
      description: 'Modern supermarket with groceries, snacks, dairy and household supplies.',
      address: '5 Namakkal Road, Near Collectorate',
      city: 'Komarapalayam',
      state: 'Tamil Nadu',
      pincode: '638183',
      contact: '9800000004',
      latitude: 11.4390,
      longitude: 77.6845,
    },
  },
];

const customer = {
  fullName: 'Meena Sundaram',
  email: 'meena@komarapalayam.com',
  mobile: '9800000005',
  address: '12 Periyar Street, Komarapalayam',
  city: 'Komarapalayam',
  state: 'Tamil Nadu',
  pincode: '638183',
  latitude: 11.4443,
  longitude: 77.6898,
};

const seed = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🌱 Seeding Komarapalayam demo data...\n');

    const ownerHash = await bcrypt.hash(OWNER_PASSWORD, 10);
    const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);

    // ---------- OWNERS + BUSINESSES ----------
    for (const o of owners) {
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [o.email]
      );

      if (existing.length > 0) {
        console.log(`⏭  Skipped (already exists): ${o.email}`);
        continue;
      }

      const [userResult] = await connection.query(
        'INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)',
        [o.fullName, o.email, ownerHash, o.mobile, 'owner']
      );

      const b = o.business;
      await connection.query(
        `INSERT INTO businesses 
          (name, type, description, address, city, state, pincode, contact, owner_id, latitude, longitude) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.name, b.type, b.description, b.address, b.city, b.state,
          b.pincode, b.contact, userResult.insertId, b.latitude, b.longitude,
        ]
      );

      console.log(`✅ Owner + Business: ${b.name} (${o.email})`);
    }

    // ---------- CUSTOMER ----------
    const [custExisting] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [customer.email]
    );

    if (custExisting.length > 0) {
      console.log(`⏭  Skipped (already exists): ${customer.email}`);
    } else {
      const [custResult] = await connection.query(
        'INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)',
        [customer.fullName, customer.email, customerHash, customer.mobile, 'customer']
      );

      await connection.query(
        `INSERT INTO customer_profiles (user_id, city, state, pincode, latitude, longitude) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          custResult.insertId,
          customer.city,
          customer.state,
          customer.pincode,
          customer.latitude,
          customer.longitude,
        ]
      );

      await connection.query(
        `INSERT INTO addresses (user_id, address_line, city, state, pincode, is_default, type) 
         VALUES (?, ?, ?, ?, ?, TRUE, 'shipping')`,
        [
          custResult.insertId,
          customer.address,
          customer.city,
          customer.state,
          customer.pincode,
        ]
      );

      console.log(`✅ Customer: ${customer.fullName} (${customer.email})`);
    }

    console.log('\n🎉 Komarapalayam seed complete!\n');
    console.log('📋 Demo Accounts');
    console.log('──────────────────────────────────────────');
    console.log('OWNERS (password: owner123)');
    owners.forEach((o) => console.log(`  ${o.email}  →  ${o.business.name}`));
    console.log('\nCUSTOMER (password: customer123)');
    console.log(`  ${customer.email}  →  ${customer.fullName}`);
    console.log('──────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    connection.release();
  }
};

seed();