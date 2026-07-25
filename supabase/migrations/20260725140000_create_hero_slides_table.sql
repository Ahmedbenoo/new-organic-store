/*
  Hero slider slides for slider-store.ts (HeroSlide model).
*/

CREATE TABLE IF NOT EXISTS hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  label_ar text NOT NULL DEFAULT '',
  product_id text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hero_slides" ON hero_slides;
CREATE POLICY "anon_select_hero_slides" ON hero_slides FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_hero_slides" ON hero_slides;
CREATE POLICY "anon_insert_hero_slides" ON hero_slides FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hero_slides" ON hero_slides;
CREATE POLICY "anon_update_hero_slides" ON hero_slides FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_hero_slides" ON hero_slides;
CREATE POLICY "anon_delete_hero_slides" ON hero_slides FOR DELETE
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_hero_slides_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hero_slides_set_updated_at ON hero_slides;
CREATE TRIGGER hero_slides_set_updated_at
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.set_hero_slides_updated_at();

NOTIFY pgrst, 'reload schema';
