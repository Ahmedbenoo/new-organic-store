/*
  Align public.products with CatalogProduct (src/lib/types.ts)

  Safe for remote databases that may have a partial or legacy schema.
  Adds every column required by products-store.ts and removes weight_key.
*/

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY
);

-- Ensure id is text (slug), not uuid, on existing remote tables.
DO $$
DECLARE
  fk record;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'id'
      AND udt_name = 'uuid'
  ) THEN
    FOR fk IN
      SELECT
        format('%I.%I', nsp.nspname, rel.relname) AS fq_table,
        con.conname AS constraint_name
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE con.contype = 'f'
        AND con.confrelid = 'public.products'::regclass
    LOOP
      EXECUTE format(
        'ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I',
        fk.fq_table,
        fk.constraint_name
      );
    END LOOP;

    TRUNCATE TABLE public.products;

    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_pkey;
    ALTER TABLE public.products ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.products
      ALTER COLUMN id TYPE text USING id::text;
    ALTER TABLE public.products ADD PRIMARY KEY (id);
  END IF;
END $$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS default_quantity integer,
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS active boolean,
  ADD COLUMN IF NOT EXISTS sort_order integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE products
SET
  name_ar = COALESCE(name_ar, name_en, ''),
  name_en = COALESCE(name_en, name_ar, ''),
  description_ar = COALESCE(description_ar, ''),
  description_en = COALESCE(description_en, ''),
  price = COALESCE(price, 0),
  category = COALESCE(category, 'natural-honey'),
  emoji = COALESCE(emoji, '🍯'),
  unit = COALESCE(unit, 'fixed'),
  kind = COALESCE(kind, 'standard'),
  image_url = COALESCE(image_url, ''),
  active = COALESCE(active, true),
  sort_order = COALESCE(sort_order, 0),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, created_at, now())
WHERE
  name_ar IS NULL
  OR name_en IS NULL
  OR description_ar IS NULL
  OR description_en IS NULL
  OR price IS NULL
  OR category IS NULL
  OR emoji IS NULL
  OR unit IS NULL
  OR kind IS NULL
  OR image_url IS NULL
  OR active IS NULL
  OR sort_order IS NULL
  OR created_at IS NULL
  OR updated_at IS NULL;

ALTER TABLE products
  ALTER COLUMN name_ar SET DEFAULT '',
  ALTER COLUMN name_ar SET NOT NULL,
  ALTER COLUMN name_en SET DEFAULT '',
  ALTER COLUMN name_en SET NOT NULL,
  ALTER COLUMN description_ar SET DEFAULT '',
  ALTER COLUMN description_ar SET NOT NULL,
  ALTER COLUMN description_en SET DEFAULT '',
  ALTER COLUMN description_en SET NOT NULL,
  ALTER COLUMN price SET DEFAULT 0,
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN category SET DEFAULT 'natural-honey',
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN emoji SET DEFAULT '🍯',
  ALTER COLUMN emoji SET NOT NULL,
  ALTER COLUMN unit SET DEFAULT 'fixed',
  ALTER COLUMN unit SET NOT NULL,
  ALTER COLUMN kind SET DEFAULT 'standard',
  ALTER COLUMN kind SET NOT NULL,
  ALTER COLUMN image_url SET DEFAULT '',
  ALTER COLUMN image_url SET NOT NULL,
  ALTER COLUMN active SET DEFAULT true,
  ALTER COLUMN active SET NOT NULL,
  ALTER COLUMN sort_order SET DEFAULT 0,
  ALTER COLUMN sort_order SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE products DROP COLUMN IF EXISTS weight_key;

ALTER TABLE products DROP COLUMN IF EXISTS name;
ALTER TABLE products DROP COLUMN IF EXISTS description;
ALTER TABLE products DROP COLUMN IF EXISTS image;
ALTER TABLE products DROP COLUMN IF EXISTS category_id;
ALTER TABLE products DROP COLUMN IF EXISTS stock;
ALTER TABLE products DROP COLUMN IF EXISTS inventory;
ALTER TABLE products DROP COLUMN IF EXISTS sku;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_check;
ALTER TABLE products
  ADD CONSTRAINT products_unit_check CHECK (unit IN ('fixed', 'perGram'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_kind_check;
ALTER TABLE products
  ADD CONSTRAINT products_kind_check CHECK (kind IN ('standard', 'custom', 'announcement'));

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

CREATE OR REPLACE FUNCTION public.set_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_products_updated_at();

NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN products.unit IS 'fixed | perGram';
COMMENT ON COLUMN products.default_quantity IS 'Default grams for perGram products';
COMMENT ON COLUMN products.kind IS 'standard | custom | announcement';
