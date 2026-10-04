-- ============================================
-- StockSense AI - Migration 002
-- Add features: discovery, reviews, notifications
-- SAFE: no DROP, no DELETE, no TRUNCATE
-- ============================================

USE stock_sense_ai;

-- 1. Add location columns to businesses
ALTER TABLE businesses
  ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER pincode,
  ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;

-- 2. Add location index
ALTER TABLE businesses
  ADD INDEX idx_businesses_location (latitude, longitude);

-- 3. Create business_reviews table
CREATE TABLE IF NOT EXISTS business_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    rating TINYINT NOT NULL,
    review TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_review_per_order UNIQUE (order_id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    INDEX idx_reviews_business (business_id),
    INDEX idx_reviews_customer (customer_id),
    INDEX idx_reviews_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id INT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read),
    INDEX idx_notifications_user_created (user_id, created_at),
    INDEX idx_notifications_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Extend alerts enum with ai_insight
ALTER TABLE alerts
  MODIFY COLUMN alert_type ENUM(
    'stock_out',
    'dead_stock',
    'reorder',
    'payment_pending',
    'delivery_delayed',
    'ai_insight'
  ) NOT NULL;

-- 6. Create ratings summary view
CREATE OR REPLACE VIEW v_business_ratings AS
SELECT
    b.id AS business_id,
    COALESCE(ROUND(AVG(br.rating), 2), 0.00) AS avg_rating,
    COUNT(br.id) AS review_count
FROM businesses b
LEFT JOIN business_reviews br ON b.id = br.business_id
GROUP BY b.id;