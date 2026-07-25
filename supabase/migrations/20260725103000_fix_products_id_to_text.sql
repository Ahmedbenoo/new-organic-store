/*
  CatalogProduct.id is a slug string (e.g. "clover-blossom"), not uuid.
  Remote Supabase projects may have created products.id as uuid — convert it.
*/

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

NOTIFY pgrst, 'reload schema';
