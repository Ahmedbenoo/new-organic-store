/*
  Align public.orders with Order (src/lib/types.ts).

  Legacy remote tables may use phone/address instead of customer_phone/customer_address
  and may be missing items, whatsapp_sent, and notes.
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  customer_address text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  whatsapp_sent boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS total integer,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS whatsapp_sent boolean,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'phone'
  ) THEN
    EXECUTE $sql$
      UPDATE orders
      SET customer_phone = COALESCE(NULLIF(customer_phone, ''), phone, '')
      WHERE phone IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'address'
  ) THEN
    EXECUTE $sql$
      UPDATE orders
      SET customer_address = COALESCE(NULLIF(customer_address, ''), address, '')
      WHERE address IS NOT NULL
    $sql$;
  END IF;
END $$;

UPDATE orders
SET
  customer_name = COALESCE(customer_name, ''),
  customer_phone = COALESCE(customer_phone, ''),
  customer_address = COALESCE(customer_address, ''),
  items = COALESCE(items, '[]'::jsonb),
  total = COALESCE(total, 0),
  status = COALESCE(status, 'pending'),
  whatsapp_sent = COALESCE(whatsapp_sent, false),
  notes = COALESCE(notes, ''),
  created_at = COALESCE(created_at, now())
WHERE
  customer_name IS NULL
  OR customer_phone IS NULL
  OR customer_address IS NULL
  OR items IS NULL
  OR total IS NULL
  OR status IS NULL
  OR whatsapp_sent IS NULL
  OR notes IS NULL
  OR created_at IS NULL;

ALTER TABLE orders
  ALTER COLUMN customer_name SET DEFAULT '',
  ALTER COLUMN customer_name SET NOT NULL,
  ALTER COLUMN customer_phone SET DEFAULT '',
  ALTER COLUMN customer_phone SET NOT NULL,
  ALTER COLUMN customer_address SET DEFAULT '',
  ALTER COLUMN customer_address SET NOT NULL,
  ALTER COLUMN items SET DEFAULT '[]',
  ALTER COLUMN items SET NOT NULL,
  ALTER COLUMN total SET DEFAULT 0,
  ALTER COLUMN total SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN whatsapp_sent SET DEFAULT false,
  ALTER COLUMN whatsapp_sent SET NOT NULL,
  ALTER COLUMN notes SET DEFAULT '',
  ALTER COLUMN notes SET NOT NULL;

ALTER TABLE orders DROP COLUMN IF EXISTS phone;
ALTER TABLE orders DROP COLUMN IF EXISTS address;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled'));

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

NOTIFY pgrst, 'reload schema';
