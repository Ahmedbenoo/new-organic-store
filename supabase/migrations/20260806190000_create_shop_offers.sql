/*
  Shop offers — two fixed promotional slots for the Current Offers tab.
*/

CREATE TABLE IF NOT EXISTS shop_offers (
  id text PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  product_id text,
  badge_ar text NOT NULL DEFAULT '',
  badge_en text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shop_offers ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON TABLE shop_offers FROM anon, authenticated;
GRANT SELECT ON TABLE shop_offers TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_active_shop_offers" ON shop_offers;
CREATE POLICY "public_read_active_shop_offers"
ON shop_offers
FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE OR REPLACE FUNCTION public.set_shop_offers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_offers_set_updated_at ON shop_offers;
CREATE TRIGGER shop_offers_set_updated_at
  BEFORE UPDATE ON shop_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_shop_offers_updated_at();

INSERT INTO shop_offers (
  id,
  title_ar,
  title_en,
  description_ar,
  description_en,
  image_url,
  product_id,
  badge_ar,
  badge_en,
  active,
  sort_order
)
VALUES
  (
    'shop-offer-1',
    'عرض عسل الزهور',
    'Blossom Honey Offer',
    'خصم على عسل الزهور الطبيعي — جودة عضوية 100%',
    'Save on natural blossom honey — 100% organic quality',
    '/assets/img1.jpeg',
    'clover-blossom',
    'خصم 15%',
    '15% OFF',
    true,
    1
  ),
  (
    'shop-offer-2',
    'عرض عسل السدر',
    'Sidr Honey Offer',
    'عرض محدود على عسل السدر المصري الأصلي',
    'Limited offer on authentic Egyptian Sidr honey',
    '/assets/img1.jpeg',
    'sidr-egyptian',
    'عرض محدود',
    'Limited',
    true,
    2
  )
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
