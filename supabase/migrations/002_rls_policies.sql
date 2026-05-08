-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_requests ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES: Users can see all profiles, but only update their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (auth.uid() = id);

-- SERVICES/PRODUCTS: All authenticated users can SELECT
CREATE POLICY "services_select" ON services FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "products_select" ON products FOR SELECT USING (auth.uid() IS NOT NULL);

-- TRANSACTIONS: All authenticated users can SELECT
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- TRANSACTIONS: INSERT for all authenticated roles
CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- TRANSACTIONS: UPDATE — only non-voided, and role restriction for void
CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND status != 'voided'
    AND (
      -- Cashier/Doctor/Nurse: only draft/open, cannot void
      (get_my_role() IN ('cashier', 'doctor', 'nurse')
        AND status IN ('draft', 'open'))
      OR
      -- Admin/Manager: can update any non-voided
      (get_my_role() IN ('admin', 'manager'))
    )
  );

-- TRANSACTION ITEMS: Manage if transaction is editable
CREATE POLICY "items_select" ON transaction_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "items_insert" ON transaction_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM transactions 
    WHERE id = transaction_id AND status IN ('draft', 'open')
  )
);
CREATE POLICY "items_update" ON transaction_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM transactions 
    WHERE id = transaction_id AND status IN ('draft', 'open')
  )
);

-- AUDIT LOG: insert only (never update/delete)
CREATE POLICY "audit_insert" ON transaction_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_select_admin" ON transaction_audit_log
  FOR SELECT USING (get_my_role() IN ('admin', 'manager'));

-- DISCOUNT REQUESTS
CREATE POLICY "discount_select" ON discount_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "discount_insert" ON discount_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "discount_update_admin" ON discount_requests FOR UPDATE USING (get_my_role() IN ('admin', 'manager'));
