-- Run once against your Postgres DB used by the app.
-- Stores INN / generic name for inventory rows so prescriptions can match
-- brand names on the Rx to products listed under the generic (or vice versa).

ALTER TABLE pharmacy_inventory_items
  ADD COLUMN IF NOT EXISTS generic_name TEXT;

COMMENT ON COLUMN pharmacy_inventory_items.generic_name IS
  'International nonproprietary name or primary active ingredient; used for prescription matching.';
