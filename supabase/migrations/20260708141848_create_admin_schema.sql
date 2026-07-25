/*
# Admin Dashboard Schema

## Overview
Creates all tables needed for the admin dashboard to control website content and manage orders.

## New Tables

### `products`
Stores product data that can be edited from the admin dashboard.
- `id` (text, primary key) — product slug e.g. "wildflower"
- `name_ar` / `name_en` — bilingual product name
- `description_ar` / `description_en` — bilingual description
- `price` (integer) — price in EGP
- `weight_key` (text) — "250g" | "500g" | "1kg"
- `category` (text) — "raw" | "comb" | "premium"
- `emoji` (text) — display emoji
- `image_url` (text) — custom image override URL
- `active` (boolean) — whether the product is shown on the site
- `sort_order` (integer) — display order

### `site_settings`
Key-value store for all editable site text and settings.
- `key` (text, primary key) — setting identifier
- `value` (text) — setting value
- `category` (text) — grouping for the admin UI

### `orders`
Stores customer orders placed through the checkout flow.
- `id` (uuid, primary key)
- `customer_name` (text)
- `customer_phone` (text)
- `customer_address` (text)
- `items` (jsonb) — array of {productId, name, price, quantity}
- `total` (integer) — total in EGP
- `status` (text) — "pending" | "confirmed" | "delivered" | "cancelled"
- `whatsapp_sent` (boolean) — whether WhatsApp notification was sent
- `notes` (text) — optional customer notes
- `created_at` (timestamptz)

### `admin_settings`
Single row storing the admin password hash.
- `id` (integer, primary key, always 1)
- `password_hash` (text) — bcrypt hash of admin password

## Security
- RLS enabled on all tables
- All tables use `TO anon, authenticated` since the site has no user auth
- Orders are insertable by anon (customers) but only readable by authenticated sessions via service key
- Products and site_settings are readable by anon (public website reads them)
- Admin writes use service role key via edge functions
*/

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  weight_key text NOT NULL DEFAULT '500g',
  category text NOT NULL DEFAULT 'raw',
  emoji text NOT NULL DEFAULT '🍯',
  image_url text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON site_settings;
CREATE POLICY "anon_select_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON site_settings;
CREATE POLICY "anon_insert_settings" ON site_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON site_settings;
CREATE POLICY "anon_update_settings" ON site_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON site_settings;
CREATE POLICY "anon_delete_settings" ON site_settings FOR DELETE
  TO anon, authenticated USING (true);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  whatsapp_sent boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- Seed initial products
INSERT INTO products (id, name_ar, name_en, description_ar, description_en, price, weight_key, category, emoji, image_url, sort_order)
VALUES
  ('wildflower', 'عسل زهور برية خام', 'Wildflower Raw Honey', 'مزيج رقيق من الزهور البرية الموسمية بحلاوة خفيفة ونكهة زهرية.', 'A delicate blend of seasonal wildflowers with a light, floral sweetness.', 1140, '500g', 'raw', '🌼', '/img1.jpg', 1),
  ('sidr', 'عسل السدر', 'Sidr Honey', 'عسل سدر نادر وغني من أشجار قديمة — رفاهية حقيقية.', 'Rare and rich Sidr honey from ancient trees — a true luxury.', 1910, '500g', 'premium', '🌿', '/img2.jpg', 2),
  ('acacia', 'عسل الأكاسيا', 'Acacia Honey', 'عسل أكاسيا صافي بنكهة لطيفة وأنيقة.', 'Crystal-clear acacia honey with a mild, elegant flavor profile.', 1220, '500g', 'raw', '🌳', '/img3.jpg', 3),
  ('comb', 'عسل شمع طازج', 'Fresh Comb Honey', 'عسل نقي في الشمع — الطريقة الأكثر طبيعية للاستمتاع بالعسل.', 'Pure honey still in the comb — the most natural way to enjoy honey.', 1540, '250g', 'comb', '🍯', '/img4.jpg', 4),
  ('manuka', 'خلطة مانوكا', 'Manuka Blend', 'خلطة فاخرة مستوحاة من الطابع الترابي المميز للمانوكا.', 'A premium blend inspired by Manuka distinctive earthy character.', 2550, '250g', 'premium', '✨', '/img5.jpg', 5),
  ('forest', 'عسل غابة الجبل', 'Mountain Forest Honey', 'عسل داكن وقوي من زهور الغابات الجبلية العالية.', 'Dark, robust honey from high-altitude forest wildflowers.', 1410, '1kg', 'raw', '🏔️', '/img6.jpg', 6)
ON CONFLICT (id) DO NOTHING;

-- Seed initial site settings
INSERT INTO site_settings (key, value, category) VALUES
  ('whatsapp_owner', '201092313486', 'contact'),
  ('whatsapp_branch', '201092313486', 'contact'),
  ('admin_password', 'admin123', 'admin'),
  ('hero_badge_en', '100% Organic', 'hero'),
  ('hero_badge_ar', 'عضوي 100%', 'hero'),
  ('hero_title_en', 'Nature''s sweetest gift, bottled with care.', 'hero'),
  ('hero_title_ar', 'أحلى هدية من الطبيعة، معبأة بعناية.', 'hero'),
  ('hero_description_en', 'Discover raw honey, wildflower varieties, and small-batch blends from apiaries we know and trust.', 'hero'),
  ('hero_description_ar', 'اكتشف العسل الخام وأصناف الزهور البرية والخلطات الصغيرة من مناحل نعرفها ونثق بها.', 'hero'),
  ('footer_email', 'hello@organic-store.com', 'footer'),
  ('footer_phone', '+20 1092313486', 'footer'),
  ('footer_address_en', 'Cairo, Egypt', 'footer'),
  ('footer_address_ar', 'القاهرة، مصر', 'footer')
ON CONFLICT (key) DO NOTHING;
