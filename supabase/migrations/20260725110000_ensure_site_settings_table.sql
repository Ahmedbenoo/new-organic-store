/*
  Ensure public.site_settings exists for settings-store.ts (key/value store).
  Safe to run on remote projects that only have a legacy "settings" table.
*/

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
  ('footer_phone', '01092313486', 'footer'),
  ('footer_address_en', 'Cairo, Egypt', 'footer'),
  ('footer_address_ar', 'القاهرة، مصر', 'footer')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
