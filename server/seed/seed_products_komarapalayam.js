// ============================================
// Seed products for Komarapalayam businesses
// Adds ~4-5 products per business with images
//
// SAFE:
//   - Uses INSERT ... WHERE NOT EXISTS pattern
//   - Skips if product (by business + sku) already exists
//   - Does NOT modify existing products
// ============================================

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('../config/database');

// Helper: build a unique SKU per business + product
const makeSku = (prefix, n) => `${prefix}-${String(n).padStart(3, '0')}`;

// Products by business type (reusable templates)
const pharmacyProducts = (businessIndex) => [
  {
    name: 'Paracetamol 500mg',
    category: 'Tablets',
    brand: 'Crocin',
    unit: 'strip',
    price: 32,
    cost: 22,
    stock: 100 - businessIndex * 10,
    min: 20,
    image:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
  },
  {
    name: 'Cough Syrup 100ml',
    category: 'Syrup',
    brand: 'Benadryl',
    unit: 'bottle',
    price: 95,
    cost: 70,
    stock: 45 - businessIndex * 3,
    min: 10,
    image:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
  },
  {
    name: 'Hand Sanitizer 500ml',
    category: 'Hygiene',
    brand: 'Dettol',
    unit: 'bottle',
    price: 180,
    cost: 140,
    stock: 60 - businessIndex * 5,
    min: 15,
    image:
      'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=400&q=80',
  },
  {
    name: 'Vitamin C Tablets',
    category: 'Supplements',
    brand: 'Limcee',
    unit: 'strip',
    price: 45,
    cost: 32,
    stock: 80 - businessIndex * 8,
    min: 15,
    image:
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=80',
  },
  {
    name: 'Digital Thermometer',
    category: 'Devices',
    brand: 'Dr. Morepen',
    unit: 'piece',
    price: 250,
    cost: 180,
    stock: 25 - businessIndex * 2,
    min: 5,
    image:
      'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&q=80',
  },
];

const groceryProducts = (businessIndex) => [
  {
    name: 'Sona Masoori Rice',
    category: 'Grains',
    brand: 'Local',
    unit: 'kg',
    price: 62 - businessIndex * 2,
    cost: 50 - businessIndex * 2,
    stock: 200 - businessIndex * 20,
    min: 30,
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
  },
  {
    name: 'Toor Dal',
    category: 'Pulses',
    brand: 'Tata',
    unit: 'kg',
    price: 165 - businessIndex * 3,
    cost: 135 - businessIndex * 3,
    stock: 80 - businessIndex * 10,
    min: 15,
    image:
      'https://images.unsplash.com/photo-1615485508627-3ae2d2b8d3bf?w=400&q=80',
  },
  {
    name: 'Sunflower Oil 1L',
    category: 'Oils',
    brand: 'Fortune',
    unit: 'litre',
    price: 145 - businessIndex * 2,
    cost: 120 - businessIndex * 2,
    stock: 70 - businessIndex * 8,
    min: 15,
    image:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
  },
  {
    name: 'Amul Milk 500ml',
    category: 'Dairy',
    brand: 'Amul',
    unit: 'packet',
    price: 30,
    cost: 25,
    stock: 100 - businessIndex * 10,
    min: 20,
    image:
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
  },
  {
    name: 'Tata Tea Gold 250g',
    category: 'Beverages',
    brand: 'Tata',
    unit: 'pack',
    price: 130 - businessIndex * 3,
    cost: 105 - businessIndex * 3,
    stock: 60 - businessIndex * 5,
    min: 12,
    image:
      'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&q=80',
  },
];

// Business logos (Unsplash)
const businessLogos = {
  'Sri Balaji Pharmacy':
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&q=80',
  'MedPlus Pharmacy':
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&q=80',
  'Kumar Provision Store':
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
  'Green Leaf Supermarket':
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200&q=80',
  'FreshMart Grocery':
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
  'StyleHub Textile':
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&q=80',
};

const seed = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🌱 Seeding products for Komarapalayam businesses...\n');

    // 1. Update business logos
    for (const [businessName, logoUrl] of Object.entries(businessLogos)) {
      const [result] = await connection.query(
        'UPDATE businesses SET logo_url = ? WHERE name = ? AND (logo_url IS NULL OR logo_url = "")',
        [logoUrl, businessName]
      );
      if (result.affectedRows > 0) {
        console.log(`✅ Logo set: ${businessName}`);
      } else {
        console.log(`⏭  Logo skipped (already set): ${businessName}`);
      }
    }

    console.log('');

    // 2. Get all businesses
    const [businesses] = await connection.query(
      'SELECT id, name, type FROM businesses WHERE is_active = TRUE ORDER BY id'
    );

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const b of businesses) {
      let products = [];
      let skuPrefix = '';

      if (b.type === 'Pharmacy') {
        products = pharmacyProducts(b.id % 2);
        skuPrefix = 'PHM';
      } else if (b.type === 'Grocery') {
        products = groceryProducts(b.id % 2);
        skuPrefix = 'GRC';
      } else if (b.type === 'Textile') {
        products = [
          {
            name: 'Cotton Fabric (per metre)',
            category: 'Fabric',
            brand: 'Local',
            unit: 'metre',
            price: 250,
            cost: 190,
            stock: 40,
            min: 10,
            image:
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
          },
          {
            name: 'Cotton Shirt',
            category: 'Shirts',
            brand: 'Peter England',
            unit: 'piece',
            price: 1200,
            cost: 900,
            stock: 25,
            min: 5,
            image:
              'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80',
          },
          {
            name: 'Silk Saree',
            category: 'Saree',
            brand: 'Kanjivaram',
            unit: 'piece',
            price: 5500,
            cost: 4500,
            stock: 12,
            min: 3,
            image:
              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
          },
          {
            name: 'Denim Fabric (per metre)',
            category: 'Fabric',
            brand: 'Arvind',
            unit: 'metre',
            price: 450,
            cost: 340,
            stock: 30,
            min: 8,
            image:
              'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
          },
          {
            name: 'Woolen Scarf',
            category: 'Accessories',
            brand: 'Pashmina',
            unit: 'piece',
            price: 800,
            cost: 620,
            stock: 18,
            min: 5,
            image:
              'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&q=80',
          },
        ];
        skuPrefix = 'TXT';
      } else {
        console.log(`⏭  Skipped (no template for type): ${b.name} (${b.type})`);
        continue;
      }

      let index = 1;
      for (const p of products) {
        const sku = makeSku(skuPrefix + '-' + b.id, index);

        // Skip if product already exists for this business + sku
        const [existing] = await connection.query(
          'SELECT id FROM products WHERE business_id = ? AND sku = ?',
          [b.id, sku]
        );

        if (existing.length > 0) {
          totalSkipped++;
          index++;
          continue;
        }

        await connection.query(
          `INSERT INTO products 
            (business_id, name, category, brand, unit, sku, price, cost_price, 
             stock_quantity, min_stock_level, image_url, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            b.id,
            p.name,
            p.category,
            p.brand,
            p.unit,
            sku,
            p.price,
            p.cost,
            p.stock,
            p.min,
            p.image,
          ]
        );

        totalInserted++;
        index++;
      }

      console.log(`✅ Products seeded: ${b.name} (${b.type})`);
    }

    console.log('\n🎉 Done!');
    console.log(`   Inserted: ${totalInserted}`);
    console.log(`   Skipped:  ${totalSkipped} (already existed)\n`);

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