/*
  Remove legacy e-commerce columns from default Supabase products table.
  CatalogProduct uses name_ar/name_en, not name.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'name'
  ) THEN
    EXECUTE $sql$
      UPDATE products
      SET
        name_en = COALESCE(NULLIF(name_en, ''), name, ''),
        name_ar = COALESCE(NULLIF(name_ar, ''), name, '')
      WHERE name IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'description'
  ) THEN
    EXECUTE $sql$
      UPDATE products
      SET
        description_en = COALESCE(NULLIF(description_en, ''), description, ''),
        description_ar = COALESCE(NULLIF(description_ar, ''), description, '')
      WHERE description IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image'
  ) THEN
    EXECUTE $sql$
      UPDATE products
      SET image_url = COALESCE(NULLIF(image_url, ''), image, '')
      WHERE image IS NOT NULL
    $sql$;
  END IF;
END $$;

ALTER TABLE products DROP COLUMN IF EXISTS name;
ALTER TABLE products DROP COLUMN IF EXISTS description;
ALTER TABLE products DROP COLUMN IF EXISTS image;
ALTER TABLE products DROP COLUMN IF EXISTS category_id;
ALTER TABLE products DROP COLUMN IF EXISTS stock;
ALTER TABLE products DROP COLUMN IF EXISTS inventory;
ALTER TABLE products DROP COLUMN IF EXISTS sku;

NOTIFY pgrst, 'reload schema';
