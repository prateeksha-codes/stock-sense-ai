-- ============================================
-- StockSense AI - Migration 003
-- Adds discovery location to customer_profiles
--
-- SAFE MIGRATION:
--   - Only ADD COLUMN
--   - No data loss
--   - Existing rows get NULL (they'll be set by the user when needed)
-- ============================================

USE stock_sense_ai;

ALTER TABLE customer_profiles
  ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER pincode,
  ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;

-- Verification
-- DESC customer_profiles;