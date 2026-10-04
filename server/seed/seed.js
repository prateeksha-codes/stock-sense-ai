require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    const connection = await pool.getConnection();

    // Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'audit_logs', 'ai_insights', 'alerts', 'delivery_tracking',
      'purchase_order_items', 'purchase_orders', 'payments', 'order_items',
      'orders', 'cart_items', 'carts', 'addresses', 'supplier_products',
      'suppliers', 'inventory_transactions', 'products', 'customer_profiles',
      'businesses', 'users'
    ];
    
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const ownerPassword = await bcrypt.hash('owner123', salt);
    const customerPassword = await bcrypt.hash('customer123', salt);

    // Create users
    console.log('Creating users...');
    await connection.query(
      'INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)',
      ['Super Admin', 'admin@stocksense.com', adminPassword, '9999999999', 'super_admin']
    );

    const [owner1] = await connection.query(
      'INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)',
      ['Rajesh Kumar', 'rajesh@freshmart.com', ownerPassword, '9876543210', 'owner']
    );

    const [owner2] = await connection.query(
      'INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)',
      ['Priya Sharma', 'priya@stylehub.com', ownerPassword, '9876543211', 'owner']
    );

    await connection.query(
      'INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)',
      ['Arun Patel', 'arun@email.com', customerPassword, '9876543212', 'customer']
    );
    console.log('✅ Users created');

    // Create businesses
    console.log('Creating businesses...');
    const [business1] = await connection.query(
      `INSERT INTO businesses (name, type, description, address, city, state, pincode, contact, owner_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['FreshMart Grocery', 'Grocery', 'Your neighborhood grocery store with fresh products daily',
       '123 Main Market Road', 'Mumbai', 'Maharashtra', '400001', '9876543210', owner1.insertId]
    );

    const [business2] = await connection.query(
      `INSERT INTO businesses (name, type, description, address, city, state, pincode, contact, owner_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['StyleHub Textile', 'Textile', 'Premium quality textiles and fabrics for all occasions',
       '456 Fashion Street', 'Mumbai', 'Maharashtra', '400002', '9876543211', owner2.insertId]
    );
    console.log('✅ Businesses created');

    // Create customer profile
    await connection.query(
      'INSERT INTO customer_profiles (user_id, city, state) VALUES (?, ?, ?)',
      [4, 'Mumbai', 'Maharashtra']
    );

    // Create address
    await connection.query(
      'INSERT INTO addresses (user_id, address_line, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [4, '789 Customer Colony, Andheri East', 'Mumbai', 'Maharashtra', '400069', true]
    );

    console.log('✅ Customer profile created');

    // Create suppliers for FreshMart
    const [supplier1] = await connection.query(
      'INSERT INTO suppliers (business_id, name, company_name, phone, email, address, city, state, pincode, avg_delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [business1.insertId, 'Amit Distributors', 'Amit Food Supply Co.', '8888888881', 'amit@foodsupply.com',
       '12 Wholesale Market', 'Mumbai', 'Maharashtra', '400003', 3]
    );

    await connection.query(
      'INSERT INTO suppliers (business_id, name, company_name, phone, email, address, city, state, pincode, avg_delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [business1.insertId, 'Fresh Farms Ltd', 'Fresh Farms Limited', '8888888882', 'orders@freshfarms.com',
       '34 Agriculture Hub', 'Pune', 'Maharashtra', '411001', 5]
    );

    const [supplier3] = await connection.query(
      'INSERT INTO suppliers (business_id, name, company_name, phone, email, address, city, state, pincode, avg_delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [business2.insertId, 'Textile Traders', 'Textile Traders India Pvt Ltd', '8888888883', 'orders@textiletraders.com',
       '56 Fabric Market', 'Surat', 'Gujarat', '395001', 4]
    );
    console.log('✅ Suppliers created');

    // Create products for FreshMart
    const products1 = [
      { name: 'Basmati Rice', category: 'Grains', brand: 'India Gate', unit: 'kg', sku: 'GRN-001', price: 180, cost: 150, stock: 100, min: 20 },
      { name: 'Wheat Flour', category: 'Grains', brand: 'Aashirvaad', unit: 'kg', sku: 'GRN-002', price: 45, cost: 35, stock: 80, min: 15 },
      { name: 'Sugar', category: 'Groceries', brand: 'Madhur', unit: 'kg', sku: 'GRO-001', price: 42, cost: 38, stock: 150, min: 25 },
      { name: 'Cooking Oil', category: 'Oils', brand: 'Fortune', unit: 'litre', sku: 'OIL-001', price: 165, cost: 140, stock: 60, min: 10 },
    ];

    for (const p of products1) {
      const [prod] = await connection.query(
        'INSERT INTO products (business_id, name, category, brand, unit, sku, price, cost_price, stock_quantity, min_stock_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [business1.insertId, p.name, p.category, p.brand, p.unit, p.sku, p.price, p.cost, p.stock, p.min]
      );
      
      // Link to supplier
      await connection.query(
        'INSERT INTO supplier_products (supplier_id, product_id, unit_price, is_preferred) VALUES (?, ?, ?, ?)',
        [supplier1.insertId, prod.insertId, p.cost, true]
      );
    }

    // Create products for StyleHub
    const products2 = [
      { name: 'Cotton Fabric', category: 'Fabric', brand: 'Raymond', unit: 'metre', sku: 'FAB-001', price: 250, cost: 200, stock: 50, min: 10 },
      { name: 'Silk Saree', category: 'Saree', brand: 'Kanjivaram', unit: 'piece', sku: 'SAR-001', price: 5500, cost: 4500, stock: 15, min: 3 },
    ];

    for (const p of products2) {
      const [prod] = await connection.query(
        'INSERT INTO products (business_id, name, category, brand, unit, sku, price, cost_price, stock_quantity, min_stock_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [business2.insertId, p.name, p.category, p.brand, p.unit, p.sku, p.price, p.cost, p.stock, p.min]
      );
      
      await connection.query(
        'INSERT INTO supplier_products (supplier_id, product_id, unit_price, is_preferred) VALUES (?, ?, ?, ?)',
        [supplier3.insertId, prod.insertId, p.cost, true]
      );
    }
    console.log('✅ Products created');

    connection.release();
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 TEST ACCOUNTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Email: admin@stocksense.com');
    console.log('  Password: admin123');
    console.log('  Role: super_admin');
    console.log('');
    console.log('Owner 1 (FreshMart Grocery):');
    console.log('  Email: rajesh@freshmart.com');
    console.log('  Password: owner123');
    console.log('  Role: owner');
    console.log('');
    console.log('Owner 2 (StyleHub Textile):');
    console.log('  Email: priya@stylehub.com');
    console.log('  Password: owner123');
    console.log('  Role: owner');
    console.log('');
    console.log('Customer:');
    console.log('  Email: arun@email.com');
    console.log('  Password: customer123');
    console.log('  Role: customer');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();