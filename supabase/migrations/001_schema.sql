-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Linked to auth.users)
CREATE TYPE user_role AS ENUM ('cashier', 'doctor', 'nurse', 'admin', 'manager');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('consultation', 'procedure')),
  default_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 3. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 4. Transactions
CREATE TYPE transaction_status AS ENUM ('draft', 'open', 'paid', 'voided');
CREATE TYPE payment_method AS ENUM ('cash', 'qr_ewallet', 'split');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL, -- Assuming a patients table exists or will exist
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  invoice_no TEXT UNIQUE NOT NULL,
  status transaction_status NOT NULL DEFAULT 'draft',
  payment_method payment_method,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_reason TEXT,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10, 2),
  change_amount NUMERIC(10, 2),
  void_reason TEXT,
  voided_by UUID REFERENCES profiles(id),
  voided_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Transaction Items
CREATE TYPE item_type AS ENUM ('consultation', 'procedure', 'medication');

CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  service_id UUID REFERENCES services(id),
  product_id UUID REFERENCES products(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  is_removed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Audit Log
CREATE TYPE audit_action AS ENUM (
  'created', 'item_added', 'item_removed', 'qty_changed', 
  'discount_applied', 'payment_changed', 'paid', 'voided'
);

CREATE TABLE transaction_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  action audit_action NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Discount Requests (Mentioned in the doc)
CREATE TABLE discount_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  discount_amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Functions for stock management
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock_qty = stock_qty + qty WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
