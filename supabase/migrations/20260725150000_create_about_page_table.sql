/*
  About page singleton content for about-store.ts (AboutPageContent).
*/

CREATE TABLE IF NOT EXISTS about_page (
  id integer PRIMARY KEY DEFAULT 1,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT about_page_singleton CHECK (id = 1)
);

ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_about_page" ON about_page;
CREATE POLICY "anon_select_about_page" ON about_page FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_about_page" ON about_page;
CREATE POLICY "anon_insert_about_page" ON about_page FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_about_page" ON about_page;
CREATE POLICY "anon_update_about_page" ON about_page FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_about_page" ON about_page;
CREATE POLICY "anon_delete_about_page" ON about_page FOR DELETE
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_about_page_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS about_page_set_updated_at ON about_page;
CREATE TRIGGER about_page_set_updated_at
  BEFORE UPDATE ON about_page
  FOR EACH ROW
  EXECUTE FUNCTION public.set_about_page_updated_at();

NOTIFY pgrst, 'reload schema';
