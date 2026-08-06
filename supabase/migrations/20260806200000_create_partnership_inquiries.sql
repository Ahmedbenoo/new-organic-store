CREATE TABLE IF NOT EXISTS partnership_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT '',
  company_field text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  inquiry_subject text NOT NULL DEFAULT '',
  inquiry_details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partnership_inquiries ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON TABLE partnership_inquiries FROM anon, authenticated;
GRANT SELECT ON TABLE partnership_inquiries TO anon, authenticated;

ALTER TABLE partnership_inquiries DROP CONSTRAINT IF EXISTS partnership_inquiries_status_check;
ALTER TABLE partnership_inquiries
  ADD CONSTRAINT partnership_inquiries_status_check
  CHECK (status IN ('new', 'reviewed', 'contacted', 'closed'));

NOTIFY pgrst, 'reload schema';
