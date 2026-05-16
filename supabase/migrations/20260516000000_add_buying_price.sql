-- Add buying_price column to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS buying_price numeric(12, 2) DEFAULT NULL;

COMMENT ON COLUMN products.buying_price IS 'Purchase / cost price per unit in MMK';
