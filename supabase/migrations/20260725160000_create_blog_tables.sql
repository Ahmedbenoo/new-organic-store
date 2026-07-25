/*
  Blog page settings and posts for blog-store.ts.
*/

CREATE TABLE IF NOT EXISTS blog_page_settings (
  id integer PRIMARY KEY DEFAULT 1,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_page_settings_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id text PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  excerpt_ar text NOT NULL DEFAULT '',
  excerpt_en text NOT NULL DEFAULT '',
  content_ar text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '📝',
  date text NOT NULL DEFAULT '',
  read_time integer NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blog_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_blog_page_settings" ON blog_page_settings;
CREATE POLICY "anon_select_blog_page_settings" ON blog_page_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_blog_page_settings" ON blog_page_settings;
CREATE POLICY "anon_insert_blog_page_settings" ON blog_page_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_blog_page_settings" ON blog_page_settings;
CREATE POLICY "anon_update_blog_page_settings" ON blog_page_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_blog_page_settings" ON blog_page_settings;
CREATE POLICY "anon_delete_blog_page_settings" ON blog_page_settings FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_blog_posts" ON blog_posts;
CREATE POLICY "anon_select_blog_posts" ON blog_posts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_blog_posts" ON blog_posts;
CREATE POLICY "anon_insert_blog_posts" ON blog_posts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_blog_posts" ON blog_posts;
CREATE POLICY "anon_update_blog_posts" ON blog_posts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_blog_posts" ON blog_posts;
CREATE POLICY "anon_delete_blog_posts" ON blog_posts FOR DELETE
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_posts_updated_at();

CREATE OR REPLACE FUNCTION public.set_blog_page_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_page_settings_set_updated_at ON blog_page_settings;
CREATE TRIGGER blog_page_settings_set_updated_at
  BEFORE UPDATE ON blog_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_page_settings_updated_at();

NOTIFY pgrst, 'reload schema';
