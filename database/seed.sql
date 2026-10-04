-- ============================================
-- StockSense AI - Seed Data
-- Version: 4.0
-- Test accounts for demonstration
-- ============================================

USE stock_sense_ai;

-- Clear existing data in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE audit_logs;
TRUNCATE TABLE ai_insights;
TRUNCATE TABLE alerts;
TRUNCATE TABLE delivery_tracking;
TRUNCATE TABLE purchase_order_items;
TRUNCATE TABLE purchase_orders;
TRUNCATE TABLE payments;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE carts;
TRUNCATE TABLE addresses;
TRUNCATE TABLE supplier_products;
TRUNCATE TABLE suppliers;
TRUNCATE TABLE inventory_transactions;
TRUNCATE TABLE products;
TRUNCATE TABLE customer_profiles;
TRUNCATE TABLE businesses;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- USERS (passwords hashed with bcrypt)
-- Default passwords for development:
--   admin123    -> Super Admin
--   owner123    -> Owners
--   customer123 -> Customer
-- ============================================

INSERT INTO users (full_name, email, password_hash, mobile, role) VALUES
-- Super Admin
('Super Admin', 'admin@stocksense.com', 
 '$2b$10$X7nVxYz8Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0Uv1Wx2Yz3Ab4Cd5Ef', 
 '9999999999', 'super_admin'),

-- Owner 1 - FreshMart Grocery
('Rajesh Kumar', 'rajesh@freshmart.com', 
 '$2b$10$Gh4Ij5Kl6Mn7Op8Qr9St0Uv1Wx2Yz3Ab4Cd5Ef6Gh7Ij8Kl9Mn0Op1Qr', 
 '9876543210', 'owner'),

-- Owner 2 - StyleHub Textile
('Priya Sharma', 'priya@stylehub.com', 
 '$2b$10$St0Uv1Wx2Yz3Ab4Cd5Ef6Gh7Ij8Kl9Mn0Op1Qr2St3Uv4Wx5Yz6Ab7Cd', 
 '9876543211', 'owner'),

-- Customer
('Arun Patel', 'arun@email.com', 
 '$2b$10$8Ef9Gh0Ij1Kl2Mn3Op4Qr5St6Uv7Wx8Yz9Ab0Cd1Ef2Gh3Ij4Kl5Mn6', 
 '9876543212', 'customer');

-- ============================================
-- BUSINESSES
-- ============================================

INSERT INTO businesses (name, type, description, address, city, state, pincode, contact, owner_id) VALUES
-- Business 1: FreshMart Grocery (Owner ID 2)
('FreshMart Grocery', 'Grocery', 
 'Your trusted neighborhood grocery store offering fresh products daily. Wide range of grains, dairy, beverages, and household essentials.',
 '123 Main Market Road, Dadar West', 'Mumbai', 'Maharashtra', '400001', '9876543210', 2),

-- Business 2: StyleHub Textile (Owner ID 3)
('StyleHub Textile', 'Textile', 
 'Premium quality textiles and fabrics for all occasions. Specializing in traditional and modern fabric collections.',
 '456 Fashion Street, Bandra West', 'Mumbai', 'Maharashtra', '400002', '9876543211', 3);

-- ============================================
-- CUSTOMER PROFILES
-- ============================================

INSERT INTO customer_profiles (user_id, profile_image, city, state, pincode) VALUES
(4, NULL, 'Mumbai', 'Maharashtra', '400069');

-- ============================================
-- ADDRESSES
-- ============================================

INSERT INTO addresses (user_id, address_line, city, state, pincode, is_default, type) VALUES
-- Customer addresses
(4, '789 Customer Colony, Andheri East, Near Metro Station', 'Mumbai', 'Maharashtra', '400069', TRUE, 'shipping'),
(4, '789 Customer Colony, Andheri East', 'Mumbai', 'Maharashtra', '400069', TRUE, 'billing'),

-- Alternative addresses for testing
(4, '456 Business Park, Powai', 'Mumbai', 'Maharashtra', '400076', FALSE, 'shipping');

-- ============================================
-- SUPPLIERS (Business 1: FreshMart)
-- ============================================

INSERT INTO suppliers (business_id, name, company_name, phone, email, address, city, state, pincode, avg_delivery_time, notes) VALUES
(1, 'Amit Distributors', 'Amit Food Supply Co.', '8888888881', 'amit@foodsupply.com', 
 '12-14 Wholesale Market, Vashi Sector 19', 'Navi Mumbai', 'Maharashtra', '400703', 3,
 'Reliable supplier for grains and pulses. Usually delivers within 2-3 days.'),

(1, 'Fresh Farms Ltd', 'Fresh Farms Limited', '8888888882', 'orders@freshfarms.com', 
 '34 Agriculture Hub, MIDC Area', 'Pune', 'Maharashtra', '411001', 5,
 'Good for dairy products and fresh items. Weekly deliveries.');

-- Suppliers (Business 2: StyleHub)
INSERT INTO suppliers (business_id, name, company_name, phone, email, address, city, state, pincode, avg_delivery_time, notes) VALUES
(2, 'Textile Traders India', 'Textile Traders India Pvt Ltd', '8888888883', 'orders@textiletraders.com', 
 '56 Fabric Market, Ring Road, Textile Zone', 'Surat', 'Gujarat', '395001', 4,
 'Premium fabric supplier. Large variety of cotton and silk materials.'),

(2, 'Fashion Fabrics Co.', 'Fashion Fabrics Corporation', '8888888884', 'info@fashionfabrics.com', 
 '78 Industrial Area, Western Express Highway', 'Mumbai', 'Maharashtra', '400004', 2,
 'Quick delivery for denim and modern fabrics. Local Mumbai supplier.');

-- ============================================
-- PRODUCTS (Business 1: FreshMart Grocery)
-- ============================================

INSERT INTO products (business_id, name, category, brand, unit, sku, price, cost_price, stock_quantity, min_stock_level, max_stock_level) VALUES
-- Grains category
(1, 'Basmati Rice Premium', 'Grains', 'India Gate', 'kg', 'GRN-RICE-001', 180.00, 150.00, 100.000, 20.000, 200.000),
(1, 'Whole Wheat Atta', 'Grains', 'Aashirvaad', 'kg', 'GRN-ATTA-002', 45.00, 35.00, 80.000, 15.000, 150.000),

-- Groceries category
(1, 'Refined Sugar', 'Groceries', 'Madhur', 'kg', 'GRO-SUGAR-001', 42.00, 38.00, 150.000, 25.000, 300.000),

-- Oils category
(1, 'Sunflower Oil', 'Oils', 'Fortune', 'litre', 'OIL-SUN-001', 165.00, 140.00, 60.000, 10.000, 120.000),

-- Pulses category
(1, 'Toor Dal', 'Pulses', 'Tata Sampann', 'kg', 'PUL-DAL-001', 160.00, 130.00, 45.000, 10.000, 100.000),

-- Dairy category
(1, 'Fresh Milk Full Cream', 'Dairy', 'Amul', 'litre', 'DRY-MILK-001', 58.00, 48.00, 30.000, 5.000, 50.000),

-- Bakery category
(1, 'Brown Bread', 'Bakery', 'Britannia', 'pack', 'BAK-BRD-001', 35.00, 28.00, 25.000, 5.000, 40.000),

-- Beverages category
(1, 'Premium Tea', 'Beverages', 'Taj Mahal', 'kg', 'BEV-TEA-001', 380.00, 320.00, 40.000, 8.000, 80.000);

-- Products (Business 2: StyleHub Textile)
INSERT INTO products (business_id, name, category, brand, unit, sku, price, cost_price, stock_quantity, min_stock_level, max_stock_level) VALUES
-- Fabric category
(2, 'Premium Cotton Fabric', 'Fabric', 'Raymond', 'metre', 'FAB-COT-001', 250.00, 200.00, 50.000, 10.000, 100.000),

-- Saree category
(2, 'Pure Silk Saree', 'Saree', 'Kanjivaram', 'piece', 'SAR-SILK-001', 5500.00, 4500.00, 15.000, 3.000, 30.000),

-- Fabric category
(2, 'Stretch Denim Fabric', 'Fabric', 'Levis', 'metre', 'FAB-DEN-001', 450.00, 380.00, 30.000, 5.000, 60.000),

-- Shirts category
(2, 'Formal Cotton Shirt', 'Shirts', 'Peter England', 'piece', 'SHT-FRM-001', 1200.00, 900.00, 25.000, 5.000, 50.000),

-- Accessories category
(2, 'Woolen Pashmina Scarf', 'Accessories', 'Pashmina', 'piece', 'ACC-SCF-001', 800.00, 600.00, 20.000, 4.000, 40.000);

-- ============================================
-- SUPPLIER-PRODUCT RELATIONSHIPS
-- ============================================

-- FreshMart supplier-product mappings
INSERT INTO supplier_products (supplier_id, product_id, unit_price, is_preferred, lead_time_days, minimum_order_quantity) VALUES
-- Amit Distributors products
(1, 1, 150.00, TRUE, 2, 10.000),   -- Basmati Rice
(1, 2, 35.00, TRUE, 2, 10.000),    -- Wheat Atta
(1, 3, 38.00, TRUE, 2, 25.000),    -- Sugar
(1, 5, 130.00, TRUE, 2, 10.000),   -- Toor Dal
(1, 8, 320.00, TRUE, 2, 5.000),    -- Tea

-- Fresh Farms products
(2, 4, 140.00, TRUE, 4, 5.000),    -- Sunflower Oil
(2, 6, 48.00, TRUE, 4, 10.000),    -- Milk
(2, 7, 28.00, FALSE, 4, 10.000);   -- Bread

-- StyleHub supplier-product mappings
INSERT INTO supplier_products (supplier_id, product_id, unit_price, is_preferred, lead_time_days, minimum_order_quantity) VALUES
-- Textile Traders products
(3, 9, 200.00, TRUE, 3, 5.000),    -- Cotton Fabric
(3, 10, 4500.00, TRUE, 5, 1.000),  -- Silk Saree
(3, 13, 600.00, TRUE, 3, 2.000),   -- Woolen Scarf

-- Fashion Fabrics products
(4, 11, 380.00, TRUE, 2, 5.000),   -- Denim Fabric
(4, 12, 900.00, TRUE, 2, 3.000);   -- Formal Shirt

-- ============================================
-- SAMPLE ORDER (Demonstration Data)
-- Order from FreshMart by Arun Patel
-- ============================================

-- Create sample order
INSERT INTO orders (
    customer_id, business_id, order_number, total_amount, 
    payment_method, payment_status, order_status, 
    shipping_address_id, shipping_address_snapshot, 
    order_date, delivery_date
) VALUES (
    4, 1, 'ORD-2024-001', 490.00,
    'online', 'paid', 'delivered',
    1, 
    JSON_OBJECT(
        'address_line', '789 Customer Colony, Andheri East, Near Metro Station',
        'city', 'Mumbai',
        'state', 'Maharashtra',
        'pincode', '400069',
        'type', 'shipping'
    ),
    '2024-01-10 10:30:00',
    '2024-01-12 14:00:00'
);

-- Create order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, product_snapshot) VALUES
(1, 1, 2.000, 180.00, 360.00, 
 JSON_OBJECT('name', 'Basmati Rice Premium', 'brand', 'India Gate', 'unit', 'kg')),
(1, 3, 1.000, 130.00, 130.00,
 JSON_OBJECT('name', 'Refined Sugar', 'brand', 'Madhur', 'unit', 'kg'));

-- Create payment record
INSERT INTO payments (order_id, amount, payment_method, transaction_id, status, payment_date) VALUES
(1, 490.00, 'online', 'TXN-DEMO-001', 'paid', '2024-01-10 10:35:00');

-- Create delivery tracking
INSERT INTO delivery_tracking (reference_type, reference_id, status, location, notes) VALUES
('order', 1, 'delivered', 'Mumbai', 'Package delivered to customer'),
('order', 1, 'shipped', 'Mumbai Hub', 'Package out for delivery'),
('order', 1, 'confirmed', 'FreshMart Store', 'Order confirmed and packed');

-- ============================================
-- SAMPLE PURCHASE ORDER (Demonstration Data)
-- ============================================

INSERT INTO purchase_orders (
    business_id, supplier_id, order_number, total_amount, 
    status, expected_delivery_date, created_by, notes
) VALUES (
    1, 1, 'PO-2024-001', 15000.00,
    'created', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 
    2, 'Regular stock replenishment order'
);

INSERT INTO purchase_order_items (
    purchase_order_id, product_id, quantity, unit_price, total_price
) VALUES
(1, 1, 100.000, 150.00, 15000.00);

-- ============================================
-- SAMPLE CARTS (Demonstration Data)
-- ============================================

-- Cart for Arun Patel at FreshMart
INSERT INTO carts (customer_id, business_id, status) VALUES
(4, 1, 'active');

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(1, 2, 3.000),  -- 3 kg Wheat Atta
(1, 6, 2.000);  -- 2 litre Milk

-- Cart for Arun Patel at StyleHub
INSERT INTO carts (customer_id, business_id, status) VALUES
(4, 2, 'active');

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(2, 9, 5.000);  -- 5 metre Cotton Fabric

-- ============================================
-- SAMPLE INVENTORY TRANSACTIONS
-- ============================================

INSERT INTO inventory_transactions (
    product_id, business_id, transaction_type, quantity, 
    reference_type, reference_id, previous_stock, new_stock, notes, performed_by
) VALUES
(1, 1, 'stock_out', 2.000, 'order_item', 1, 102.000, 100.000, 'Order #ORD-2024-001', 2),
(3, 1, 'stock_out', 1.000, 'order_item', 2, 151.000, 150.000, 'Order #ORD-2024-001', 2);

-- ============================================
-- SAMPLE ALERTS
-- ============================================

INSERT INTO alerts (business_id, product_id, alert_type, message, severity) VALUES
(1, 5, 'reorder', 'Low stock alert: Toor Dal has only 45 kg remaining. Min level: 10 kg', 'medium'),
(2, 10, 'reorder', 'Low stock alert: Pure Silk Saree has only 15 pieces remaining. Min level: 3 pieces', 'low');

-- ============================================
-- SAMPLE AI INSIGHTS
-- ============================================

INSERT INTO ai_insights (business_id, insight_type, title, description, data, confidence_score) VALUES
(1, 'demand_analysis', 'Basmati Rice Demand Increasing', 
 'Based on recent sales data, Basmati Rice Premium has shown a 15% increase in demand over the past 2 weeks. Consider increasing stock levels to meet growing demand.',
 JSON_OBJECT('product_id', 1, 'demand_increase_percent', 15, 'period', '2 weeks'),
 0.85),

(1, 'stock_out_prediction', 'Toor Dal Stock Risk', 
 'Current stock of Toor Dal (45 kg) may run out within 4 days based on average daily sales of 12 kg. Supplier lead time is 2 days. Recommended reorder: 60 kg.',
 JSON_OBJECT('product_id', 5, 'days_remaining', 4, 'recommended_reorder', 60),
 0.92);

-- ============================================
-- SAMPLE AUDIT LOGS
-- ============================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES
(2, 'CREATE', 'product', 1, JSON_OBJECT('action', 'Product created', 'product_name', 'Basmati Rice Premium')),
(2, 'UPDATE', 'product', 5, JSON_OBJECT('action', 'Stock updated', 'old_stock', 50, 'new_stock', 45)),
(4, 'PLACE_ORDER', 'order', 1, JSON_OBJECT('action', 'Order placed', 'amount', 490.00)),
(1, 'LOGIN', 'user', 1, JSON_OBJECT('action', 'Super Admin logged in'));

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================

-- Uncomment to verify data integrity:
/*
SELECT COUNT(*) as 'Total Users' FROM users;
SELECT COUNT(*) as 'Total Businesses' FROM businesses;
SELECT COUNT(*) as 'Total Products' FROM products;
SELECT COUNT(*) as 'Total Suppliers' FROM suppliers;
SELECT COUNT(*) as 'Supplier-Product Mappings' FROM supplier_products;
SELECT COUNT(*) as 'Total Orders' FROM orders;
SELECT COUNT(*) as 'Total Order Items' FROM order_items;
SELECT COUNT(*) as 'Cart Items' FROM cart_items;
*/

COMMIT;

-- ============================================
-- END OF SEED DATA
-- ============================================