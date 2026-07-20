-- ==========================================================
-- Security & Row Level Security (RLS) Policies Migration
-- ==========================================================

-- 1. Enable RLS on all main SaaS tables
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Cafes Security Policies
-- Public / Customers: Allow reading public branding & cafe info
CREATE POLICY "Public read active cafes" 
  ON cafes FOR SELECT 
  USING (is_activated = true OR is_activated IS NULL);

-- Allow inserting new cafes (for registration / onboarding)
CREATE POLICY "Allow public cafe creation" 
  ON cafes FOR INSERT 
  WITH CHECK (true);

-- Allow updates to cafes
CREATE POLICY "Allow cafe updates" 
  ON cafes FOR UPDATE 
  USING (true);

-- 3. Menu Items Security Policies
-- Public / Customers: Allow reading all menu items for ordering
CREATE POLICY "Public read menu items" 
  ON menu_items FOR SELECT 
  USING (true);

-- Allow menu management
CREATE POLICY "Allow menu management insert" 
  ON menu_items FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow menu management update" 
  ON menu_items FOR UPDATE 
  USING (true);

CREATE POLICY "Allow menu management delete" 
  ON menu_items FOR DELETE 
  USING (true);

-- 4. Orders Security Policies
-- Public / Customers & Waiters: Allow reading and placing orders
CREATE POLICY "Public order placement" 
  ON orders FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Public read orders" 
  ON orders FOR SELECT 
  USING (true);

CREATE POLICY "Allow order status updates" 
  ON orders FOR UPDATE 
  USING (true);

CREATE POLICY "Allow order deletion" 
  ON orders FOR DELETE 
  USING (true);
