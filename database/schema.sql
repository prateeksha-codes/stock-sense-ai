-- ============================================
-- StockSense AI - Database Schema
-- Version: 4.0 (Production Ready)
-- Platform: MySQL 8.0+
-- Last Updated: 2024-01-15
-- ============================================

CREATE DATABASE IF NOT EXISTS stock_sense_ai
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE stock_sense_ai;

-- ============================================
-- 1. USERS TABLE
-- Supports exactly 3 roles: super_admin, owner, customer
-- No supplier login role
-- ============================================

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    role ENUM('super_admin', 'owner', 'customer') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_users_email UNIQUE KEY (email),
    CONSTRAINT chk_users_email CHECK (email LIKE '%_@_%._%' AND LENGTH(email) >= 5),
    CONSTRAINT chk_users_mobile CHECK (mobile REGEXP '^[0-9]{10}$'),
    
    -- Indexes
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active),
    INDEX idx_users_role_active (role, is_active),
    INDEX idx_users_email_role (email, role),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Core users table - 3 roles only: super_admin, owner, customer';

-- ============================================
-- 2. BUSINESSES TABLE
-- Each business has exactly ONE owner (UNIQUE constraint)
-- ============================================

CREATE TABLE businesses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    contact VARCHAR(15) NOT NULL,
    gst_number VARCHAR(15) NULL,
    reg_number VARCHAR(50) NULL,
    logo_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_businesses_owner UNIQUE KEY (owner_id),
    CONSTRAINT fk_businesses_owner FOREIGN KEY (owner_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_businesses_pincode CHECK (pincode REGEXP '^[0-9]{6}$'),
    CONSTRAINT chk_businesses_contact CHECK (contact REGEXP '^[0-9]{10}$'),
    
    -- Indexes
    INDEX idx_businesses_type (type),
    INDEX idx_businesses_city (city),
    INDEX idx_businesses_active (is_active),
    INDEX idx_businesses_type_active (type, is_active),
    INDEX idx_businesses_name (name),
    FULLTEXT INDEX ft_businesses_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Business entities - each owned by exactly one owner';

-- ============================================
-- 3. CUSTOMER PROFILES TABLE
-- Extended profile data for customer users
-- ============================================

CREATE TABLE customer_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    profile_image VARCHAR(500) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    pincode VARCHAR(6) NULL,
    date_of_birth DATE NULL,
    preferences JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_customer_profiles_user UNIQUE KEY (user_id),
    CONSTRAINT fk_customer_profiles_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_customer_profiles_pincode CHECK (pincode IS NULL OR pincode REGEXP '^[0-9]{6}$'),
    
    -- Indexes
    INDEX idx_cp_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Extended profile information for customer users';

-- ============================================
-- 4. ADDRESSES TABLE
-- Multiple addresses per user (shipping and billing)
-- ============================================

CREATE TABLE addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    type ENUM('shipping', 'billing') NOT NULL DEFAULT 'shipping',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_addresses_pincode CHECK (pincode REGEXP '^[0-9]{6}$'),
    
    -- Indexes
    INDEX idx_addresses_user (user_id),
    INDEX idx_addresses_user_default (user_id, is_default),
    INDEX idx_addresses_user_type (user_id, type),
    INDEX idx_addresses_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Customer shipping and billing addresses';

-- ============================================
-- 5. PRODUCTS TABLE
-- Products belong to businesses with UNIQUE SKU per business
-- Uses DECIMAL(12,2) for monetary values
-- Uses DECIMAL(12,3) for quantities
-- ============================================

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NULL,
    unit VARCHAR(50) NULL DEFAULT 'piece',
    sku VARCHAR(100) NULL,
    description TEXT NULL,
    price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2) NULL,
    stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    min_stock_level DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    max_stock_level DECIMAL(12,3) NULL,
    image_url VARCHAR(500) NULL,
    custom_attributes JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_products_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_products_business_sku UNIQUE KEY (business_id, sku),
    CONSTRAINT chk_products_price CHECK (price >= 0),
    CONSTRAINT chk_products_cost CHECK (cost_price IS NULL OR cost_price >= 0),
    CONSTRAINT chk_products_stock CHECK (stock_quantity >= 0),
    CONSTRAINT chk_products_min_stock CHECK (min_stock_level >= 0),
    CONSTRAINT chk_products_name CHECK (LENGTH(name) >= 2),
    
    -- Indexes
    INDEX idx_products_business (business_id),
    INDEX idx_products_category (category),
    INDEX idx_products_brand (brand),
    INDEX idx_products_active (is_active),
    INDEX idx_products_stock (stock_quantity),
    INDEX idx_products_business_category (business_id, category),
    INDEX idx_products_business_active (business_id, is_active),
    INDEX idx_products_business_stock (business_id, stock_quantity),
    INDEX idx_products_name (name),
    FULLTEXT INDEX ft_products_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Products catalog with unique SKU per business';

-- ============================================
-- 6. SUPPLIERS TABLE
-- Business suppliers (NOT a login role)
-- Performance fields maintained by backend services
-- ============================================

CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200) NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    pincode VARCHAR(6) NULL,
    notes TEXT NULL,
    avg_delivery_time DECIMAL(5,1) NOT NULL DEFAULT 0,
    total_orders INT NOT NULL DEFAULT 0,
    delayed_orders INT NOT NULL DEFAULT 0,
    on_time_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    performance_score DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_suppliers_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_suppliers_phone CHECK (phone REGEXP '^[0-9]{10}$'),
    CONSTRAINT chk_suppliers_email CHECK (email LIKE '%_@_%._%'),
    CONSTRAINT chk_suppliers_pincode CHECK (pincode IS NULL OR pincode REGEXP '^[0-9]{6}$'),
    CONSTRAINT chk_suppliers_performance CHECK (on_time_percentage >= 0 AND on_time_percentage <= 100),
    CONSTRAINT chk_suppliers_score CHECK (performance_score >= 0 AND performance_score <= 5),
    
    -- Indexes
    INDEX idx_suppliers_business (business_id),
    INDEX idx_suppliers_active (is_active),
    INDEX idx_suppliers_performance (performance_score),
    INDEX idx_suppliers_business_active (business_id, is_active),
    INDEX idx_suppliers_email (email),
    INDEX idx_suppliers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Business suppliers - NOT system users, managed by business owners';

-- ============================================
-- 7. SUPPLIER_PRODUCTS TABLE
-- Many-to-many relationship: suppliers ↔ products
-- Uses DECIMAL(12,2) for monetary values
-- ============================================

CREATE TABLE supplier_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    product_id INT NOT NULL,
    unit_price DECIMAL(12,2) NULL,
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
    lead_time_days INT NULL,
    minimum_order_quantity DECIMAL(12,3) NULL DEFAULT 1.000,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_sp_supplier FOREIGN KEY (supplier_id) 
        REFERENCES suppliers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sp_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_supplier_product UNIQUE KEY (supplier_id, product_id),
    CONSTRAINT chk_sp_unit_price CHECK (unit_price IS NULL OR unit_price >= 0),
    CONSTRAINT chk_sp_moq CHECK (minimum_order_quantity IS NULL OR minimum_order_quantity > 0),
    
    -- Indexes
    INDEX idx_sp_supplier (supplier_id),
    INDEX idx_sp_product (product_id),
    INDEX idx_sp_preferred (supplier_id, is_preferred)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Many-to-many relationship between suppliers and products';

-- ============================================
-- 8. CARTS TABLE
-- One cart per customer per business (separated)
-- ============================================

CREATE TABLE carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    business_id INT NOT NULL,
    status ENUM('active', 'checkout', 'abandoned', 'converted') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_carts_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_customer_business_cart UNIQUE KEY (customer_id, business_id),
    
    -- Indexes
    INDEX idx_carts_customer (customer_id),
    INDEX idx_carts_business (business_id),
    INDEX idx_carts_status (status),
    INDEX idx_carts_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Shopping carts - one per customer per business';

-- ============================================
-- 9. CART_ITEMS TABLE
-- Items within a cart with unique product per cart
-- Uses DECIMAL(12,3) for quantities
-- ============================================

CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 1.000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id) 
        REFERENCES carts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ci_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_cart_product UNIQUE KEY (cart_id, product_id),
    CONSTRAINT chk_ci_quantity CHECK (quantity > 0),
    
    -- Indexes
    INDEX idx_ci_cart (cart_id),
    INDEX idx_ci_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Cart items - unique product per cart';

-- ============================================
-- 10. ORDERS TABLE
-- Customer orders with shipping address snapshot
-- Uses DECIMAL(12,2) for monetary values
-- ============================================

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    business_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    shipping_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('online', 'cod') NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    order_status ENUM('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'placed',
    shipping_address_id INT NULL,
    shipping_address_snapshot JSON NULL,
    notes TEXT NULL,
    cancellation_reason TEXT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) 
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orders_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orders_address FOREIGN KEY (shipping_address_id) 
        REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT uq_orders_number UNIQUE KEY (order_number),
    CONSTRAINT chk_orders_total CHECK (total_amount >= 0),
    CONSTRAINT chk_orders_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_orders_tax CHECK (tax_amount >= 0),
    CONSTRAINT chk_orders_shipping CHECK (shipping_charges >= 0),
    CONSTRAINT chk_orders_delivery_date CHECK (delivery_date IS NULL OR delivery_date >= order_date),
    
    -- Indexes
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_business (business_id),
    INDEX idx_orders_status (order_status),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_date (order_date),
    INDEX idx_orders_business_date (business_id, order_date),
    INDEX idx_orders_business_status (business_id, order_status),
    INDEX idx_orders_customer_date (customer_id, order_date),
    INDEX idx_orders_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Customer orders with historical shipping address snapshot';

-- ============================================
-- 11. ORDER_ITEMS TABLE
-- Items within orders with UNIQUE product per order
-- Uses DECIMAL(12,2) for monetary values
-- Uses DECIMAL(12,3) for quantities
-- ============================================

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    product_snapshot JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) 
        REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_order_product UNIQUE KEY (order_id, product_id),
    CONSTRAINT chk_oi_quantity CHECK (quantity > 0),
    CONSTRAINT chk_oi_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_oi_total_price CHECK (total_price >= 0),
    CONSTRAINT chk_oi_discount CHECK (discount_amount >= 0),
    
    -- Indexes
    INDEX idx_oi_order (order_id),
    INDEX idx_oi_product (product_id),
    INDEX idx_oi_order_product (order_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Order items - unique product per order with price snapshot';

-- ============================================
-- 12. PAYMENTS TABLE
-- Payment records with unique order reference
-- Uses DECIMAL(12,2) for monetary values
-- ============================================

CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('online', 'cod') NOT NULL,
    transaction_id VARCHAR(255) NULL,
    gateway_response JSON NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP NULL,
    refund_date TIMESTAMP NULL,
    refund_transaction_id VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) 
        REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_payments_order UNIQUE KEY (order_id),
    CONSTRAINT chk_payments_amount CHECK (amount >= 0),
    CONSTRAINT chk_payments_refund CHECK (refund_date IS NULL OR refund_date >= payment_date),
    
    -- Indexes
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_transaction (transaction_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_date (payment_date),
    INDEX idx_payments_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Payment records - one payment per order';

-- ============================================
-- 13. PURCHASE_ORDERS TABLE
-- Purchase orders from suppliers
-- Uses DECIMAL(12,2) for monetary values
-- ============================================

CREATE TABLE purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    supplier_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('created', 'ordered', 'shipped', 'received', 'cancelled', 'delayed') NOT NULL DEFAULT 'created',
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date DATE NOT NULL,
    actual_delivery_date DATE NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_po_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) 
        REFERENCES suppliers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_po_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_po_number UNIQUE KEY (order_number),
    CONSTRAINT chk_po_total CHECK (total_amount >= 0),
    CONSTRAINT chk_po_delivery CHECK (expected_delivery_date >= DATE(order_date)),
    CONSTRAINT chk_po_actual_delivery CHECK (actual_delivery_date IS NULL OR actual_delivery_date >= expected_delivery_date),
    
    -- Indexes
    INDEX idx_po_business (business_id),
    INDEX idx_po_supplier (supplier_id),
    INDEX idx_po_status (status),
    INDEX idx_po_date (order_date),
    INDEX idx_po_expected_delivery (expected_delivery_date),
    INDEX idx_po_business_status (business_id, status),
    INDEX idx_po_supplier_status (supplier_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Purchase orders from suppliers with delivery tracking';

-- ============================================
-- 14. PURCHASE_ORDER_ITEMS TABLE
-- Items within purchase orders with UNIQUE product per PO
-- Uses DECIMAL(12,2) for monetary values
-- Uses DECIMAL(12,3) for quantities
-- ============================================

CREATE TABLE purchase_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    received_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_poi_po FOREIGN KEY (purchase_order_id) 
        REFERENCES purchase_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_poi_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_po_product UNIQUE KEY (purchase_order_id, product_id),
    CONSTRAINT chk_poi_quantity CHECK (quantity > 0),
    CONSTRAINT chk_poi_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_poi_total_price CHECK (total_price >= 0),
    CONSTRAINT chk_poi_received CHECK (received_quantity >= 0 AND received_quantity <= quantity),
    
    -- Indexes
    INDEX idx_poi_po (purchase_order_id),
    INDEX idx_poi_product (product_id),
    INDEX idx_poi_po_product (purchase_order_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Purchase order items - unique product per purchase order';

-- ============================================
-- 15. DELIVERY_TRACKING TABLE
-- Generic delivery tracking with polymorphic references
-- Backend validates reference integrity
-- ============================================

CREATE TABLE delivery_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference_type ENUM('order', 'purchase_order') NOT NULL,
    reference_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(200) NULL,
    notes TEXT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_dt_updated_by FOREIGN KEY (updated_by) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_dt_status CHECK (LENGTH(status) >= 2),
    
    -- Indexes
    INDEX idx_dt_reference (reference_type, reference_id),
    INDEX idx_dt_status (status),
    INDEX idx_dt_date (created_at),
    INDEX idx_dt_reference_status (reference_type, reference_id, status),
    INDEX idx_dt_updated_by (updated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Generic delivery tracking for orders and purchase orders - validated at application level';

-- ============================================
-- 16. INVENTORY_TRANSACTIONS TABLE
-- Complete audit trail of all stock movements
-- Uses DECIMAL(12,3) for quantities
-- ============================================

CREATE TABLE inventory_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    business_id INT NOT NULL,
    transaction_type ENUM('stock_in', 'stock_out', 'damaged', 'returned', 'adjustment') NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id INT NULL,
    previous_stock DECIMAL(12,3) NULL,
    new_stock DECIMAL(12,3) NULL,
    notes TEXT NULL,
    performed_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_it_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_it_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_it_performed_by FOREIGN KEY (performed_by) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_it_quantity CHECK (quantity != 0),
    
    -- Indexes
    INDEX idx_it_product (product_id),
    INDEX idx_it_business (business_id),
    INDEX idx_it_type (transaction_type),
    INDEX idx_it_date (created_at),
    INDEX idx_it_reference (reference_type, reference_id),
    INDEX idx_it_product_date (product_id, created_at),
    INDEX idx_it_business_date (business_id, created_at),
    INDEX idx_it_performed_by (performed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Complete inventory audit trail - all stock movements tracked';

-- ============================================
-- 17. ALERTS TABLE
-- Automated notifications for business issues
-- ============================================

CREATE TABLE alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    product_id INT NULL,
    alert_type ENUM('stock_out', 'dead_stock', 'reorder', 'payment_pending', 'delivery_delayed') NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    read_by INT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_alerts_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_alerts_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alerts_read_by FOREIGN KEY (read_by) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_alerts_read CHECK (read_at IS NULL OR is_read = TRUE),
    CONSTRAINT chk_alerts_resolved CHECK (resolved_at IS NULL OR resolved = TRUE),
    
    -- Indexes
    INDEX idx_alerts_business (business_id),
    INDEX idx_alerts_read (business_id, is_read),
    INDEX idx_alerts_type (business_id, alert_type),
    INDEX idx_alerts_severity (severity),
    INDEX idx_alerts_business_unread (business_id, is_read, severity),
    INDEX idx_alerts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'System alerts and notifications for business operations';

-- ============================================
-- 18. AI_INSIGHTS TABLE
-- AI-generated business insights with data storage
-- ============================================

CREATE TABLE ai_insights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    data JSON NULL,
    confidence_score DECIMAL(3,2) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_ai_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_ai_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
    CONSTRAINT chk_ai_expires CHECK (expires_at IS NULL OR expires_at > generated_at),
    
    -- Indexes
    INDEX idx_ai_business (business_id),
    INDEX idx_ai_type (business_id, insight_type),
    INDEX idx_ai_date (generated_at),
    INDEX idx_ai_active (business_id, is_active),
    INDEX idx_ai_business_type_date (business_id, insight_type, generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'AI-generated business insights and recommendations';

-- ============================================
-- 19. AUDIT_LOGS TABLE
-- Comprehensive system audit trail
-- ============================================

CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_audit_action CHECK (LENGTH(action) >= 2),
    CONSTRAINT chk_audit_entity CHECK (LENGTH(entity_type) >= 2),
    
    -- Indexes
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_date (created_at),
    INDEX idx_audit_user_action_date (user_id, action, created_at),
    INDEX idx_audit_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Comprehensive system audit trail for all operations';

-- ============================================
-- VALIDATION TRIGGERS FOR POLYMORPHIC REFERENCES
-- ============================================

-- Trigger: Validate delivery_tracking reference for orders
DELIMITER //

CREATE TRIGGER trg_validate_delivery_order_ref
BEFORE INSERT ON delivery_tracking
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    
    IF NEW.reference_type = 'order' THEN
        SELECT COUNT(*) INTO v_count
        FROM orders
        WHERE id = NEW.reference_id;
        
        IF v_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid order reference_id in delivery_tracking';
        END IF;
    END IF;
END //

-- Trigger: Validate delivery_tracking reference for purchase_orders
CREATE TRIGGER trg_validate_delivery_po_ref
BEFORE INSERT ON delivery_tracking
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    
    IF NEW.reference_type = 'purchase_order' THEN
        SELECT COUNT(*) INTO v_count
        FROM purchase_orders
        WHERE id = NEW.reference_id;
        
        IF v_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid purchase_order reference_id in delivery_tracking';
        END IF;
    END IF;
END //

-- Trigger: Validate inventory_transactions references
CREATE TRIGGER trg_validate_inventory_ref
BEFORE INSERT ON inventory_transactions
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    
    -- Validate reference if provided
    IF NEW.reference_type IS NOT NULL AND NEW.reference_id IS NOT NULL THEN
        CASE NEW.reference_type
            WHEN 'order_item' THEN
                SELECT COUNT(*) INTO v_count FROM order_items WHERE id = NEW.reference_id;
            WHEN 'purchase_order' THEN
                SELECT COUNT(*) INTO v_count FROM purchase_orders WHERE id = NEW.reference_id;
            WHEN 'manual' THEN
                SET v_count = 1; -- Always valid
            ELSE
                SET v_count = 0; -- Unknown reference type
        END CASE;
        
        IF v_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = CONCAT('Invalid reference: ', NEW.reference_type, ' id: ', NEW.reference_id);
        END IF;
    END IF;
END //

DELIMITER ;

-- ============================================
-- BUSINESS LOGIC TRIGGERS
-- ============================================

-- Trigger: After order item insert, update product stock
DELIMITER //

CREATE TRIGGER trg_order_item_stock_update
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    DECLARE v_business_id INT;
    DECLARE v_previous_stock DECIMAL(12,3);
    
    -- Get current stock and business_id
    SELECT stock_quantity, business_id 
    INTO v_previous_stock, v_business_id
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Decrease product stock
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Record inventory transaction
    INSERT INTO inventory_transactions (
        product_id, 
        business_id, 
        transaction_type, 
        quantity, 
        reference_type, 
        reference_id, 
        previous_stock,
        new_stock,
        notes,
        performed_by
    )
    VALUES (
        NEW.product_id,
        v_business_id,
        'stock_out',
        NEW.quantity,
        'order_item',
        NEW.id,
        v_previous_stock,
        v_previous_stock - NEW.quantity,
        CONCAT('Order item #', NEW.id, ' - Order #', NEW.order_id),
        NULL  -- Will be set by application if available
    );
END //

-- Trigger: After purchase order status update to 'received'
CREATE TRIGGER trg_purchase_order_received
AFTER UPDATE ON purchase_orders
FOR EACH ROW
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_product_id INT;
    DECLARE v_quantity DECIMAL(12,3);
    DECLARE v_previous_stock DECIMAL(12,3);
    DECLARE v_cur CURSOR FOR 
        SELECT product_id, received_quantity 
        FROM purchase_order_items 
        WHERE purchase_order_id = NEW.id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    IF NEW.status = 'received' AND OLD.status != 'received' THEN
        OPEN v_cur;
        
        read_loop: LOOP
            FETCH v_cur INTO v_product_id, v_quantity;
            IF v_done THEN
                LEAVE read_loop;
            END IF;
            
            -- Get current stock
            SELECT stock_quantity INTO v_previous_stock
            FROM products WHERE id = v_product_id;
            
            -- Update product stock
            UPDATE products 
            SET stock_quantity = stock_quantity + v_quantity,
                updated_at = NOW()
            WHERE id = v_product_id;
            
            -- Record inventory transaction
            INSERT INTO inventory_transactions (
                product_id, 
                business_id, 
                transaction_type, 
                quantity, 
                reference_type, 
                reference_id, 
                previous_stock,
                new_stock,
                notes,
                performed_by
            )
            VALUES (
                v_product_id,
                NEW.business_id,
                'stock_in',
                v_quantity,
                'purchase_order',
                NEW.id,
                v_previous_stock,
                v_previous_stock + v_quantity,
                CONCAT('Purchase Order #', NEW.order_number, ' received'),
                NEW.created_by
            );
        END LOOP;
        
        CLOSE v_cur;
        
        -- Update supplier metrics
        CALL sp_update_supplier_performance(NEW.supplier_id);
    END IF;
END //

DELIMITER ;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Update supplier performance metrics
DELIMITER //

CREATE PROCEDURE sp_update_supplier_performance(IN p_supplier_id INT)
BEGIN
    DECLARE v_total INT;
    DECLARE v_delayed INT;
    DECLARE v_on_time DECIMAL(5,2);
    DECLARE v_avg_delivery DECIMAL(5,1);
    DECLARE v_score DECIMAL(3,2);
    
    -- Calculate total purchase orders
    SELECT COUNT(*) INTO v_total
    FROM purchase_orders 
    WHERE supplier_id = p_supplier_id 
    AND status NOT IN ('cancelled');
    
    -- Calculate delayed orders
    SELECT COUNT(*) INTO v_delayed
    FROM purchase_orders 
    WHERE supplier_id = p_supplier_id 
    AND status IN ('delayed', 'received')
    AND actual_delivery_date > expected_delivery_date;
    
    -- Calculate on-time percentage
    IF v_total > 0 THEN
        SET v_on_time = ((v_total - v_delayed) / v_total) * 100;
    ELSE
        SET v_on_time = 100.00;
    END IF;
    
    -- Calculate average delivery time
    SELECT COALESCE(AVG(DATEDIFF(actual_delivery_date, order_date)), 0)
    INTO v_avg_delivery
    FROM purchase_orders
    WHERE supplier_id = p_supplier_id
    AND actual_delivery_date IS NOT NULL;
    
    -- Calculate performance score (1-5 scale)
    SET v_score = (v_on_time / 100) * 5;
    IF v_score > 5 THEN SET v_score = 5; END IF;
    IF v_score < 1 THEN SET v_score = 1; END IF;
    
    -- Update supplier record
    UPDATE suppliers
    SET 
        total_orders = v_total,
        delayed_orders = v_delayed,
        on_time_percentage = v_on_time,
        avg_delivery_time = v_avg_delivery,
        performance_score = v_score,
        updated_at = NOW()
    WHERE id = p_supplier_id;
END //

-- Procedure: Check and create stock alerts
CREATE PROCEDURE sp_check_stock_alerts(IN p_business_id INT)
BEGIN
    -- Clear old resolved alerts (older than 7 days and read)
    DELETE FROM alerts 
    WHERE business_id = p_business_id 
    AND is_read = TRUE 
    AND resolved = TRUE
    AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Check for out of stock products
    INSERT INTO alerts (business_id, product_id, alert_type, message, severity)
    SELECT 
        p.business_id,
        p.id,
        'stock_out',
        CONCAT('Product "', p.name, '" is out of stock. Current stock: ', p.stock_quantity, ' ', p.unit),
        'critical'
    FROM products p
    WHERE p.business_id = p_business_id
    AND p.is_active = TRUE
    AND p.stock_quantity <= 0
    AND NOT EXISTS (
        SELECT 1 FROM alerts a 
        WHERE a.product_id = p.id 
        AND a.alert_type = 'stock_out' 
        AND a.resolved = FALSE
        AND a.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    );
    
    -- Check for low stock products
    INSERT INTO alerts (business_id, product_id, alert_type, message, severity)
    SELECT 
        p.business_id,
        p.id,
        'reorder',
        CONCAT('Low stock alert: "', p.name, '" has only ', p.stock_quantity, ' ', 
               p.unit, ' remaining. Min level: ', p.min_stock_level, ' ', p.unit),
        CASE 
            WHEN p.stock_quantity = 0 THEN 'critical'
            WHEN p.stock_quantity <= (p.min_stock_level * 0.5) THEN 'high'
            ELSE 'medium'
        END
    FROM products p
    WHERE p.business_id = p_business_id
    AND p.is_active = TRUE
    AND p.stock_quantity <= p.min_stock_level
    AND p.stock_quantity > 0
    AND NOT EXISTS (
        SELECT 1 FROM alerts a 
        WHERE a.product_id = p.id 
        AND a.alert_type = 'reorder' 
        AND a.resolved = FALSE
        AND a.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    );
END //

-- Procedure: Capture shipping address snapshot for orders
CREATE PROCEDURE sp_capture_shipping_snapshot(IN p_order_id INT)
BEGIN
    DECLARE v_address_json JSON;
    
    SELECT JSON_OBJECT(
        'address_line', a.address_line,
        'city', a.city,
        'state', a.state,
        'pincode', a.pincode,
        'type', a.type
    ) INTO v_address_json
    FROM addresses a
    INNER JOIN orders o ON a.id = o.shipping_address_id
    WHERE o.id = p_order_id;
    
    UPDATE orders 
    SET shipping_address_snapshot = v_address_json,
        updated_at = NOW()
    WHERE id = p_order_id;
END //

DELIMITER ;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: Product stock status
CREATE OR REPLACE VIEW v_product_stock_status AS
SELECT 
    p.id,
    p.business_id,
    b.name AS business_name,
    p.name AS product_name,
    p.category,
    p.brand,
    p.unit,
    p.price,
    p.cost_price,
    p.stock_quantity,
    p.min_stock_level,
    p.max_stock_level,
    CASE 
        WHEN p.stock_quantity <= 0 THEN 'Out of Stock'
        WHEN p.stock_quantity <= p.min_stock_level THEN 'Low Stock'
        WHEN p.max_stock_level IS NOT NULL AND p.stock_quantity >= p.max_stock_level THEN 'Overstocked'
        WHEN p.stock_quantity <= (p.min_stock_level * 2) THEN 'Adequate'
        ELSE 'Well Stocked'
    END AS stock_status,
    CASE
        WHEN p.stock_quantity <= 0 THEN 'critical'
        WHEN p.stock_quantity <= p.min_stock_level THEN 'high'
        WHEN p.stock_quantity <= (p.min_stock_level * 2) THEN 'medium'
        ELSE 'low'
    END AS risk_level,
    COUNT(sp.supplier_id) AS supplier_count,
    p.updated_at
FROM products p
INNER JOIN businesses b ON p.business_id = b.id
LEFT JOIN supplier_products sp ON p.id = sp.product_id
WHERE p.is_active = TRUE
GROUP BY p.id, b.id;

-- View: Daily sales summary
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
    DATE(o.order_date) AS sale_date,
    o.business_id,
    b.name AS business_name,
    b.type AS business_type,
    COUNT(DISTINCT o.id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    COALESCE(SUM(o.total_amount), 0) AS total_revenue,
    COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
    COALESCE(SUM(o.discount_amount), 0) AS total_discounts,
    SUM(CASE WHEN o.payment_method = 'online' THEN 1 ELSE 0 END) AS online_orders,
    SUM(CASE WHEN o.payment_method = 'cod' THEN 1 ELSE 0 END) AS cod_orders,
    SUM(CASE WHEN o.order_status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
    SUM(CASE WHEN o.order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
FROM orders o
INNER JOIN businesses b ON o.business_id = b.id
WHERE o.order_status NOT IN ('cancelled', 'placed')
GROUP BY DATE(o.order_date), o.business_id, b.id
ORDER BY sale_date DESC, total_revenue DESC;

-- View: Supplier performance
CREATE OR REPLACE VIEW v_supplier_performance AS
SELECT 
    s.id,
    s.business_id,
    b.name AS business_name,
    s.name AS supplier_name,
    s.company_name,
    s.total_orders,
    s.delayed_orders,
    s.on_time_percentage,
    s.performance_score,
    s.avg_delivery_time,
    COUNT(po.id) AS recent_orders_90_days,
    COALESCE(AVG(DATEDIFF(po.actual_delivery_date, po.expected_delivery_date)), 0) AS avg_delay_days,
    COALESCE(SUM(CASE WHEN po.status = 'received' THEN 1 ELSE 0 END), 0) AS completed_orders,
    COALESCE(SUM(CASE WHEN po.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_orders
FROM suppliers s
INNER JOIN businesses b ON s.business_id = b.id
LEFT JOIN purchase_orders po ON s.id = po.supplier_id 
    AND po.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
WHERE s.is_active = TRUE
GROUP BY s.id, b.id;

COMMIT;