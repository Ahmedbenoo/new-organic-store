ALTER TABLE products
  ADD COLUMN IF NOT EXISTS on_offer boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN products.on_offer IS 'When true, product appears in the Current Offers shop tab';
