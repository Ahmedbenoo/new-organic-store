/*
  Supabase Storage bucket for product/media images (media-store.ts).

  Run in Supabase SQL Editor before using /api/media uploads.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read products images" ON storage.objects;
CREATE POLICY "Public read products images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Service role (used by API) bypasses RLS for INSERT/UPDATE/DELETE.
