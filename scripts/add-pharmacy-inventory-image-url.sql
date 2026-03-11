-- Add image_url to pharmacy_inventory_items for S3 image URLs (Inventory-items/ folder).
-- Run once: psql $DATABASE_URL -f scripts/add-pharmacy-inventory-image-url.sql
ALTER TABLE pharmacy_inventory_items
ADD COLUMN IF NOT EXISTS image_url TEXT;
